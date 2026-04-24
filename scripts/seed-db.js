require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler o arquivo menu-data.js
const menuDataPath = path.join(__dirname, 'public', 'menu-data.js');
let menuDataContent = fs.readFileSync(menuDataPath, 'utf8');

// Extrair o array (Removendo "const menuData =" e o ";" final)
let jsonString = menuDataContent
  .replace(/const menuData\s*=\s*/, '')
  .trim();
if (jsonString.endsWith(';')) jsonString = jsonString.slice(0, -1);

// Importar os dados
const menuData = eval(jsonString);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function seed() {
    console.log("🚀 [SEED] Iniciando migração de dados para o Supabase...");
    console.log(`📦 Categorias: ${menuData.length}`);

    for (const [catIndex, cat] of menuData.entries()) {
        console.log(` > Processando categoria: ${cat.title} (${cat.id})`);
        
        // 1. Inserir Categoria
        const { error: catErr } = await supabase.from('categorias').upsert([{
            slug: cat.id,
            title: cat.title,
            description: cat.description,
            image_url: cat.image,
            display_order: catIndex,
            is_active: true
        }], { onConflict: 'slug' });

        if (catErr) {
            console.error(`❌ Erro Categoria ${cat.title}:`, catErr.message);
            continue;
        }

        // 2. Inserir Produtos
        for (const [prodIndex, item] of cat.items.entries()) {
            
            // Garantir que temos um ID válido
            const prodId = item.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            
            console.log(`   - Inserindo produto: ${item.name} (ID: ${prodId})`);

            const payload = {
                id: prodId,
                name: item.name,
                description: item.desc || '',
                price: item.price || 0,
                image_url: item.image || null,
                category_slug: cat.id,
                is_grouped: item.isGrouped || false,
                variants: item.variants || [],
                display_order: prodIndex,
                is_active: true
            };

            const { error: prodErr } = await supabase.from('produtos').upsert([payload], { onConflict: 'id' });

            if (prodErr) {
                console.error(`❌ Erro Produto ${item.name}:`, prodErr.message);
                console.error(`   Payload enviado:`, JSON.stringify(payload));
            }
        }
    }

    // 3. Inserir Conteúdo do Site
    console.log(" > Criando configurações iniciais do site...");
    const initialContent = [
        {
            key: 'hero',
            value: {
                eyebrow: 'Fermentação Natural',
                title: 'O pão que\ntransforma\no seu dia',
                description: 'Cada pão nasce de levain vivo, farinha de qualidade e tempo; não tem atalho, tem respeito.',
                image_url: 'assets/sourdough.jpg',
                button1_text: 'Ver Cardápio',
                button1_link: '#menu',
                button2_text: 'Nossa História',
                button2_link: 'nossa-historia.html'
            }
        },
        {
            key: 'contact',
            value: {
                whatsapp: '5521966278965',
                email: 'tocha.padariapagamentos@gmail.com',
                address: 'São João de Meriti, RJ',
                instagram_handle: 'tocha.padaria'
            }
        },
        {
            key: 'foodservice',
            value: {
                title: 'Foodservice',
                eyebrow: 'B2B & Alianças',
                description: 'Soluções artesanais desenvolvidas para restaurantes, bares, cafeterias e lanchonetes que buscam elevar padrão e experiência.\nTrabalhamos com uma linha pronta, consistente e de alta qualidade, com possibilidade de personalização dentro da nossa produção.',
                cta_text: 'Solicitar Proposta',
                images: [
                    'assets/foodservice1.png',
                    'assets/foodservice2.png',
                    'assets/foodservice3.png',
                    'assets/foodservice4.png'
                ]
            }
        },
        {
            key: 'footer',
            value: {
                description: 'Padaria informal com respeito à longa fermentação.\nFornadas aos sábados. Produção sob demanda.\nPeça com antecedência.',
                credits: '© Tocha Padaria desde 2022 entre idas e vindas, erros e acertos.\nNascido, criado e produzido em São João de Meriti.\nFeito com paciência e levain.'
            }
        }
    ];

    for (const content of initialContent) {
        const { error } = await supabase.from('site_content').upsert([content]);
        if (error) console.error(`❌ Erro Conteúdo ${content.key}:`, error.message);
    }

    console.log("\n✅ [SEED] Migração concluída com sucesso!");
    process.exit(0);
}

seed();
