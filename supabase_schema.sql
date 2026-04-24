-- Script para inicializar o banco de dados da área administrativa v2
-- Execute este script no SQL Editor do seu projeto Supabase

-- REMOVER TABELAS ANTIGAS PARA REFAZER COM IDS FLEXÍVEIS
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS site_content;

-- 1. TABELA DE CATEGORIAS
CREATE TABLE categorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE PRODUTOS
CREATE TABLE produtos (
    id TEXT PRIMARY KEY, -- Mudamos para TEXT para aceitar os IDs originais do menu-data.js (ex: sd-01)
    category_slug TEXT REFERENCES categorias(slug) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 999,
    is_grouped BOOLEAN DEFAULT false,
    variants JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE CONTEÚDO DINÂMICO (Textos, Banners, Configs)
CREATE TABLE site_content (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
CREATE POLICY "Permitir leitura pública de categorias" ON categorias FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de produtos" ON produtos FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de conteúdo" ON site_content FOR SELECT USING (true);

-- USUÁRIOS DO PAINEL ADMIN (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    role TEXT DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
    ultimo_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS para segurança real
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Apenas Admins podem gerenciar usuários" ON usuarios FOR ALL USING (true); -- Permitiremos tudo internamente via Service Key no backend no início

-- NOVAS TABELAS: CONFIGS DA LOJA E LOGÍSTICA
CREATE TABLE IF NOT EXISTS configuracoes_loja (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS horarios_funcionamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_semana INT NOT NULL, -- 0 (Domingo) a 6 (Sábado)
  abertura TIME,
  fechamento TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  UNIQUE(dia_semana)
);

-- RLS para novas tabelas
ALTER TABLE configuracoes_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_funcionamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read configs" ON configuracoes_loja FOR SELECT USING (true);
CREATE POLICY "Allow public read hours" ON horarios_funcionamento FOR SELECT USING (true);

