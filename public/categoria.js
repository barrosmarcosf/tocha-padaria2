// PEGAR SLUG
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

async function carregarCategoria() {
  if (!slug) {
    document.getElementById("categoriaTitulo").innerText = "Categoria não encontrada";
    return;
  }

  // 1. BUSCAR DADOS
  // Adaptado para usar o endpoint já configurado e seguro do projeto Tocha Padaria
  try {
    const response = await fetch('/api/config');
    const data = await response.json();
    
    const categoria = data.categorias.find(c => c.slug === slug);
    if (!categoria) {
      document.getElementById("categoriaTitulo").innerText = "Categoria não encontrada";
      return;
    }

    document.getElementById("categoriaTitulo").innerText = categoria.title || categoria.nome;
    document.getElementById("categoriaSubtitulo").innerText = categoria.description || categoria.descricao || '';

    // 2. BUSCAR PRODUTOS
    const produtos = data.produtos.filter(p => p.category_slug === slug);

    renderProdutos(produtos);
  } catch (error) {
    console.error("Erro ao carregar os dados:", error);
    document.getElementById("categoriaTitulo").innerText = "Erro ao carregar";
  }
}

function renderProdutos(produtos) {
  const container = document.getElementById("produtosGrid");

  container.innerHTML = produtos.map(p => {
    const imgPath = p.image_url && p.image_url.startsWith('http') ? p.image_url : '/' + p.image_url;
    const isEsgotado = p.stock_quantity === 0;
    
    return `
      <div class="card">
        <img src="${imgPath}" alt="${p.name}" loading="lazy" />
        <div class="card-content">
          <h3>${p.name}</h3>
          <p>${p.description || ''}</p>
          <strong>R$ ${p.price.toFixed(2).replace('.', ',')}</strong>
          <button 
            onclick="addAoCarrinho('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, ${p.stock_quantity})" 
            ${isEsgotado ? 'disabled' : ''}>
            ${isEsgotado ? 'ESGOTADO' : 'COMPRAR'}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// 4. CARRINHO (Integrado com o sistema existente de cart.js)
window.addAoCarrinho = function(id, name, price, stock) {
  if (window.addDirectToCart) {
    window.addDirectToCart(id, name, price, 1, stock);
    if (window.openCart) window.openCart(true); // Abre o modal do carrinho
  }
};

// Iniciar
carregarCategoria();
