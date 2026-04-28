document.addEventListener('DOMContentLoaded', () => {
    // Impede que o browser restaure scroll por conta própria
    history.scrollRestoration = 'manual';

    // --- RESET STATE ON LOAD (FIX F5 BUG) ---
    document.body.classList.remove('products-active', 'in-product-list');
    
    const catView = document.getElementById('categories-view');
    const prodView = document.getElementById('products-view');
    if (catView) catView.style.display = 'grid';
    if (prodView) prodView.style.display = 'none';

    // --- SHARED STATE & REVEAL ENGINE ---
    let state = {
        currentIndex: 0,
        isLocked: false,
        snapEnabled: true,
        menuData: [],
        globalStoreStatus: null,
        storeConfig: null,
        isTransitioning: false
    };

    const navSections = ['hero', 'menu', 'foodservice', 'acompanhe', 'footer'];
    const navDots = document.querySelectorAll('.dot-nav');
    const isLanding = !!document.getElementById('hero');
    let scrollTimeout = null;
    let scrollToSection = null; 

    // Motor de scroll com easeOutQuart (começa rápido, para suave) — 280ms
    function smoothScrollTo(targetEl) {
        const startY = window.pageYOffset;
        const endY = targetEl.getBoundingClientRect().top + startY;
        const diff = endY - startY;
        if (diff === 0) return;
        const duration = 280;
        let startTime = null;
        function step(ts) {
            if (!startTime) startTime = ts;
            const elapsed = Math.min(ts - startTime, duration);
            const p = elapsed / duration;
            const ease = 1 - Math.pow(1 - p, 4); // easeOutQuart
            window.scrollTo(0, startY + diff * ease);
            if (elapsed < duration) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // --- SYNC GLOBAL STORE STATUS (ETAPA 4) ---
    // Aplica status cacheado imediatamente (sem esperar API)
    const cachedStatus = localStorage.getItem('tocha_status');
    if (cachedStatus) {
        try {
            state.globalStoreStatus = JSON.parse(cachedStatus);
            updateStoreUI();
        } catch (e) {}
    }

    async function syncGlobalStoreStatus() {
        try {
            const resp = await fetch('/api/store-status');
            if (resp.ok) {
                const status = await resp.json();
                state.globalStoreStatus = status;
                localStorage.setItem('tocha_status', JSON.stringify(status));
                updateStoreUI();
            }
        } catch (e) { console.error("Erro ao sincronizar status:", e); }
    }

    // Inicia sincronização automática
    syncGlobalStoreStatus();
    setInterval(syncGlobalStoreStatus, 60000); // Sincroniza a cada 1 minuto
    initStockRealtime();

    function updateStoreUI() {
        const s = state.globalStoreStatus;
        if (!s) return;

        const bar = document.getElementById('top-status-bar');
        const barText = document.getElementById('status-text-top');

        if (bar && barText) {
            bar.style.display = 'flex'; // Use flex for centering
            document.body.classList.add('has-status-bar');
            bar.className = 'store-status-bar ' + s.statusMode.replace('_', '-');
            
            // A mensagem já vem formatada do backend conforme solicitado:
            // "Pedidos abertos para este sábado — 18/04 — Encerra em Xd Xh Xmin"
            // Se fechado, o backend envia a mensagem de erro configurada
            barText.textContent = s.message;
        }

        updateAllPurchaseButtons();
    }

    function updateAllPurchaseButtons() {
        const s = state.globalStoreStatus;
        if (!s) return;

        const isClosed = s.statusMode === 'closed';
        const btns = document.querySelectorAll('.btn-buy-now');

        btns.forEach(btn => {
            if (isClosed) {
                btn.disabled = true;
                btn.textContent = 'FECHADO';
            }
            // Se aberto, não fazemos nada aqui, deixamos que o renderizador de cards
            // e o SSE decidam se o botão é COMPRAR AGORA ou ESGOTADO baseados no estoque.
        });
    }

    // --- REVEAL ON SCROLL (desativado — animações removidas) ---
    // Garante que todos os elementos .reveal fiquem visíveis imediatamente
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));


    // --- DYNAMIC CONFIG LOAD ---
    async function loadDynamicConfig() {
        try {
            const resp = await fetch('/api/config');
            if (resp.ok) {
                const { categorias, produtos, siteContent } = await resp.json();
                console.log("📦 DADOS RECEBIDOS:", { categorias, produtos });
                
                state.menuData = (categorias || []).map(cat => ({
                    ...cat,
                    id: cat.slug,
                    items: (produtos || []).filter(p => p.category_slug === cat.slug)
                }));

                // Inicializa Módulos Independentes
                if (window.HeroModule) HeroModule.init(siteContent.hero);
                if (window.MenuModule) MenuModule.init(categorias, produtos);
                if (window.FoodserviceModule) FoodserviceModule.init(siteContent.foodservice);
                if (window.InstagramModule) InstagramModule.init(siteContent.instagram);
                if (window.FooterModule) FooterModule.init(siteContent.footer, siteContent.store_info);

                // Global Assets
                if (siteContent.site_logo) {
                    const l = siteContent.site_logo;
                    const url = l.startsWith('http') ? l : '/' + l;
                    document.querySelectorAll('#site-logo-nav, #site-logo-hero, #site-logo-footer, #site-logo-back-top').forEach(img => {
                        img.src = url;
                    });
                }
                
                // Atualiza links de WhatsApp
                const si = siteContent.store_info;
                if (si && si.phone) {
                    let cleanPhone = si.phone.replace(/\D/g, '');
                    if (cleanPhone.length <= 11 && cleanPhone.length >= 10) cleanPhone = '55' + cleanPhone;
                    document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
                        link.href = `https://wa.me/${cleanPhone}`;
                    });
                }

                console.log("✅ Módulos carregados e inicializados!");
            }
        } catch (err) { console.error("Erro no loadDynamicConfig:", err); }
    }

    // --- REALTIME STOCK SSE ---
    function initStockRealtime() {
        try {
            const es = new EventSource('/api/stock-stream');
            es.onmessage = function(e) {
                const data = JSON.parse(e.data);
                if (data.type === 'stock_update') {
                    if (window.MenuModule) MenuModule.updateStock(data.productId, data.newStock);
                }
            };
            es.onerror = function() {
                es.close();
                setTimeout(initStockRealtime, 5000);
            };
        } catch (err) { console.error("Falha ao iniciar SSE:", err); }
    }


    if (isLanding) {
        const sections = navSections.map(id => document.getElementById(id)).filter(el => el);
        
        // Helper para sincronizar Visuais da Navbar e Dots
        function syncNavUI(index) {
            navDots.forEach(d => d.classList.remove('active'));
            if (navDots[index]) navDots[index].classList.add('active');
            
            const stickyNav = document.querySelector('.sticky-nav');
            if (stickyNav) {
                stickyNav.classList.remove('navbar-hidden');
                stickyNav.classList.add('navbar-visible');
                document.body.classList.add('navbar-is-visible');
            }
        }

        scrollToSection = function(index) {
            if (index < 0 || index >= sections.length) return;
            state.currentIndex = index;
            state.isLocked = true;
            sessionStorage.setItem('tocha_section', index);

            syncNavUI(index);
            smoothScrollTo(sections[index]);

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                state.isLocked = false;
            }, 350);
        }

        function handleNavigate(direction) {
            if (state.isLocked || !state.snapEnabled) return;
            const nextIndex = state.currentIndex + direction;
            if (nextIndex >= 0 && nextIndex < sections.length) {
                scrollToSection(nextIndex);
            }
        }

        // Bloqueio do Mouse Wheel (ETAPA 1 - Alta Sensibilidade)
        window.addEventListener('wheel', (e) => {
            if (!state.snapEnabled) return;
            e.preventDefault(); // Inibe rolagem livre

            if (state.isLocked) return;

            // Sensibilidade absoluta: qualquer movimento detectado dispara a transição imediata
            if (Math.abs(e.deltaY) >= 1) {
                handleNavigate(e.deltaY > 0 ? 1 : -1);
            }
        }, { passive: false });

        // Bloqueio do Teclado
        // Bloqueio do Teclado (ETAPA 2 - Resposta Imediata)
        window.addEventListener('keydown', (e) => {
            if (!state.snapEnabled || state.isLocked || e.repeat) return;
            
            if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                e.preventDefault();
                handleNavigate(e.code === 'ArrowDown' ? 1 : -1);
            }
        }, { passive: false });

        // Toque na tela (Mobile)
        let touchStartY = 0;
        window.addEventListener('touchstart', e => {
            if (!state.snapEnabled) return;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        window.addEventListener('touchmove', e => {
            if (!state.snapEnabled) return;
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchend', e => {
            if (!state.snapEnabled) return;
            const touchEndY = e.changedTouches[0].clientY;
            const distance = touchStartY - touchEndY;
            
            if (Math.abs(distance) > 50 && !state.isLocked) {
                handleNavigate(distance > 0 ? 1 : -1);
            }
        }, { passive: false });

        // Clique nos Dots
        navDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                if (state.snapEnabled && !state.isLocked) scrollToSection(i);
            });
        });

        // Sincronização Global de Cliques (Links da Navbar, CTAs no Hero, etc.)
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href || !href.includes('#')) return;
            
            // Extrai o ID (ex: #menu ou index.html#menu)
            const targetId = href.split('#')[1];
            const targetIndex = navSections.indexOf(targetId);
            
            if (targetIndex !== -1 && state.snapEnabled && !state.isLocked) {
                // Se estivermos na home e o link for para uma seção interna, usamos o motor de scroll
                if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '') {
                    e.preventDefault();
                    scrollToSection(targetIndex);
                }
            }
        });
        
        // Esconder barra de rolagem injetando estilo global
        const muteScroll = document.createElement('style');
        muteScroll.id = 'fullpage-styles';
        muteScroll.innerHTML = `body.snap-active::-webkit-scrollbar { display: none; } body.snap-active { -ms-overflow-style: none; scrollbar-width: none; }`;
        document.head.appendChild(muteScroll);
        
        // Ativar snap
        document.body.classList.add('snap-active');
        
        // --- Setup Inicial: hash > sessionStorage > seção 0 ---
        let startingIndex = 0;
        const currentHash = window.location.hash.substring(1);
        if (currentHash && navSections.includes(currentHash)) {
            startingIndex = navSections.indexOf(currentHash);
        } else {
            const saved = parseInt(sessionStorage.getItem('tocha_section') || '0');
            if (!isNaN(saved) && saved >= 0 && saved < sections.length) {
                startingIndex = saved;
            }
        }
        state.currentIndex = startingIndex;
        sessionStorage.setItem('tocha_section', startingIndex);

        // Posiciona na seção correta após layout completo (window.load garante
        // que offsetTop é calculado com imagens e CSS já aplicados, e também
        // roda DEPOIS de qualquer restauração de scroll do browser)
        function applyStartPosition() {
            const idx = state.currentIndex;
            const targetEl = sections[idx];
            if (targetEl) window.scrollTo(0, targetEl.offsetTop);
            syncNavUI(idx);

            const stickyNav = document.querySelector('.sticky-nav');
            if (stickyNav) {
                if (idx === 0) {
                    stickyNav.classList.add('navbar-visible');
                    stickyNav.classList.remove('navbar-hidden');
                    document.body.classList.add('navbar-is-visible');
                } else {
                    stickyNav.classList.add('navbar-hidden');
                    stickyNav.classList.remove('navbar-visible');
                    document.body.classList.remove('navbar-is-visible');
                }
            }

            navDots.forEach(d => d.classList.remove('active'));
            if (navDots[idx]) navDots[idx].classList.add('active');

            revealPage();
        }

        if (document.readyState === 'complete') {
            applyStartPosition();
        } else {
            window.addEventListener('load', applyStartPosition, { once: true });
        }
        
    } // Fim do bloco isLanding

    // --- REVEAL: remove a cobertura escura (funciona para todas as páginas) ---
    function revealPage() {
        const cover = document.getElementById('page-cover');
        if (!cover) return;
        cover.style.transition = 'opacity 0.22s ease';
        cover.style.opacity = '0';
        setTimeout(() => cover.remove(), 280);
    }

    if (!isLanding) revealPage();

    // --- LOGICA DE NAVBAR PARA TODAS AS PAGINAS (Padrão Início) ---
    const stickyNav = document.querySelector('.sticky-nav');
    
    // 1. Mostrar Navbar inicialmente no topo
    if (window.scrollY < 100 && stickyNav) {
        stickyNav.classList.add('navbar-visible');
        stickyNav.classList.remove('navbar-hidden');
        document.body.classList.add('navbar-is-visible');
    }

    // 2. Ouvinte de Scroll para páginas internas (Não-Landing)
    if (!isLanding) {
        window.addEventListener('scroll', () => {
            if (stickyNav) {
                if (window.scrollY <= 100) {
                    if (stickyNav.classList.contains('navbar-hidden')) {
                        stickyNav.classList.remove('navbar-hidden');
                        stickyNav.classList.add('navbar-visible');
                        document.body.classList.add('navbar-is-visible');
                    }
                } else {
                    if (stickyNav.classList.contains('navbar-visible')) {
                        stickyNav.classList.remove('navbar-visible');
                        stickyNav.classList.add('navbar-hidden');
                        document.body.classList.remove('navbar-is-visible');
                    }
                }
            }
        });
    }

    // 3. Hover Global da Navbar — throttled via rAF para não bloquear compositor
    let navMouseRafPending = false;
    window.addEventListener('mousemove', (e) => {
        if (!stickyNav || navMouseRafPending) return;
        navMouseRafPending = true;
        requestAnimationFrame(() => {
            navMouseRafPending = false;
            const isScrolled = window.scrollY > 100 || (isLanding && state.currentIndex > 0);
            if (!isScrolled) return;
            if (e.clientY <= 100) {
                if (stickyNav.classList.contains('navbar-hidden')) {
                    stickyNav.classList.remove('navbar-hidden');
                    stickyNav.classList.add('navbar-visible');
                    document.body.classList.add('navbar-is-visible');
                }
            } else {
                if (stickyNav.classList.contains('navbar-visible')) {
                    stickyNav.classList.remove('navbar-visible');
                    stickyNav.classList.add('navbar-hidden');
                    document.body.classList.remove('navbar-is-visible');
                }
            }
        });
    });

    // --- UI FEEDBACK ---
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, .hero-cta, .nav-text-item, .cat-main-card');
        if (btn) {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => btn.style.transform = '', 100);
        }
    });

    // --- TRANSIÇÃO DE SAÍDA ENTRE PÁGINAS ---
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || link.target === '_blank') return;
        e.preventDefault();
        // Cria cobertura escura sobre a página atual antes de navegar
        const cover = document.createElement('div');
        cover.style.cssText = 'position:fixed;inset:0;background:#0a0a0a;z-index:999999;pointer-events:none;opacity:0;transition:opacity 0.18s ease';
        document.body.appendChild(cover);
        requestAnimationFrame(() => {
            cover.style.opacity = '1';
            setTimeout(() => { window.location.href = href; }, 200);
        });
    });

    // --- INIT ---
    loadDynamicConfig();
    syncGlobalStoreStatus();
});
