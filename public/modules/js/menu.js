/**
 * Módulo: Menu (Cardápio)
 * Gerencia a visualização de categorias e produtos internamente.
 */
window.MenuModule = {
    state: {
        allCategories: [],
        allProducts: [],
        currentCategory: null
    },

    init(categories, products) {
        console.log("🛠 [MenuModule] Inicializando com", categories.length, "categorias e", products.length, "produtos");
        this.state.allCategories = categories;
        this.state.allProducts = products;
        this.renderCategories();
        this.setupEventListeners();
    },

    setupEventListeners() {
    },

    renderCategories() {
        console.log("🎨 [MenuModule] Renderizando categorias...");
        const catView = document.getElementById('categories-view');

        const prodView = document.getElementById('products-view');
        if (!catView) return;

        catView.style.display = 'grid';
        if (prodView) prodView.style.display = 'none';

        catView.innerHTML = '';
        this.state.allCategories.forEach(cat => {
            const imgPath = cat.image_url && cat.image_url.startsWith('http') ? cat.image_url : '/' + cat.image_url;
            const card = document.createElement('div');
            card.className = 'cat-main-card reveal';
            card.innerHTML = `
                <div class="prod-card-img-wrap">
                    <img src="${imgPath}" alt="${cat.title}" loading="lazy">
                </div>
                <div class="prod-card-info">
                    <h3>${cat.title}</h3>
                    <p>${cat.description}</p>
                </div>
            `;
            card.addEventListener('click', () => this.showProducts(cat));
            catView.appendChild(card);
        });

        // Re-inicia animações de reveal se necessário
        if (window.revealObserver) {
            document.querySelectorAll('.reveal').forEach(el => window.revealObserver.observe(el));
        }
    },

    showProducts(cat) {
        this.state.currentCategory = cat;
        const catView = document.getElementById('categories-view');
        const prodView = document.getElementById('products-view');
        if (!prodView) return;

        catView.style.display = 'none';
        prodView.style.display = 'block';
        prodView.innerHTML = '';

        // Botão Voltar
        const backBtn = document.createElement('div');
        backBtn.className = 'back-to-categories';
        backBtn.innerHTML = `<span>← Voltar para Categorias</span>`;
        backBtn.onclick = () => this.renderCategories();
        prodView.appendChild(backBtn);

        // Intro da Seção
        const intro = document.createElement('div');
        intro.className = 'section-intro';
        intro.innerHTML = `
            <h2 class="section-title">${cat.title}</h2>
            <p>${cat.description}</p>
        `;
        prodView.appendChild(intro);

        // Grid de Produtos
        const grid = document.createElement('div');
        grid.className = 'dyn-products-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        grid.style.gap = '2rem';

        const filteredProducts = this.state.allProducts.filter(p => p.category_slug === cat.slug);
        
        filteredProducts.forEach(prod => {
            const imgPath = prod.image_url && prod.image_url.startsWith('http') ? prod.image_url : '/' + prod.image_url;
            const card = document.createElement('div');
            card.className = 'dyn-prod-card';
            card.innerHTML = `
                <div class="prod-card-img-wrap">
                    <img src="${imgPath}" alt="${prod.name}">
                </div>
                <div class="prod-card-info">
                    <div class="scarcity-badge-container" data-id="${prod.id}"></div>
                    <h4 class="product-card-title">${prod.name}</h4>
                    <p>${prod.description || ''}</p>
                    <div class="product-price">R$ ${prod.price.toFixed(2).replace('.', ',')}</div>
                    <button class="btn-buy-now" data-id="${prod.id}" ${prod.stock_quantity === 0 ? 'disabled' : ''}>
                        ${prod.stock_quantity === 0 ? 'ESGOTADO' : 'COMPRAR AGORA'}
                    </button>
                </div>
            `;
            grid.appendChild(card);
            this.updateScarcityBadge(prod);
        });

        prodView.appendChild(grid);
        
        // Scroll para o topo da seção
        const menuSection = document.getElementById('menu');
        if (menuSection) {
            window.scrollTo({ top: menuSection.offsetTop - 80, behavior: 'smooth' });
        }
    },

    updateScarcityBadge(prod) {
        const badgeContainer = document.querySelector(`.scarcity-badge-container[data-id="${prod.id}"]`);
        if (!badgeContainer) return;

        const stock = prod.stock_quantity;
        if (stock > 0 && stock <= 3) {
            badgeContainer.innerHTML = `<span style="color: #ff3b30; font-weight: 700; font-size: 0.8rem;">Restam apenas ${stock} unidades!</span>`;
        } else {
            badgeContainer.innerHTML = '';
        }
    },

    updateStock(productId, newStock) {
        const prod = this.state.allProducts.find(p => p.id === productId);
        if (prod) {
            prod.stock_quantity = newStock;
            const btn = document.querySelector(`.btn-buy-now[data-id="${productId}"]`);
            if (btn) {
                btn.disabled = newStock === 0;
                btn.textContent = newStock === 0 ? 'ESGOTADO' : 'COMPRAR AGORA';
            }
            this.updateScarcityBadge(prod);
        }
    }
};
