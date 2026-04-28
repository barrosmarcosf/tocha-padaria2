// PEGAR SLUG
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
let configCache = null;

async function carregarCategoria() {
  if (!slug) {
    document.getElementById("categoriaTitulo").innerText = "Categoria não encontrada";
    return;
  }

  try {
    // Busca configs e status da loja em paralelo
    const [configRes, statusRes] = await Promise.all([
      fetch('/api/config'),
      fetch('/api/store-status')
    ]);
    
    const data = await configRes.json();
    const storeStatus = statusRes.ok ? await statusRes.json() : null;
    
    const categoria = data.categorias.find(c => c.slug === slug);
    const tituloEl = document.getElementById("categoriaTitulo");
    const skeletonEl = document.getElementById("headerLoading");

    tituloEl.innerText = categoria.title || categoria.nome;
    tituloEl.style.display = 'block';
    if (skeletonEl) skeletonEl.style.display = 'none';

    document.getElementById("categoriaSubtitulo").innerText = categoria.description || categoria.descricao || '';

    // BUSCAR PRODUTOS
    const produtos = data.produtos.filter(p => p.category_slug === slug);

    renderProdutos(produtos, storeStatus);
  } catch (error) {
    console.error("Erro ao carregar os dados:", error);
    document.getElementById("categoriaTitulo").innerText = "Erro ao carregar";
    const skeletonEl = document.getElementById("headerLoading");
    if (skeletonEl) skeletonEl.style.display = 'none';
  }
}

function renderProdutos(produtos, storeStatus) {
  const container = document.getElementById("produtosGrid");
  
  // Extrai a data da fornada do status
  let entregaTexto = "Próxima Fornada";
  if (storeStatus && storeStatus.batchLabel) {
    entregaTexto = `Entrega: ${storeStatus.batchLabel}`;
  }

  container.innerHTML = produtos.map((p, index) => {
    // Forçando a imagem padrão conforme solicitado pelo mestre
    const imgPath = '/assets/sourdough.jpg';
    
    // Lógica para Esgotado ou Loja Fechada
    const isFechado = storeStatus && storeStatus.statusMode === 'closed';
    const isEsgotado = p.stock_quantity === 0;
    const isDisabled = isFechado || isEsgotado;
    
    // Otimização de performance: Prioridade alta para as primeiras 2 imagens
    const isPriority = index < 2 ? 'fetchpriority="high"' : '';
    
    let btnTexto = "COMPRAR AGORA";
    if (isFechado) btnTexto = "FECHADO";
    else if (isEsgotado) btnTexto = "ESGOTADO";
    
    return `
      <div class="produto-card">
        <img src="${imgPath}" alt="${p.name}" loading="${index < 4 ? 'eager' : 'lazy'}" ${isPriority} decoding="async" />
        <div class="produto-info">
          <div><span class="entrega">⛟ ${entregaTexto}</span></div>
          <h3>${p.name}</h3>
          <div class="rating-row">
            <span>★★★★★</span>
            <span style="color: #666; font-size: 10px;">(5.0)</span>
          </div>
          <p>${p.description || ''}</p>
          <div class="preco-row">
            <div class="preco">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
            <div class="qtd-selector">
              <button onclick="changeLocalQty('${p.id}', -1, ${p.stock_quantity})">−</button>
              <span id="local-qty-${p.id}">1</span>
              <button onclick="changeLocalQty('${p.id}', 1, ${p.stock_quantity})">+</button>
            </div>
          </div>
          <button class="btn-comprar" 
            onclick="addAoCarrinhoComQtd('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, ${p.stock_quantity})" 
            ${isDisabled ? 'disabled' : ''}>
            ${btnTexto}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// Controle de Quantidade Local
window.changeLocalQty = function(id, delta, maxStock) {
  const span = document.getElementById(`local-qty-${id}`);
  if (!span) return;
  let qty = parseInt(span.innerText);
  qty += delta;
  
  if (qty < 1) qty = 1;
  if (maxStock > 0 && qty > maxStock) {
    qty = maxStock;
    // Opcional: Toast de limite de estoque
  }
  span.innerText = qty;
};

// Integrado com o cart.js existente
window.addAoCarrinhoComQtd = function(id, name, price, stock) {
  const span = document.getElementById(`local-qty-${id}`);
  const qty = span ? parseInt(span.innerText) : 1;
  
  if (window.addDirectToCart) {
    window.addDirectToCart(id, name, price, qty, stock);
    if (window.openCart) window.openCart(true); // Abre o modal do carrinho
    
    // Retorna a quantidade para 1 após adicionar para facilitar nova compra
    if (span) span.innerText = 1;
  }
};

// Iniciar
carregarCategoria();
