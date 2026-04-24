-- Criar tabelas para gestão de estoque por fornada
CREATE TABLE IF NOT EXISTS fornadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bake_date DATE UNIQUE NOT NULL,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS produto_estoque_fornada (
    produto_id TEXT REFERENCES produtos(id) ON DELETE CASCADE,
    fornada_id UUID REFERENCES fornadas(id) ON DELETE CASCADE,
    estoque_base INTEGER DEFAULT 0,
    estoque_disponivel INTEGER DEFAULT 0,
    vendas_confirmadas INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (produto_id, fornada_id)
);

-- Adicionar initial_stock à tabela produtos para manter fallback de visualização
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS initial_stock INTEGER DEFAULT 0;

-- Habilitar RLS
ALTER TABLE fornadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_estoque_fornada ENABLE ROW LEVEL SECURITY;

-- Políticas simples
CREATE POLICY "Permitir leitura pública de fornadas" ON fornadas FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de estoques de fornada" ON produto_estoque_fornada FOR SELECT USING (true);
