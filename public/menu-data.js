const menuData = [
    {
        id: "sourdoughs",
        title: "Sourdough",
        description: "O clássico da Tocha: casca crocante, miolo leve e macio.",
        image: "assets/sourdough.jpg",
        items: [
            { id: "sd-01", name: "Sourdough Tradicional (São João)", price: 62, desc: "O clássico da Tocha. Crosta caramelizada, miolo alveolado." },
            { id: "sd-02", name: "Sourdough Integral", price: 55, desc: "Farinha integral, sabor profundo e nutritivo." },
            { id: "sd-03", name: "Sourdough Gorgonzola", price: 68, desc: "Intenso, ousado, inesquecível." },
            { id: "sd-04", name: "Sourdough Parmesão", price: 68, desc: "Crosta dourada com parmesão caramelizado." },
            { id: "sd-05", name: "Sourdough Provolone", price: 68, desc: "Levemente defumado, harmonioso." },
            { id: "sd-06", name: "Sourdough Multi Grãos", price: 60, desc: "Cheio de textura e personalidade." },
            { id: "sd-07", name: "Sourdough Ervas com Queijos", price: 65, desc: "Ervas frescas e queijos selecionados." },
            { id: "sd-08", name: "Sourdough Azeitonas Pretas", price: 65, desc: "Mediterrâneo em cada fatia." },
            { id: "sd-09", name: "Sourdough Cheddar, Bacon & Jalapeño", price: 72, desc: "Para os que gostam de emoção." },
            { id: "sd-10", name: "Sourdough Cacau com Frutas Caramelizadas", price: 75, desc: "Chocolate, doce, complexo e único." }
        ]
    },
    {
        id: "focaccias",
        title: "Focaccias",
        description: "Clássicas italianas com azeite de ponta.",
        image: "assets/sourdough.jpg", // placeholder until they have real photos
        items: [
            { id: "fc-01", name: "Focaccia de Damasco & Gorgonzola", price: 38, desc: "Doce e salgado em perfeito equilíbrio." },
            { id: "fc-02", name: "Focaccia de Cebola, Mel & Queijo", price: 35, desc: "Caramelizado e irresistível." },
            { id: "fc-03", name: "Focaccia de Alecrim & Sal Grosso", price: 28, desc: "Clássica italiana, de alma." },
            { id: "fc-04", name: "Focaccia de Azeitonas Pretas", price: 30, desc: "Simples, honesta e deliciosa." },
            { id: "fc-05", name: "Focaccia de Manteiga de Alho & Salsa", price: 30, desc: "Aromática, com manteiga artesanal." }
        ]
    },
    {
        id: "brioches",
        title: "Brioches",
        description: "Manteiga, maciez e recheios indescritíveis.",
        image: "assets/sourdough.jpg",
        items: [
            { id: "br-01", name: "Brioche Tradicional", price: 38, desc: "Macio, amanteigado, perfeito." },
            { id: "br-02", name: "Brioche de Alho Assado", price: 42, desc: "Perfume irresistível, sabor memorável." },
            { id: "br-03", name: "Brioche de Azeitonas Pretas", price: 42, desc: "Salgado na medida certa." },
            { id: "br-04", name: "Brioche de Bacalhoada", price: 52, desc: "Sofisticado, com bacalhau cremoso." },
            { id: "br-05", name: "Brioche Calabresa & Chimichurri", price: 45, desc: "Picante com caráter." },
            { id: "br-06", name: "Brioche Chocolate & Avelã", price: 48, desc: "Indulgente, como deve ser." },
            { id: "bb-01", name: "Babbka de Nutella & Chocolate", price: 55, desc: "Calda aromática, textura de nuvem." }
        ]
    },
    {
        id: "mini-brioches",
        title: "Mini Brioches",
        description: "Perfeitos para entradas refinadas.",
        image: "assets/sourdough.jpg",
        items: [
            { id: "mb-01", name: "Pesto, Requeijão & Queijo", price: 20, desc: "Entrada perfeita." },
            { id: "mb-02", name: "Gorgonzola & Cebola Caramelizada", price: 20, desc: "Contraste perfeito." },
            { id: "mb-03", name: "Cogumelos, Shoyu & Queijo", price: 20, desc: "Umami e cremosidade." },
            { id: "mb-04", name: "Ganache de Banana Caramelizada", price: 18, desc: "Tropical e indulgente." },
            { id: "mb-05", name: "Baunilha, Mirtilo & Crumble", price: 20, desc: "Delicado e sofisticado." },
            { id: "mb-06", name: "Bacalhau Cremoso & Tapenade", price: 22, desc: "Refinado e diferente." },
            { id: "mb-07", name: "Pepperoni & Queijo", price: 20, desc: "Favorito de sempre." }
        ]
    },
    {
        id: "hamburguer-hotdog",
        title: "Lanches",
        description: "Pães brioches para Hambúrguer, Hot Dog e Joelhos.",
        image: "assets/sourdough.jpg",
        items: [
            { 
                id: "group-hb", 
                name: "Pão Brioche Hamburguer", 
                desc: "Macio, artesanal, sem igual.",
                isGrouped: true,
                variants: [
                    { id: "hb-01", label: "4 un", price: 22 },
                    { id: "hb-02", label: "6 un", price: 30 },
                    { id: "hb-03", label: "12 un", price: 55 }
                ]
            },
            { 
                id: "group-hd", 
                name: "Pão Brioche Hot Dog", 
                desc: "Perfeito para salsichas artesanais.",
                isGrouped: true,
                variants: [
                    { id: "hd-01", label: "4 un", price: 20 },
                    { id: "hd-02", label: "6 un", price: 28 },
                    { id: "hd-03", label: "12 un", price: 50 }
                ]
            },
            { id: "jo-01", name: "Joelho Queijo, Presunto & Bechamel", price: 24, desc: "Com molho bechamel." },
            { id: "jo-02", name: "Joelho Linguiça, Requeijão & Erva Doce", price: 24, desc: "Com erva doce." },
            { id: "cn-01", name: "Cinnamon Roll Canela & Caramelo", price: 22, desc: "Canela com caramelo salgado." }
        ]
    },
    {
        id: "folhados-tortas",
        title: "Folhados & Tortas",
        description: "Massa folhada incrivelmente crocante.",
        image: "assets/sourdough.jpg",
        items: [
            { id: "fl-01", name: "Folhado de Queijos & Bacon", price: 25, desc: "Gorgonzola, muçarela, parmesão, provolone, bechamel." },
            { id: "fl-02", name: "Pastel de Nata", price: 12, desc: "Receita portuguesa tradicional." },
            { id: "fl-03", name: "New York Roll", price: 22, desc: "Recheios à escolha. Informe o recheio no pedido." },
            { id: "tr-01", name: "Mini Torta de Cebola", price: 18, desc: "Cebolas tostadas levemente adocicadas." },
            { id: "tr-02", name: "Torta Grande de Cebola", price: 55, desc: "Para compartilhar." }
        ]
    },
    {
        id: "confeitaria",
        title: "Confeitaria & Doces",
        description: "A finalização perfeita.",
        image: "assets/sourdough.jpg",
        items: [
            { 
                id: "group-choux", 
                name: "Choux Profiteroles", 
                desc: "Nossa massa Choux leve e crocante com recheios artesanais.",
                isGrouped: true,
                variants: [
                    { id: "ch-01", label: "Chocolate Branco & Morango", price: 22 },
                    { id: "ch-02", label: "Chocolate Preto & Morango", price: 22 },
                    { id: "ch-03", label: "Limão Taiti & Curd Siciliano", price: 22 },
                    { id: "ch-04", label: "Creme de Cumaru", price: 24 },
                    { id: "ch-05", label: "Doce de Leite & Café", price: 24 },
                    { id: "ch-06", label: "Amendoim & Pé de Moleque", price: 22 },
                    { id: "ch-07", label: "Banoffe", price: 22 }
                ]
            },
            { id: "ck-01", name: "Cookie Chocolate & Nutella", price: 14, desc: "Simples assim. Perfeito assim." }
        ]
    },
    {
        id: "paes-queijo",
        title: "Pães de Queijo",
        description: "Nossa versão especial em vários recheios.",
        image: "assets/sourdough.jpg",
        items: [
            { id: "pq-01", name: "Pão de Queijo Tradicional", price: 8, desc: "Massa leve e queijuda." },
            { id: "pq-02", name: "Recheado com Requeijão", price: 10, desc: "Clássico molhadinho." },
            { id: "pq-03", name: "Muçarela & Catupiry", price: 10, desc: "Dobro de queijo." },
            { id: "pq-04", name: "Cebola Caramelizada & Catupiry", price: 10, desc: "Contraste fantástico." },
            { id: "pq-05", name: "Cebola Caramelizada & Gorgonzola", price: 12, desc: "Aroma e sabor indescritível." },
            { id: "pq-06", name: "Goiabada & Gorgonzola", price: 12, desc: "Romeu e Julieta de atitude." },
            { id: "pq-07", name: "Provolone & Tomilho", price: 12, desc: "Rústico e temperado." }
        ]
    }
];
