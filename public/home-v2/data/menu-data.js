// ============================================================
// DATA
// ============================================================
const MENU_DATA = {
  Sourdough: {
    icon: "🍞",
    desc: "O coração da Tocha. Fermentação natural, dias de processo.",
    items: [
      { id: 801, name: "Sourdough Tradicional", price: 38, desc: "O pão que começou tudo. Levain vivo, farinha de qualidade, longa fermentação. Casca que racha.", tag: "Clássico", img: "https://www.tochapadaria.com/assets/sourdough.jpg" },
      { id: 802, name: "Sourdough Integral", price: 40, desc: "Farinha integral, miolo denso e úmido, sabor levemente adocicado. Nutritivo e delicioso.", tag: null, img: "" },
      { id: 803, name: "Sourdough Gorgonzola", price: 46, desc: "Pedaços de gorgonzola derretidos na massa. Para os apreciadores de queijo.", tag: "Especial", img: "" },
      { id: 804, name: "Sourdough Parmesão", price: 44, desc: "Parmesão ralado incorporado à massa — sabor umami intenso com casca dourada e crocante.", tag: null, img: "" },
      { id: 805, name: "Sourdough Provolone", price: 44, desc: "Defumado e marcante. Provolone leva o sourdough para outro patamar.", tag: null, img: "" },
      { id: 806, name: "Sourdough Multi Grãos", price: 42, desc: "Mix de grãos: linhaça, gergelim, chia, aveia. Textura, nutrição e sabor.", tag: null, img: "" },
      { id: 807, name: "Sourdough Ervas com Queijos", price: 46, desc: "Ervas frescas e mix de queijos. Aromático, sofisticado, inesquecível.", tag: "Favorito", img: "" },
      { id: 808, name: "Sourdough Azeitonas Pretas", price: 42, desc: "Azeitonas pretas picadas na massa. Mediterrâneo e com personalidade.", tag: null, img: "" },
      { id: 809, name: "Sourdough Cheddar, Bacon & Jalapeño", price: 48, desc: "Cheddar cremoso, bacon crocante e calor do jalapeño. Ousado e viciante.", tag: "Especial", img: "" },
      { id: 810, name: "Sourdough Cacau com Frutas Caramelizadas", price: 48, desc: "Cacau intenso com frutas caramelizadas na massa. Sourdough como sobremesa.", tag: "Exclusivo", img: "" }
    ]
  },

  Focaccias: {
    icon: "🫓",
    desc: "Azeite, sal grosso e toppings generosos.",
    items: [
      { id: 701, name: "Focaccia de Damasco & Gorgonzola", price: 36, desc: "Doçura do damasco com pungência do gorgonzola sobre a massa oleosa e crocante.", tag: "Especial", img: "" },
      { id: 702, name: "Focaccia de Cebola, Mel & Queijo", price: 34, desc: "Cebola caramelizada, mel e queijo. Trio clássico que nunca decepciona.", tag: "Favorito", img: "" },
      { id: 703, name: "Focaccia de Alecrim & Sal Grosso", price: 28, desc: "A focaccia em sua essência italiana. Azeite, alecrim e sal grosso. Simples e perfeita.", tag: "Clássico", img: "" },
      { id: 704, name: "Focaccia de Azeitonas Pretas", price: 30, desc: "Massa generosa com azeitonas pretas e ervas. Sabor mediterrâneo autêntico.", tag: null, img: "" },
      { id: 705, name: "Focaccia de Manteiga de Alho & Salsa", price: 32, desc: "Manteiga de alho derretida com salsa fresca. Irresistível, pede ser compartilhada.", tag: null, img: "" }
    ]
  },

  Brioches: {
    icon: "🥖",
    desc: "Massa macia e rica em manteiga — o brioche em sua forma mais pura.",
    items: [
      { id: 601, name: "Brioche Tradicional", price: 28, desc: "A receita clássica — massa amanteigada, levemente adocicada, macia e aerada. Perfeição.", tag: "Clássico", img: "" },
      { id: 602, name: "Brioche de Alho Assado", price: 32, desc: "Cabeças de alho assadas lentamente incorporadas à massa. Aromático e envolvente.", tag: null, img: "" },
      { id: 603, name: "Brioche de Azeitonas Pretas", price: 34, desc: "Azeitonas pretas picadas na massa. Sabor mediterrâneo, textura incrível.", tag: null, img: "" },
      { id: 604, name: "Brioche de Bacalhoada", price: 42, desc: "Bacalhau desfiado e temperado incorporado à massa brioche. Festa em cada fatia.", tag: "Especial", img: "" },
      { id: 605, name: "Brioche Calabresa & Chimichurri", price: 36, desc: "Calabresa artesanal com chimichurri fresco. Para os amantes de sabores intensos.", tag: null, img: "" },
      { id: 606, name: "Brioche Chocolate & Avelã", price: 34, desc: "Massa brioche com pedaços de chocolate e avelã torrada. Indulgência pura.", tag: "Favorito", img: "" },
      { id: 607, name: "Babka de Nutella & Chocolate", price: 38, desc: "Pão trançado com camadas de Nutella e chocolate. Visual incrível, sabor incrível.", tag: "Exclusivo", img: "" }
    ]
  },

  "Mini Brioches": {
    icon: "🧆",
    desc: "Entrada perfeita — mini, recheados, um de cada.",
    items: [
      { id: 501, name: "Pesto, Requeijão & Queijo", price: 11, desc: "Frescor do pesto com cremosidade do requeijão. Entrada sofisticada e leve.", tag: null, img: "" },
      { id: 502, name: "Gorgonzola & Cebola Caramelizada", price: 12, desc: "Intensidade do gorgonzola equilibrada pela doçura da cebola. Complexo e delicioso.", tag: "Favorito", img: "" },
      { id: 503, name: "Cogumelos, Shoyu & Queijo", price: 12, desc: "Umami profundo de cogumelos com shoyu e queijo fundido. Sofisticado.", tag: "Especial", img: "" },
      { id: 504, name: "Ganache de Banana Caramelizada", price: 11, desc: "Mini brioche doce com ganache cremosa e banana caramelizada. Sobremesa em miniatura.", tag: null, img: "" },
      { id: 505, name: "Baunilha, Mirtilo & Crumble", price: 12, desc: "Creme de baunilha, mirtilo fresco e crumble crocante. Elegante e refrescante.", tag: "Especial", img: "" },
      { id: 506, name: "Bacalhau Cremoso & Tapenade", price: 14, desc: "Bacalhau desfiado cremoso com tapenade de azeitonas. Clássico português em miniatura.", tag: null, img: "" },
      { id: 507, name: "Pepperoni & Queijo", price: 11, desc: "Pepperoni artesanal e queijo fundido. O favorito das crianças e dos adultos também.", tag: "Favorito", img: "" }
    ]
  },

  "Folhados & Tortas": {
  icon: "🥐",
  desc: "Massa folhada crocante, recheios que surpreendem.",
  items: [
    { id: 301, name: "Folhado de Queijos & Bacon", price: 16, desc: "Massa folhada dourada, mix de queijos e bacon. O salgado perfeito para qualquer hora.", tag: null, img: "" },
    { id: 302, name: "Pastel de Nata", price: 9, desc: "Receita portuguesa — massa folhada com creme de gema cremoso e caramelizado. Autêntico.", tag: "Clássico", img: "" },
    { id: 303, name: "New York Roll", price: 22, desc: "Croissant enrolado recheado e crocante. A versão que todo mundo ama, feita do zero.", tag: "Novidade", img: "" },
    { id: 304, name: "Mini Torta de Cebola", price: 14, desc: "Cebola caramelizada, creme e massa amanteigada. Um clássico da confeitaria salgada.", tag: null, img: "" },
    { id: 305, name: "Torta Grande de Cebola", price: 65, desc: "Para servir. A mesma receita amada, em formato generoso para compartilhar.", tag: "Para Servir", img: "" }
  ]
},

"Pão de Queijo": {
  icon: "🧀",
  desc: "Assados na hora, casca dourada, recheios que derretem.",
  items: [
    { id: 101, name: "Pão de Queijo Tradicional", price: 8, desc: "O clássico mineiro — crocante por fora, elástico e queijoso por dentro. Impossível comer só um.", tag: "Clássico", img: "" },
    { id: 102, name: "Recheado com Requeijão", price: 10, desc: "Pão de queijo com coração cremoso de requeijão. Quente, irresistível.", tag: null, img: "" },
    { id: 103, name: "Muçarela & Catupiry", price: 11, desc: "Dupla cremosa. Muçarela derretida abraçada por Catupiry dentro do pão de queijo.", tag: "Favorito", img: "" },
    { id: 104, name: "Cebola Caramelizada & Catupiry", price: 12, desc: "A doçura da cebola caramelizada com a cremosidade do Catupiry. Surpreendente.", tag: null, img: "" },
    { id: 105, name: "Cebola Caramelizada & Gorgonzola", price: 13, desc: "Doce + pungente + crocante. Uma experiência completa em cada mordida.", tag: "Especial", img: "" },
    { id: 106, name: "Goiabada & Gorgonzola", price: 13, desc: "O clássico brasileiro reinventado dentro do pão de queijo. Agridoce e memorável.", tag: "Exclusivo", img: "" },
    { id: 107, name: "Provolone & Tomilho", price: 13, desc: "Sabor defumado do provolone com frescor aromático do tomilho. Sofisticado.", tag: null, img: "" }
  ]
},

Confeitaria: {
  icon: "🍰",
  desc: "Doces artesanais com técnica e muito carinho.",
  items: [
    { id: 201, name: "Choux Profiteroles", price: 14, desc: "Massa choux leve e aerada, recheio cremoso, cobertura de chocolate. Leveza francesa.", tag: "Especial", img: "" },
    { id: 202, name: "Cookie Chocolate & Nutella", price: 12, desc: "Crocante nas bordas, mole no centro, com recheio de Nutella que escorre. Ponto perfeito.", tag: "Favorito", img: "" }
  ]
},

Lanches: {
  icon: "🍔",
  desc: "Pães artesanais que elevam qualquer recheio.",
  items: [
    { id: 401, name: "Pão Brioche Hambúrguer", price: 14, desc: "Brioche macio, levemente adocicado, com estrutura perfeita para o hambúrguer dos sonhos.", tag: null, img: "" },
    { id: 402, name: "Pão Brioche Hot Dog", price: 12, desc: "Alongado, macio, levemente tostado. Seu cachorro-quente vai para outro nível.", tag: null, img: "" },
    { id: 403, name: "Joelho Queijo, Presunto & Bechamel", price: 18, desc: "Pão artesanal recheado com queijo, presunto e molho bechamel. Clássico reconfortante.", tag: "Favorito", img: "" },
    { id: 404, name: "Joelho Linguiça, Requeijão & Erva Doce", price: 19, desc: "Linguiça artesanal, requeijão cremoso, toque de erva-doce. Saboroso e aromático.", tag: null, img: "" },
    { id: 405, name: "Cinnamon Roll Canela & Caramelo", price: 20, desc: "Espiral de massa brioche com canela e caramelo. Quentinho, pegajoso e irresistível.", tag: "Especial", img: "" }
  ]
} // ❗ SEM vírgula aqui

}; // ✅ FECHAMENTO DO MENU_DATA

// ============================================================
// FLAT
// ============================================================
const PRODUCTS_FLAT = Object.values(MENU_DATA).flatMap(cat => cat.items);

window.MENU_DATA = MENU_DATA;
window.PRODUCTS_FLAT = PRODUCTS_FLAT;