// [ADMIN] Inicialização Imediata (Script no final do body)
console.log(">>> [ADMIN] Script carregado.");
const loginOverlay = document.getElementById('login-overlay');
const loginSubmitBtn = document.getElementById('login-submit');
console.log(">>> [ADMIN] Overlay detectado:", !!loginOverlay, "| Botao Login:", !!loginSubmitBtn);

let state = {
        token: localStorage.getItem('tocha_admin_token'),
        user: JSON.parse(localStorage.getItem('tocha_admin_user') || '{}'),
        csrfToken: null,
        categories: [],
        products: [],
        content: {},
        pedidos: [],
        stats: {},
        chartData: { labels: [], revenue: [], orders: [], averages: [], profit: [] },
        detailedAnalytics: null,
        cumulativeData: { labels: [], current: [], previous: [] },
        currentSection: localStorage.getItem('tocha_admin_section') || 'dashboard',
        statsPeriod: 'month',
        chartPeriod: 'month',
        cumulStatsPeriod: '30d',
        itemsStatsPeriod: '30d',
        payStatsPeriod: '30d',
        currentMetric: 'revenue',
        granularity: 'day',
        customFrom: '',
        customTo: '',
        chartCustomFrom: '',
        chartCustomTo: '',
        itemsCustomFrom: localStorage.getItem('tocha_items_from') || '',
        itemsCustomTo: localStorage.getItem('tocha_items_to') || '',
        payCustomFrom: '',
        payCustomTo: '',
        cumulCustomFrom: '',
        cumulCustomTo: '',
        isCumulLoading: false,
        isItemsLoading: false,
        summaryPeriod: 'today',
        summaryCustomFrom: '',
        summaryCustomTo: '',
        summaryData: null,
        performanceTab: 'products',
        performanceSearch: '',
        performanceSortCol: 'qty',
        performanceSortDir: 'desc',
        calYear: new Date().getFullYear(),
        calMonth: new Date().getMonth(),
        calMetric: 'revenue',
        calendarData: null,
        isCalendarLoading: false,
        isLoading: false,
        customerSortCol: 'name',
        customerSortDir: 'asc',
        customerPage: 1,
        customerPageSize: 10,
        storeOpen: false,
        storeStatusMode: 'loading',
        storeMessage: 'Sincronizando...',
        deliveryOpen: false,
        ordersTab: 'aceito',
        searchQuery: '',
        customerSearchQuery: '',
        customerSortCol: 'name',
        customerSortDir: 'asc',
        customerPage: 1,
        customerPageSize: 10,
        customerFilter: 'all',
        histPage: 1,
        histLimit: 20,
        histStart: '',
        histEnd: '',
        histIncludeRejected: false,
        histOrders: [],
        histCount: 0,
        histStats: { totalRevenue: 0, totalOrders: 0, avgTicket: 0, taxTotal: 0, discountTotal: 0, profit: 0 },
        isHistLoading: false,
        crmSortCol: 'count', // 'count', 'revenue', 'last'
        engagementCustomerSearch: '',
        selectedEngagementCustomers: [], // Inicialização necessária para evitar TypeError
        customers: [], // Garantir que customers exista antes de qualquer render
        preOrders: [],
        preVendaSummary: null
    };

    // Intercepta fetch para injetar x-csrf-token em rotas admin que modificam estado
    const _origFetch = window.fetch.bind(window);
    window.fetch = function(url, opts = {}) {
        if (typeof url === 'string' && url.startsWith('/api/admin/') && state.csrfToken) {
            const method = (opts.method || 'GET').toUpperCase();
            if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
                opts = { ...opts, headers: { ...opts.headers, 'x-csrf-token': state.csrfToken } };
            }
        }
        return _origFetch(url, opts);
    };

    async function fetchCsrfToken() {
        try {
            const r = await _origFetch('/api/admin/csrf-token');
            if (r.ok) { const d = await r.json(); state.csrfToken = d.token; }
        } catch (_) {}
    }

    window.showToast = function(msg) {
        console.log("Toast:", msg);
        const t = document.getElementById('admin-toast');
        if (t) {
            t.textContent = msg;
            t.classList.add('active'); 
            setTimeout(() => t.classList.remove('active'), 3000);
        } else {
            alert(msg);
        }
    };

    window.showConfirm = function(title, message, onConfirm) {
        let overlay = document.getElementById('confirm-modal-overlay');
        if (!overlay) return confirm(message) && onConfirm();

        // PADRÃO PORTAL: Move para o final do body para evitar interferência de Stacking Context de pais
        document.body.appendChild(overlay);

        const tEl = document.getElementById('confirm-modal-title');
        const mEl = document.getElementById('confirm-modal-message');
        const ok = document.getElementById('confirm-modal-ok');

        if (tEl) tEl.innerText = title;
        if (mEl) {
            mEl.textContent = '';
            message.split('\n').forEach((line, i) => {
                if (i > 0) mEl.appendChild(document.createElement('br'));
                mEl.appendChild(document.createTextNode(line));
            });
        }

        if (ok) {
            const btn = ok.cloneNode(true);
            ok.parentNode.replaceChild(btn, ok);
            btn.onclick = function() {
                window.closeConfirmModal();
                if (onConfirm) onConfirm();
            };
        }

        overlay.style.display = 'flex';
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    };

    window.closeConfirmModal = function() {
        const overlay = document.getElementById('confirm-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
            document.body.style.overflow = ''; 
        }
    };

    window.formatPhone = (v) => {
        if (!v) return "";
        v = v.replace(/\D/g, "");
        if (v.length === 11) return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
        if (v.length === 10) return `(${v.substring(0, 2)}) ${v.substring(2, 6)}-${v.substring(6)}`;
        return v;
    };


    // --- LOGICA DE LOGIN (INICIALIZACAO PRIORITARIA) ---
    loginSubmitBtn?.addEventListener('click', async () => {
        console.log(">>> [ADMIN] Clique detectado.");
        const email = document.getElementById('admin-user').value;
        const password = document.getElementById('admin-pass').value;
        const btn = loginSubmitBtn;

        if (!email || !password) {
            showToast('Preencha todos os campos!');
            return;
        }

        try {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-small"></span> Verificando...';
            
            const resp = await fetch('/api/admin/login', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ email, password }) 
            });
            const data = await resp.json();
            
            if (data.success) {
                state.token = data.token;
                state.user = data.user;
                localStorage.setItem('tocha_admin_token', data.token);
                localStorage.setItem('tocha_admin_user', JSON.stringify(data.user));
                await fetchCsrfToken();
                loginOverlay.style.display = 'none';
                await initAdmin();
            } else {
                showToast(data.error || 'Credenciais inválidas!');
            }
        } catch (err) { 
            console.error(err);
            showToast('Erro de conexão com o servidor');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Entrar';
            }
        }
    });

    loginSubmitBtn?.parentElement?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginSubmitBtn.click();
    });
    
    // --- UTILITÁRIOS CRM ---
    const parseItems = (items) => {
        if (!items) return [];
        let raw = [];
        try {
            raw = typeof items === 'string' ? JSON.parse(items) : items;
        } catch (e) { return []; }
        if (raw && raw.actual_items) return raw.actual_items;
        return Array.isArray(raw) ? raw : [];
    };

    const formatPhone = (phone) => {
        if (!phone) return '-';
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('55')) cleaned = cleaned.substring(2);
        if (cleaned.length === 11) {
            return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
        } else if (cleaned.length === 10) {
            return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
        }
        return phone;
    };

    const getRecurrenceInfo = (count, lastDate) => {
        if (!count || count < 1) return { label: 'Novo', color: '#94a3b8', bg: '#f1f5f9', score: 0 };
        
        const now = new Date();
        const d = new Date(lastDate);
        
        // Comparação de datas locais para precisão absoluta (hoje/ontem/dias)
        const normalize = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const daysSince = Math.round((normalize(now) - normalize(d)) / (1000 * 60 * 60 * 24));
        
        let label = 'Ocasional', color = '#64748b', bg = '#f1f5f9', score = 1;
        
        if (count >= 5 && daysSince <= 15) { label = 'Muito recorrente'; color = '#22c55e'; bg = '#dcfce7'; score = 10; }
        else if (count >= 2 && daysSince <= 21) { label = 'Recorrente'; color = '#3b82f6'; bg = '#eff6ff'; score = 7; }
        else if (count >= 2 && daysSince > 21) { label = 'Em risco'; color = '#ef4444'; bg = '#fff1f2'; score = 3; }
        
        let recencyStr = 'Hoje';
        if (daysSince === 1) recencyStr = '1 dia';
        else if (daysSince > 1) recencyStr = `${daysSince} dias`;

        return { label, color, bg, score, daysSince, recencyStr };
    };

    window.setCrmSort = (col) => {
        if (state.crmSortCol === col) {
            state.crmSortDir = state.crmSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            state.crmSortCol = col;
            state.crmSortDir = 'desc';
        }
        renderDashboard();
    };

    const getWAMessage = (name) => {
        const msg = `Fala, ${name}! Tudo bem?\nJá faz um tempinho desde seu último pedido aqui na Tocha 👀\n\nEssa semana tem fornada fresca saindo no sábado 🔥🥖\nQuer que eu te envie as opções?`;
        return encodeURIComponent(msg);
    };

    window.viewCrmCustomerDetail = (id) => {
        const c = state.customers.find(x => String(x.id) === String(id));
        if (!c) return;
        const info = getRecurrenceInfo(c.crm_count, c.crm_last);
        
        const modalHtml = `
            <div style="padding: 2.5rem; max-width: 450px; margin: 0 auto; text-align: center;">
                <div style="width: 80px; height: 80px; background: #f5f3ff; color: #8b5cf6; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 2.125rem; font-weight: 900; box-shadow: 0 10px 25px rgba(139, 92, 246, 0.15);">
                    ${c.name.charAt(0).toUpperCase()}
                </div>
                <h2 style="font-size: 1.625rem; font-weight: 950; color: #1e293b; margin: 0;">${c.name}</h2>
                <p style="font-size: 0.975rem; color: #64748b; font-weight: 700; margin: 0.5rem 0 1.5rem;">${formatPhone(c.whatsapp)}</p>
                
                <div style="display:inline-block; font-size:0.825rem; font-weight:900; padding:4px 12px; border-radius:8px; background:${info.bg}; color:${info.color}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2rem;">${info.label}</div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; text-align: left;">
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 0.725rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.3rem;">Total Gasto</div>
                        <div style="font-size: 1.225rem; font-weight: 950; color: #1e293b;">${Number(c.crm_total || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</div>
                    </div>
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 0.725rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.3rem;">Pedidos</div>
                        <div style="font-size: 1.225rem; font-weight: 950; color: #1e293b;">${c.crm_count}</div>
                    </div>
                </div>

                <div style="background: #f1f5f9; padding: 1.25rem; border-radius: 12px; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="text-align: left;">
                        <div style="font-size: 0.775rem; font-weight: 900; color: #64748b; text-transform: uppercase;">Recência</div>
                        <div style="font-size: 1.025rem; font-weight: 850; color: #1e293b;">${info.recencyStr} atrás</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.775rem; font-weight: 900; color: #64748b; text-transform: uppercase;">Score de Recorrência</div>
                        <div style="font-size: 1.225rem; font-weight: 950; color: ${info.color};">${info.score}/10</div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <a href="https://wa.me/55${(c.whatsapp || '').replace(/\D/g, '')}?text=${getWAMessage(c.name)}" target="_blank" style="width: 100%; padding: 1rem; background: #22c55e; color: #fff; border-radius: 12px; font-weight: 900; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1.075rem; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);">
                        <i data-lucide="message-square" style="width: 20px; height: 20px;"></i> Enviar Mensagem
                    </a>
                    <button onclick="window.closeOrderModal()" style="width: 100%; padding: 0.8rem; background: transparent; color: #94a3b8; border: none; border-radius: 12px; font-weight: 800; font-size: 0.975rem; cursor: pointer;">Voltar ao Dashboard</button>
                </div>
            </div>
        `;
        
        const modalBody = document.getElementById('modal-body-content');
        const modalOverlay = document.getElementById('order-modal-overlay');
        if (modalBody && modalOverlay) {
            modalBody.innerHTML = modalHtml;
            modalOverlay.classList.add('active');
            if(window.lucide) lucide.createIcons();
        }
    };

    const getTimeAgo = (date) => {
        if (!date) return '';
        const now = new Date();
        const d = new Date(date);
        const diffInMs = now - d;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Hoje';
        if (diffInDays === 1) return 'Ontem';
        if (diffInDays < 7) return `Há ${diffInDays} dias`;
        if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7);
            return `Há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
        }
        if (diffInDays < 365) {
            const months = Math.floor(diffInDays / 30);
            return `Há ${months} ${months === 1 ? 'mês' : 'meses'}`;
        }
        const years = Math.floor(diffInDays / 365);
        return `Há ${years} ${years === 1 ? 'ano' : 'anos'}`;
    };

    const getRecurringRankingHTML = (customers) => {
        let list = (customers || []).filter(c => (c.crm_count || 0) >= 1).map(c => {
            const info = getRecurrenceInfo(c.crm_count, c.crm_last);
            return { ...c, info };
        });
        
        const sortCol = state.crmSortCol || 'count';
        const sortDir = state.crmSortDir || 'desc';

        list.sort((a, b) => {
            let valA, valB;
            if (sortCol === 'count') { valA = a.crm_count || 0; valB = b.crm_count || 0; }
            else if (sortCol === 'revenue') { valA = a.crm_total || 0; valB = b.crm_total || 0; }
            else if (sortCol === 'recurrence') { valA = a.info.score || 0; valB = b.info.score || 0; }
            else { valA = new Date(a.crm_last || 0); valB = new Date(b.crm_last || 0); }
            return sortDir === 'asc' ? valA - valB : valB - valA;
        });

        const activeArrow = (col) => {
            if (state.crmSortCol !== col) return '<i data-lucide="chevrons-up-down" style="width:10px; height:10px; margin-left:4px; opacity:0.3;"></i>';
            return state.crmSortDir === 'desc' ? '<i data-lucide="chevron-down" style="width:12px; height:12px; margin-left:4px; color:var(--primary);"></i>' : '<i data-lucide="chevron-up" style="width:12px; height:12px; margin-left:4px; color:var(--primary);"></i>';
        };

        if (list.length === 0) return `<div style="padding:2rem; text-align:center; color:#94a3b8; font-size:0.925rem;">Aguardando dados de recorrência...</div>`;

        return `
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <th style="padding:0.75rem; text-align:left; font-size:0.775rem; text-transform:uppercase; color:#64748b; font-weight:900;">Cliente / Status</th>
                        <th onclick="setCrmSort('count')" style="padding:0.75rem; text-align:center; font-size:0.775rem; text-transform:uppercase; color:#64748b; font-weight:900; cursor:pointer; width:15%;">Pedidos ${activeArrow('count')}</th>
                        <th onclick="setCrmSort('revenue')" style="padding:0.75rem; text-align:right; font-size:0.775rem; text-transform:uppercase; color:#64748b; font-weight:900; cursor:pointer; width:15%;">Gasto ${activeArrow('revenue')}</th>
                        <th onclick="setCrmSort('recurrence')" style="padding:0.75rem; text-align:center; font-size:0.775rem; text-transform:uppercase; color:#64748b; font-weight:900; cursor:pointer; width:15%;">Score ${activeArrow('recurrence')}</th>
                        <th onclick="setCrmSort('last')" style="padding:0.75rem; text-align:right; font-size:0.775rem; text-transform:uppercase; color:#64748b; font-weight:900; cursor:pointer; width:20%;">Recência ${activeArrow('last')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.slice(0, 10).map(c => {
                        const rec = c.info;
                        return `
                            <tr onclick="viewCrmCustomerDetail('${c.id}')" style="border-bottom:1px solid #f8fafc; transition:0.2s; cursor:pointer;" onmouseover="this.style.background='#fbfaff'" onmouseout="this.style.background='transparent'">
                                <td style="padding:0.8rem 0.75rem;">
                                    <div style="font-weight:850; color:#1e293b; font-size:0.925rem;">${c.name}</div>
                                    <div style="display:inline-block; font-size:0.725rem; font-weight:900; padding:2px 6px; border-radius:4px; background:${rec.bg}; color:${rec.color}; margin-top:2px; text-transform:uppercase; letter-spacing:0.3px;">${rec.label}</div>
                                </td>
                                <td style="padding:0.8rem 0.75rem; text-align:center; font-weight:800; color:#1e293b; font-size:0.975rem;">${c.crm_count}</td>
                                <td style="padding:0.8rem 0.75rem; text-align:right; font-weight:850; color:#1e293b; font-size:0.925rem;">${Number(c.crm_total || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>
                                <td style="padding:0.8rem 0.75rem; text-align:center;">
                                    <div style="font-size:0.875rem; font-weight:950; color:${rec.color};">${rec.score}/10</div>
                                </td>
                                <td style="padding:0.8rem 0.75rem; text-align:right;">
                                    <div style="font-weight:800; color:#475569; font-size:0.925rem;">${rec.recencyStr}</div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    };

    const getInactiveCRMHTML = (customers) => {
        const now = new Date();
        const INACTIVE_THRESHOLD_DAYS = 15;
        
        let allRecurrent = (customers || []).filter(c => (c.crm_count || 0) >= 2);
        let inactiveList = allRecurrent.filter(c => {
            if (!c.crm_last) return false;
            const diff = (now - new Date(c.crm_last)) / (1000 * 60 * 60 * 24);
            return diff >= INACTIVE_THRESHOLD_DAYS;
        });

        // Caso não haja inativos, mostrar resumo útil (Estado Saudável)
        if (inactiveList.length === 0) {
            const activeRecurrent = allRecurrent.filter(c => {
                const diff = (now - new Date(c.crm_last)) / (1000 * 60 * 60 * 24);
                return diff < INACTIVE_THRESHOLD_DAYS;
            });
            
            const totalSpent = activeRecurrent.reduce((sum, c) => sum + (c.crm_total || 0), 0);
            const avgTicket = activeRecurrent.length > 0 ? (totalSpent / activeRecurrent.reduce((sum, c) => sum + c.crm_count, 0)) : 0;
            
            // Cálculo do Intervalo Médio de Recompra (Last - First / Count - 1)
            const intervals = activeRecurrent.map(c => {
                if(!c.crm_last || !c.created_at || c.crm_count <= 1) return null;
                const last = new Date(c.crm_last);
                const first = new Date(c.created_at);
                const daysActive = (last - first) / (1000 * 60 * 60 * 24);
                return daysActive / (c.crm_count - 1);
            }).filter(i => i !== null && i >= 0);
            
            const rawAvg = intervals.length > 0 ? (intervals.reduce((a,b)=>a+b,0) / intervals.length) : 0;
            // Arredondar para 1 casa decimal para evitar lixo de ponto flutuante
            const avgInterval = Math.round(rawAvg * 10) / 10;
            
            // Exibição: remover .0 se for inteiro
            const displayInterval = avgInterval % 1 === 0 ? avgInterval.toFixed(0) : avgInterval.toFixed(1).replace('.', ',');

            // Classificação rigorosa baseada na operação (Fornada Semanal)
            let intervalStatus = '(ótimo)';
            let intervalColor = '#22c55e';
            
            if (avgInterval > 14) { 
                intervalStatus = '(em risco)'; 
                intervalColor = '#ef4444'; 
            } else if (avgInterval > 7) { 
                intervalStatus = '(atenção)'; 
                intervalColor = '#f59e0b'; 
            }

            return `
                <div style="display:flex; flex-direction:column; gap:1.25rem;">
                    <div style="background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:1px solid #bbf7d0; padding:1.25rem; border-radius:12px; text-align:center;">
                        <div style="width:40px; height:40px; background:#22c55e; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 0.75rem; box-shadow:0 4px 10px rgba(34, 197, 94, 0.2);">
                            <i data-lucide="check" style="width:20px; height:20px;"></i>
                        </div>
                        <h4 style="font-size:1.075rem; font-weight:900; color:#14532d; margin:0;">Base de Clientes Saudável</h4>
                        <p style="font-size:0.875rem; color:#166534; font-weight:700; margin-top:4px;">Nenhum cliente recorrente em pausa</p>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:1rem; border-radius:12px;">
                            <div style="font-size:0.725rem; color:#64748b; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.5rem;">Clientes recorrentes ativos</div>
                            <div style="font-size:1.325rem; font-weight:950; color:#1e293b;">${activeRecurrent.length}</div>
                        </div>
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:1rem; border-radius:12px;">
                            <div style="font-size:0.725rem; color:#64748b; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.5rem;">Ticket Médio (Fiel)</div>
                            <div style="font-size:1.325rem; font-weight:950; color:#1e293b;">${avgTicket.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</div>
                        </div>
                    </div>

                    <div style="background:#f5f3ff; border:1px solid #e9d5ff; padding:1rem 2rem; border-radius:12px; display:flex; align-items:center; justify-content:space-between;">
                        <div>
                            <div style="font-size:0.775rem; color:#7e22ce; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">Intervalo de Recompra</div>
                            <div style="font-size:1.075rem; font-weight:950; color:#581c87;">Média de ${displayInterval} dias <span style="font-size:0.825rem; color:${intervalColor}; font-weight:800; text-transform:lowercase;">${intervalStatus}</span></div>
                        </div>
                        <i data-lucide="refresh-cw" style="width:20px; height:20px; color:#8b5cf6;"></i>
                    </div>
                </div>
            `;
        }

        return `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
                <div style="background:#fff1f2; border:1px solid #fee2e2; padding:1rem; border-radius:12px; display:flex; align-items:center; gap:1rem;">
                    <div style="font-size:1.8rem; font-weight:950; color:#e11d48;">${inactiveList.length}</div>
                    <div style="line-height:1.2;">
                        <div style="font-size:0.925rem; font-weight:900; color:#1e293b;">Alerta de Evasão</div>
                        <div style="font-size:0.775rem; color:#e11d48; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">Recorrentes ausentes +${INACTIVE_THRESHOLD_DAYS}d</div>
                    </div>
                </div>
                ${inactiveList.slice(0, 6).map(c => {
                    const diff = Math.floor((now - new Date(c.crm_last)) / (1000 * 60 * 60 * 24));
                    return `
                        <div onclick="viewCrmCustomerDetail('${c.id}')" style="background:#fff; border:1px solid #e2e8f0; padding:1.15rem; border-radius:16px; display:flex; justify-content:space-between; align-items:center; transition:0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor:pointer;" onmouseover="this.style.borderColor='#8b5cf6'; this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='none'; this.style.boxShadow='none'">
                            <div>
                                <div style="font-weight:950; color:#1e293b; font-size:1.025rem;">${c.name}</div>
                                <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                                    <span style="font-size:0.775rem; color:#e11d48; font-weight:900; background:#fff1f2; padding:2px 6px; border-radius:4px;">${diff} DIAS FORA</span>
                                    <span style="font-size:0.775rem; color:#64748b; font-weight:700;">Gasto: ${Number(c.crm_total || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</span>
                                </div>
                            </div>
                            <a href="https://wa.me/55${(c.whatsapp || '').replace(/\D/g, '')}?text=${getWAMessage(c.name)}" target="_blank" style="width:40px; height:40px; background:#dcfce7; color:#15803d; border-radius:12px; display:flex; align-items:center; justify-content:center; text-decoration:none; transition:0.2s; box-shadow:0 2px 6px rgba(34, 197, 94, 0.1);" onmouseover="this.style.background='#22c55e'; this.style.color='#fff'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='#dcfce7'; this.style.color='#15803d'; this.style.transform='scale(1)'" onclick="event.stopPropagation()">
                                <i data-lucide="message-square" style="width:18px; height:18px;"></i>
                            </a>
                        </div>
                    `;
                }).join('')}
                ${inactiveList.length > 6 ? `<div style="text-align:center; font-size:0.825rem; color:#94a3b8; font-weight:800; margin-top:0.5rem; text-transform:uppercase;">+ ${inactiveList.length - 6} outros clientes pausados</div>` : ''}
            </div>
        `;
    };

    const getTopItemsHTML = (items, limit = 10) => {
        if (!items || items.length === 0) {
            return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 0; text-align: center;">
                    <div style="width: 48px; height: 48px; background: #f1f5f9; color: #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                        <i data-lucide="package-search" style="width: 24px; height: 24px;"></i>
                    </div>
                    <h4 style="font-size: 1.025rem; font-weight: 800; color: #1e293b; margin-bottom: 0.3rem;">Sem vendas no período</h4>
                    <p style="font-size: 0.875rem; color: #64748b; font-weight: 600;">Os produtos aparecerão aqui assim que as transações forem confirmadas.</p>
                </div>
            `;
        }

        const dataToDisplay = items.slice(0, limit);
        const formatCurrency = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        return `
            <div style="background:#fff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <table style="width:100%; border-collapse:collapse; table-layout: fixed;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                            <th style="padding:1rem; text-align:left; font-size:0.775rem; text-transform:uppercase; color:#64748b; font-weight:900; letter-spacing:1px; width:45px;">#</th>
                            <th style="padding:1rem; text-align:left; font-size:0.775rem; text-transform:uppercase; color:#64748b; font-weight:900; letter-spacing:1px; width:40%;">Produto</th>
                            <th style="padding:1rem; text-align:left; font-size:0.775rem; text-transform:uppercase; color:#64748b; font-weight:900; letter-spacing:1px;">Cat.</th>
                            <th style="padding:1rem; text-align:center; font-size:0.775rem; text-transform:uppercase; color:#64748b; font-weight:900; letter-spacing:1px;">Qtd</th>
                            <th style="padding:1rem; text-align:right; font-size:0.775rem; text-transform:uppercase; color:#64748b; font-weight:900; letter-spacing:1px;">Bruto</th>
                            <th style="padding:1rem; text-align:right; font-size:0.775rem; text-transform:uppercase; color:#10b981; font-weight:900; letter-spacing:1px;">Lucro</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dataToDisplay.map((item, idx) => `
                            <tr style="border-bottom:1px solid #f1f5f9; background:#fff; transition:0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                                <td style="padding:0.9rem 1rem; color:#94a3b8; font-weight:700; font-size:0.875rem;">${idx+1}</td>
                                <td style="padding:0.9rem 1rem; font-weight:900; color:#1e293b; font-size:0.925rem;">
                                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.name}">${item.name}</div>
                                </td>
                                <td style="padding:0.9rem 1rem;">
                                    <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.775rem; font-weight: 800; text-transform: uppercase;">${item.category || item.group || 'Padaria'}</span>
                                </td>
                                <td style="padding:0.9rem 1rem; text-align:center; font-weight:800; color:#1e293b; font-size:0.78rem;">${item.qty}</td>
                                <td style="padding:0.9rem 1rem; text-align:right; font-weight:700; color:#475569; font-size:0.875rem;">${formatCurrency(item.revenue)}</td>
                                <td style="padding:0.9rem 1rem; text-align:right; font-weight:950; color:#10b981; font-size:0.925rem;">${formatCurrency(item.profit)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    let dashboardChart = null;
    let paymentChart = null;
    let cumulativeChart = null;

    const adminMain = document.getElementById('admin-main');
    const toast = document.getElementById('admin-toast');

    const storeTrigger = document.getElementById('store-status-trigger');
    const storeDropdown = document.getElementById('store-dropdown');
    const profileTrigger = document.getElementById('profile-trigger');
    const profileMenu = document.getElementById('profile-menu');
    const toggleAll = document.getElementById('toggle-all');
    const toggleDelivery = document.getElementById('toggle-delivery');


    const PAID_STATUSES = ['paid', 'pago', 'concluido', 'concluído', 'finalizado', 'success', 'succeeded', 'completed', 'finalizado', 'entregue', 'delivered'];

    const getPaymentCategory = (method) => {
        const m = (method || '').toLowerCase().trim();
        if (m === 'pix' || m.includes('pix')) return 'pix';
        if (m.includes('credito') || m.includes('crédito') || m.includes('credit') || m.includes('card') || m.includes('cartao_credito') || m.includes('visa') || m.includes('master') || m.includes('amex') || m.includes('elo') || m.includes('hipercard') || m.includes('card_credit') || m.includes('stripe')) return 'credito';
        if (m.includes('debito') || m.includes('débito') || m.includes('debit') || m.includes('cartao_debito') || m.includes('card_debit')) return 'debito';
        return 'outros';
    };

    async function initAdmin() {
        await fetchData(); // Carrega config e métricas
        await syncStoreStatus(); // ÚNICA FONTE DE VERDADE: Define o status final via backend
        renderSection();
        setupNavigation();
        startPolling();
        if (window.lucide) lucide.createIcons();
    }

    const getDateRange = (period) => {
        const now = new Date();
        let from = new Date(now), to = new Date(now);
        
        switch (period) {
            case 'today':
                from.setHours(0,0,0,0); to.setHours(23,59,59,999);
                break;
            case '7d':
                from.setDate(now.getDate() - 7); from.setHours(0,0,0,0);
                break;
            case 'month':
                from.setDate(1); from.setHours(0,0,0,0);
                break;
            case '30d':
                from.setDate(now.getDate() - 30); from.setHours(0,0,0,0);
                break;
            case 'yesterday':
                from.setDate(now.getDate() - 1); from.setHours(0,0,0,0);
                to.setDate(now.getDate() - 1); to.setHours(23,59,59,999);
                break;
            case '15d':
                from.setDate(now.getDate() - 15); from.setHours(0,0,0,0);
                break;
        }
        return { from: from.toISOString(), to: to.toISOString() };
    };

    const closeAllDropdowns = () => {
        if (storeDropdown) storeDropdown.classList.remove('active');
        if (profileMenu) profileMenu.classList.remove('active');
        document.querySelectorAll('.period-selector-menu').forEach(m => {
            m.classList.remove('active');
        });
    };

    storeTrigger?.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(); storeDropdown?.classList.toggle('active'); });
    profileTrigger?.addEventListener('click', (e) => { e.stopPropagation(); closeAllDropdowns(); profileMenu?.classList.toggle('active'); });
    document.addEventListener('click', closeAllDropdowns);

    async function syncStoreStatus() {
        try {
            const resp = await fetch('/api/admin/store-status');
            const data = await resp.json();
            state.storeOpen = data.open;
            state.deliveryOpen = data.delivery || false;
            state.storeStatusMode = data.statusMode;
            state.storeMessage = data.message;
            state.allowNextBatch = data.allowNextBatch;
            
            if (toggleAll) toggleAll.checked = data.open;
            if (toggleDelivery) toggleDelivery.checked = state.deliveryOpen;
            updateStoreUI();
        } catch (e) { console.error(e); }
    }

    function updateStoreUI() {
        const text = document.getElementById('status-text'), 
              trigger = document.getElementById('store-status-trigger'), 
              icon = document.getElementById('status-icon');
        if (!trigger || !text || !icon) return;
        
        // Reset classes and force inline styles to ensure immediate sync
        trigger.classList.remove('open', 'closed', 'next-batch');
        icon.classList.remove('open', 'closed', 'next-batch');

        if (state.storeStatusMode === 'open') {
            trigger.classList.add('open');
            trigger.style.borderColor = '#10b981'; 
            text.textContent = 'Aberta'; 
            text.style.color = '#10b981';
            icon.textContent = '✓'; 
            icon.classList.add('status-icon-box', 'open'); 
            icon.style.background = '#10b981';
        } else if (state.storeStatusMode === 'next_batch') {
            trigger.classList.add('next-batch');
            trigger.style.borderColor = '#f59e0b'; 
            text.textContent = 'Próx. Fornada'; 
            text.style.color = '#f59e0b';
            icon.textContent = '📦'; 
            icon.classList.add('status-icon-box', 'next-batch'); 
            icon.style.background = '#f59e0b';
        } else if (state.storeStatusMode === 'loading' || state.storeStatusMode === 'updating') {
            trigger.classList.add('loading');
            trigger.style.borderColor = '#94a3b8';
            text.textContent = state.storeStatusMode === 'loading' ? 'Sincronizando...' : 'Atualizando...';
            text.style.color = '#94a3b8';
            icon.textContent = '...';
            icon.classList.add('status-icon-box');
            icon.style.background = '#94a3b8';
            icon.style.color = '#fff';
        } else {
            trigger.classList.add('closed');
            trigger.style.borderColor = '#ef4444'; 
            text.textContent = 'Fechada'; 
            text.style.color = '#ef4444';
            icon.textContent = '✖'; 
            icon.classList.add('status-icon-box', 'closed'); 
            icon.style.background = '#ef4444';
        }
    }

    const handleToggleChange = async () => {
        const payload = { open: toggleAll.checked, delivery: toggleDelivery.checked };
        try {
            const resp = await fetch('/api/admin/toggle-store', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` }, body: JSON.stringify(payload) });
            if (resp.ok) { 
                const data = await resp.json();
                state.storeOpen = data.open; 
                state.storeStatusMode = data.statusMode;
                state.storeMessage = data.message;
                state.allowNextBatch = data.allowNextBatch;
                updateStoreUI(); 
                showToast("Status operacional atualizado!"); 
            }
        } catch (e) { console.error(e); }
    };
    toggleAll?.addEventListener('change', handleToggleChange);
    toggleDelivery?.addEventListener('change', handleToggleChange);

    // O listener de login agora está no topo do arquivo.

    async function fetchData(loadAll = true) {
        if (loadAll) {
            state.isLoading = true;
            try {
                await Promise.all([
                    fetchGlobalStats(),
                    fetchCumulativeData(),
                    fetchDetailedAnalytics(),
                    fetchOrders()
                ]);

            } catch (err) { console.error('fetchData error:', err); }
            finally { state.isLoading = false; }
        } else {
            // Apenas estatísticas globais
            try {
                await fetchGlobalStats();
            } catch (err) { console.error('fetchGlobalStats error:', err); }
        }
    }

    async function fetchGlobalStats() {
        const get = async u => { const r = await fetch(u, { headers: { 'Authorization': `Bearer ${state.token}` } }); return r.ok ? r.json() : null; };

        const tz = new Date().getTimezoneOffset();
        let statsUrl = `/api/admin/stats?period=${state.statsPeriod}&tzOffset=${tz}`;
        if (state.statsPeriod === 'custom' && state.customFrom && state.customTo) { 
            statsUrl += `&from=${state.customFrom}&to=${state.customTo}`; 
        }

        // CORREÇÃO: Sincroniza o período do gráfico com o selecionado nos botões superiores
        state.chartPeriod = state.statsPeriod;
        state.chartCustomFrom = state.customFrom;
        state.chartCustomTo = state.customTo;

        let chartUrl = `/api/admin/chart-data?period=${state.chartPeriod}&tzOffset=${tz}&granularity=${state.granularity}`;
        if (state.chartPeriod === 'custom' && state.chartCustomFrom && state.chartCustomTo) { 
            chartUrl += `&from=${state.chartCustomFrom}&to=${state.chartCustomTo}`; 
        }

        const [config, stats, chartData] = await Promise.all([
            get('/api/admin/config'),
            get(statsUrl),
            get(chartUrl)
        ]);

        if (config) { 
            state.categories = config.categorias; 
            state.products = config.produtos; 
            
            // Corrigido: O backend envia 'siteContent' como objeto, não 'content' como array
            state.content = config.siteContent || {}; 
            
            // Normalização preventiva de horários vinda do banco (Reidratação de estado)
            const oh = state.content['opening_hours'];
            if (oh) {
                const fix = (b) => { 
                    if (b && b.end && typeof b.end === 'string' && b.end.includes(':59')) {
                        b.end = b.end.replace(':59', ':00'); 
                    }
                };
                fix(oh.currentBatch);
                fix(oh.nextBatch);
            }
            
            // Injeção dinâmica de Identidade Visual
            const l = state.content['site_logo'];
            if (l) {
                const url = l.startsWith('http') ? l : '/' + l;
                document.querySelectorAll('.photo-circle img, .logo-header-wrap img, .unit-logo-square img').forEach(img => {
                    img.src = url;
                });
            }
        }
        
        if (chartData && stats) {
            state.chartData = chartData;
            state.stats = stats;
            if (typeof initDashboardCharts === 'function') initDashboardCharts();
        } else if (stats) {
            state.stats = stats;
        }
    }

    async function fetchCumulativeData(period, from, to) {
        const p = period || state.cumulStatsPeriod;
        state.isCumulLoading = true;
        updateLoadingState('.side-panel-card', true);
        try {
            const url = new URL('/api/admin/cumulative-chart', window.location.origin);
            url.searchParams.append('period', p);
            url.searchParams.append('tzOffset', new Date().getTimezoneOffset());
            url.searchParams.append('metric', state.currentMetric || 'revenue');
            if (from) url.searchParams.append('from', from);
            if (to) url.searchParams.append('to', to);
            
            const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${state.token}` } });
            if (resp.ok) {
                const data = await resp.json();
                state.cumulativeData = data;
                if (typeof initCumulativeChart === 'function') initCumulativeChart();
            }
        } catch (e) {
            console.error(e);
        } finally { 
            state.isCumulLoading = false; 
            updateLoadingState('.side-panel-card', false);
        }
    }

    async function fetchDetailedAnalytics(p) {
        p = p || state.itemsStatsPeriod;
        state.isItemsLoading = true;
        updateLoadingState('.desempenho-itens-section', true);
        try {
            const get = async u => { const r = await fetch(u, { headers: { 'Authorization': `Bearer ${state.token}` } }); return r.ok ? r.json() : null; };
            const tz = new Date().getTimezoneOffset();
            let url = `/api/admin/detailed-analytics?period=${p}&tzOffset=${tz}`;
            if (p === 'custom' && state.itemsCustomFrom && state.itemsCustomTo) url += `&from=${state.itemsCustomFrom}&to=${state.itemsCustomTo}`;
            
            const data = await get(url);
            if (data) state.detailedAnalytics = data;
        } finally { 
            state.isItemsLoading = false; 
            updateLoadingState('.desempenho-itens-section', false);
        }
    }

    async function fetchSummaryData(p) {
        state.isSummaryLoading = true;
        try {
            const get = async u => { const r = await fetch(u, { headers: { 'Authorization': `Bearer ${state.token}` } }); return r.ok ? r.json() : null; };
            const tz = new Date().getTimezoneOffset();
            let url = `/api/admin/detailed-analytics?period=${p}&tzOffset=${tz}`;
            if (p === 'custom' && state.summaryCustomFrom && state.summaryCustomTo) url += `&from=${state.summaryCustomFrom}&to=${state.summaryCustomTo}`;
            
            const data = await get(url);
            if (data) state.summaryData = data;
        } finally { 
            state.isSummaryLoading = false; 
        }
    }


    async function fetchOrders() {
        const tz = new Date().getTimezoneOffset();
        const get = async u => { const r = await fetch(u, { headers: { 'Authorization': `Bearer ${state.token}` } }); return r.ok ? r.json() : null; };
        
        const [rawPedidos, rawCustomers] = await Promise.all([
            get(`/api/admin/pedidos?tzOffset=${tz}`),
            get(`/api/admin/customers`)
        ]);

        state.pedidos = rawPedidos || [];
        state.customers = rawCustomers || [];
    }

    function updateLoadingState(selector, isLoading) {
        const el = document.querySelector(selector);
        if (el) {
            if (isLoading) el.classList.add('loading');
            else el.classList.remove('loading');
        }
    }

    function startPolling() {
        if (window.adminPollingInterval) clearInterval(window.adminPollingInterval);
        window.adminPollingInterval = setInterval(async () => {
            if (state.currentSection === 'pedidos' || state.currentSection === 'dashboard') {
                const tz = new Date().getTimezoneOffset();
                const get = async u => { const r = await fetch(u, { headers: { 'Authorization': `Bearer ${state.token}` } }); return r.ok ? r.json() : null; };
                const newPedidos = await get(`/api/admin/pedidos?tzOffset=${tz}`);
                if (newPedidos) {
                    state.pedidos = newPedidos;
                    if (state.currentSection === 'pedidos') renderOrders();
                    else if (state.currentSection === 'dashboard') renderDashboard();
                }
            }
        }, 30000); // 30 segundos
    }

    function setupNavigation() {
        document.querySelector('.menu-bars')?.addEventListener('click', () => {
            document.querySelector('.admin-sidebar')?.classList.toggle('collapsed');
            document.querySelector('.admin-content')?.classList.toggle('collapsed');
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.section === state.currentSection) {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); 
                item.classList.add('active');
            }
            
            item.addEventListener('click', async () => {
                const s = item.dataset.section; if (!s) return;
                
                if (s === 'dashboard' && state.currentSection !== 'dashboard') {
                    state.statsPeriod = 'month';
                    state.chartPeriod = 'month';
                    state.granularity = 'day';
                    state.customFrom = '';
                    state.customTo = '';
                }

                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); item.classList.add('active');
                state.currentSection = s;
                localStorage.setItem('tocha_admin_section', s);
                await fetchData();
                renderSection();
            });
        });

        document.querySelectorAll('.nav-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const subNav = document.getElementById(header.dataset.group);
                header.classList.toggle('open');
                subNav?.classList.toggle('open');
            });
        });
        openGroupForSection(state.currentSection);
    }

    function openGroupForSection(section) {
        const item = document.querySelector(`.nav-item[data-section="${section}"]`);
        if (!item) return;
        const subNav = item.closest('.sub-nav');
        if (!subNav) return;
        subNav.classList.add('open');
        const header = document.querySelector(`.nav-group-header[data-group="${subNav.id}"]`);
        header?.classList.add('open');
    }

    window.navTo = async s => {
        if (s === 'dashboard' && state.currentSection !== 'dashboard') {
            state.statsPeriod = 'month';
            state.chartPeriod = 'month';
            state.granularity = 'day';
            state.customFrom = '';
            state.customTo = '';
            await fetchData();
        }
        state.currentSection = s;
        localStorage.setItem('tocha_admin_section', s);

        document.querySelectorAll('.nav-item').forEach(n => {
            if (n.dataset.section === s) n.classList.add('active');
            else n.classList.remove('active');
        });
        openGroupForSection(s);

        renderSection();
    };

    window.setPeriod = async (p) => {
        state.statsPeriod = p;
        if (p !== 'custom') {
            state.customFrom = ''; state.customTo = '';
        }
        state.granularity = (p === 'today' || p === 'yesterday') ? 'hour' : 'day';
        
        await fetchData(false); 
        renderDashboard();
    };

    window.switchMetric = (m) => {
        state.currentMetric = m;
        // Atualiza borda/cor dos cards sem recarregar o HTML inteiro
        document.querySelectorAll('.metric-card').forEach(card => {
            const isActive = card.getAttribute('onclick')?.includes(`'${m}'`);
            if (isActive) {
                card.style.borderColor = 'var(--primary)';
                card.querySelector('p')?.style.setProperty('color', 'var(--primary)');
            } else {
                card.style.borderColor = '#e2e8f0';
                card.querySelector('p')?.style.setProperty('color', '#475569');
            }
        });
        // Atualiza o gráfico principal
        if (dashboardChart && state.chartData?.labels) {
            const serie = state.chartData.labels.map((l, i) => ({ 
                data: l, 
                faturamento: state.chartData.revenue[i] || 0, 
                pedidos: state.chartData.orders[i] || 0, 
                ticketMedio: state.chartData.averages[i] || 0, 
                lucro: state.chartData.profit[i] || 0 
            }));
            dashboardChart.update(serie, m);
        }
        // Sincroniza o gráfico acumulado
        fetchCumulativeData(state.cumulStatsPeriod);
    };




    function renderSection() {
        document.documentElement.style.zoom = state.currentSection === 'dashboard' ? '0.90' : '0.85';
        // Destrói o DashboardChart adequadamente antes de remover o HTML
        if (dashboardChart) {
            dashboardChart.destroy();
            dashboardChart = null;
        }
        adminMain.innerHTML = '';
        if (state.currentSection === 'dashboard') renderDashboard();
        else if (state.currentSection === 'performance') renderPerformance();
        else if (state.currentSection === 'pedidos') {
            fetchOrders().then(renderOrders);
        }
        else if (state.currentSection === 'prevenda') renderPreVenda();
        else if (state.currentSection === 'historico-pedidos') renderHistoricoPedidos();
        else if (state.currentSection === 'sobre-loja') renderStoreInfo();
        else if (state.currentSection === 'config-home') renderConfigHome();
        else if (state.currentSection === 'horarios') renderOpeningHours();
        else if (state.currentSection === 'pagamentos') renderPayments();
        else if (state.currentSection === 'usuarios') renderCustomers();
        else if (state.currentSection === 'mensagens') renderEngagement();
        else if (state.currentSection === 'config-mensagens') renderMessageConfigs();
        else if (state.currentSection === 'orders-summary') renderOrdersSummary();
        else if (state.currentSection === 'categories') renderCategories();
        else if (state.currentSection === 'profile') renderProfile();
        else if (state.currentSection === 'painel-pagamentos') renderPainelPagamentos();
        else if (state.currentSection === 'funil-vendas') renderFunilVendas();
        else if (state.currentSection === 'alertas') renderAlertas();
        else if (state.currentSection === 'insights') renderInsights();
        else { adminMain.innerHTML = `<div class="welcome-section"><h2>${state.currentSection.toUpperCase()}</h2><p>Conteúdo em desenvolvimento...</p></div>`; }

        if (window.lucide) lucide.createIcons();
    }

    window.togglePeriodSelector = (id, event) => {
        if (event) event.stopPropagation();
        const menu = document.getElementById(id);
        if (!menu) return;
        
        const isVisible = menu.style.display === 'block' || menu.classList.contains('active');
        
        // Fecha todos os outros primeiro
        document.querySelectorAll('.period-selector-menu').forEach(m => {
            m.classList.remove('active');
            m.style.display = 'none';
        });
        
        if (!isVisible) {
            menu.classList.add('active');
            menu.style.display = 'block';
            
            const closeHandler = (e) => {
                if (!menu.contains(e.target)) {
                    menu.classList.remove('active');
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 10);
        }
    };

    window.applyCustomRange = async (type) => {
        let fromEl, toEl, selectorId;
        if (type === 'global') { fromEl = 'dash-from'; toEl = 'dash-to'; selectorId = 'global-period-selector'; }
        else if (type === 'chart') { fromEl = 'chart-from'; toEl = 'chart-to'; selectorId = 'chart-period-selector'; }
        else if (type === 'items') { fromEl = 'items-from'; toEl = 'items-to'; selectorId = 'items-period-selector'; }
        else if (type === 'pay') { fromEl = 'pay-from'; toEl = 'pay-to'; selectorId = 'pay-period-selector'; }
        else if (type === 'cumul') { fromEl = 'cumul-from'; toEl = 'cumul-to'; selectorId = 'cumul-period-selector'; }
        else if (type === 'summary') { fromEl = 'summary-from'; toEl = 'summary-to'; selectorId = 'summary-period-selector'; }

        const from = document.getElementById(fromEl)?.value;
        const to = document.getElementById(toEl)?.value;

        if (!from || !to) {
            showToast('Por favor, selecione ambas as datas.');
            return;
        }

        if (type === 'global') { state.customFrom = from; state.customTo = to; }
        else if (type === 'chart') { state.chartCustomFrom = from; state.chartCustomTo = to; }
        else if (type === 'items') { 
            state.itemsCustomFrom = from; 
            state.itemsCustomTo = to;
            localStorage.setItem('tocha_items_from', from);
            localStorage.setItem('tocha_items_to', to);
        }
        else if (type === 'pay') { state.payCustomFrom = from; state.payCustomTo = to; }
        else if (type === 'cumul') { state.cumulCustomFrom = from; state.cumulCustomTo = to; }
        else if (type === 'summary') { state.summaryCustomFrom = from; state.summaryCustomTo = to; }

        await selectPeriod('custom', selectorId, true);
    };

    window.selectPeriod = async (p, id, forceClose = false) => {
        const menu = document.getElementById(id);
        if (menu) {
            menu.classList.remove('active');
            menu.style.display = 'none';
        }

        if (id === 'items-period-selector') {
            state.itemsStatsPeriod = p;
            localStorage.setItem('tocha_items_period', p);
            const wrap = document.getElementById('items-custom-dates');
            if (p === 'custom' && !forceClose) {
                if (wrap) wrap.style.display = 'flex';
            } else {
                if (wrap) wrap.style.display = 'none';
                await fetchDetailedAnalytics(p);
                refreshItemsBlock();
            }
        } else if (id === 'summary-period-selector') {
            state.summaryPeriod = p;
            const wrap = document.getElementById('summary-custom-dates');
            if (p === 'custom' && !forceClose) {
                if (wrap) wrap.style.display = 'flex';
            } else {
                if (wrap) wrap.style.display = 'none';
                await fetchSummaryData(p);
                renderOrdersSummary();
            }
        } else if (id === 'pay-period-selector') {
            state.payStatsPeriod = p;
            const wrap = document.getElementById('pay-custom-dates');
            if (p === 'custom' && !forceClose) {
                if (wrap) wrap.style.display = 'flex';
            } else {
                if (wrap) wrap.style.display = 'none';
                refreshPaymentBlock();
            }
        } else if (id === 'cumul-period-selector') {
            state.cumulStatsPeriod = p;
            const wrap = document.getElementById('cumul-custom-dates');
            if (p === 'custom' && !forceClose) {
                if (wrap) wrap.style.display = 'flex';
            } else {
                if (wrap) wrap.style.display = 'none';
                await fetchCumulativeData(p, state.cumulCustomFrom, state.cumulCustomTo);
                refreshCumulativeBlock();
            }
        } else if (id === 'global-period-selector' || !id) {
            state.statsPeriod = p;
            const wrap = document.getElementById('dash-custom-dates');
            if (p === 'custom' && !forceClose) {
                if (wrap) wrap.style.display = 'flex';
            } else {
                if (wrap) wrap.style.display = 'none';
                if (p !== 'custom') {
                    state.customFrom = ''; state.customTo = '';
                }
                await fetchData(false);
                renderDashboard();
            }
        } else if (id === 'chart-period-selector') {
            state.chartPeriod = p;
            const wrap = document.getElementById('chart-custom-dates');
            if (p === 'custom' && !forceClose) {
                if (wrap) wrap.style.display = 'flex';
            } else {
                if (wrap) wrap.style.display = 'none';
                if (p !== 'custom') {
                    state.chartCustomFrom = ''; state.chartCustomTo = '';
                }
                state.granularity = (p === 'today' || p === 'yesterday') ? 'hour' : 'day';
                await fetchGlobalStats();
            }
        }
    };

    function refreshItemsBlock() {
        const block = document.querySelector('.desempenho-itens-section');
        if (block) {
            block.innerHTML = `
                <div class="loading-spinner-overlay"><div class="spinner"></div></div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="font-size: 1.025rem; font-weight: 800; color: #1e293b;">Desempenho de itens</h3>
                    ${getPeriodSelectorHTML(state.itemsStatsPeriod, 'items-period-selector')}
                </div>
                <div id="items-custom-dates" class="date-picker-wrap" style="display: ${state.itemsStatsPeriod === 'custom' ? 'flex' : 'none'}; margin-bottom: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; gap: 0.75rem; align-items: center;">
                    <input type="date" id="items-from" value="${state.itemsCustomFrom || ''}" style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; background:#fff; color:#1e293b; outline:none;">
                    <span style="color:#64748b; font-weight:700; font-size: 0.775rem; text-transform:uppercase;">até</span>
                    <input type="date" id="items-to" value="${state.itemsCustomTo || ''}" style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; background:#fff; color:#1e293b; outline:none;">
                    <button onclick="applyCustomRange('items')" style="padding: 0.5rem 1rem; background: var(--primary); color: #fff; border: none; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 0.875rem;">Aplicar</button>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <div class="tab-dash active" style="padding: 0.4rem 0.8rem; font-size: 0.825rem; border-radius: 6px; font-weight:700; background:#f8fafc; border:1px solid #e2e8f0; color:#1e293b;">Produtos</div>
                </div>
                <div id="dashboard-top-items-container" style="max-height: 480px; overflow-y: auto; padding-right:4px;">${state.detailedAnalytics ? getTopItemsHTML(state.detailedAnalytics.itemPerformance.products, 30) : '<div style="text-align:center; padding:1.5rem; color:#64748b; font-size:0.925rem; font-weight:600;">Carregando desempenho...</div>'}</div>
                <div style="margin-top: 1rem; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                    <a onclick="window.navTo('performance')" style="font-size: 0.875rem; color: var(--primary); font-weight: 800; text-decoration: none; cursor: pointer; display: flex; align-items: center; justify-content: flex-end; gap: 4px; text-transform:uppercase; letter-spacing:0.5px;">Ver relatório <i data-lucide="arrow-right" style="width:14px; height:14px;"></i></a>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
    }

    function refreshPaymentBlock() {
        const block = document.getElementById('payment-stats-block');
        if (block) {
            block.innerHTML = `
                <div class="loading-spinner-overlay"><div class="spinner"></div></div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="font-size: 0.875rem; font-weight: 700; color: #64748b; text-transform:uppercase; letter-spacing:0.5px;">Formas de pagamento</h4>
                    ${getPeriodSelectorHTML(state.payStatsPeriod, 'pay-period-selector')}
                </div>
                
                <div id="pay-custom-dates" class="date-picker-wrap" style="display: ${state.payStatsPeriod === 'custom' ? 'flex' : 'none'}; margin-top: -1rem; margin-bottom: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                    <input type="date" id="pay-from" value="${state.payCustomFrom || ''}" style="padding: 0.4rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; flex: 1; background:#fff; color:#1e293b; outline:none;">
                    <input type="date" id="pay-to" value="${state.payCustomTo || ''}" style="padding: 0.4rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; flex: 1; background:#fff; color:#1e293b; outline:none;">
                    <button onclick="applyCustomRange('pay')" style="padding: 0.4rem; width: 100%; background: var(--primary); color: #fff; border: none; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 0.875rem;">Aplicar</button>
                </div>



                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 110px;">
                    <div class="payment-legend-container" style="display: flex; flex-direction: column; gap: 0.6rem; flex: 1.2;">
                         <!-- Injetado via initPaymentChart -->
                    </div>
                    <div style="width: 100px; height: 100px; position: relative; flex-shrink: 0;">
                        <canvas id="paymentChart"></canvas>
                    </div>
                </div>
            `;
            initPaymentChart();
            if (window.lucide) lucide.createIcons();
        }
    }



    function refreshCumulativeBlock() {
        const block = document.getElementById('cumulative-stats-block');
        const metric = state.currentMetric || 'revenue';
        const metricLabel = metric === 'orders' ? 'Pedidos' : (metric === 'lucro' ? 'Lucro' : 'Faturamento');
        const metricColor = metric === 'orders' ? '#10b981' : (metric === 'lucro' ? '#8b5cf6' : (metric === 'averages' ? '#f59e0b' : '#5a57e6'));

        if (block) {
            block.innerHTML = `
                <div class="loading-spinner-overlay"><div class="spinner"></div></div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <h4 style="font-size: 0.875rem; font-weight: 700; color: #64748b; text-transform:uppercase; letter-spacing:0.5px;">${metricLabel} Acumulado</h4>
                    ${getPeriodSelectorHTML(state.cumulStatsPeriod, 'cumul-period-selector')}
                </div>
                <div id="cumul-custom-dates" class="date-picker-wrap" style="display: none; margin-top: -0.2rem; margin-bottom: 0.75rem; padding: 0.5rem; background: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                    <input type="date" id="cumul-from" value="${state.cumulCustomFrom || ''}" style="padding: 0.3rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.825rem; flex: 1; background: #fff; color: #1e293b;">
                    <input type="date" id="cumul-to" value="${state.cumulCustomTo || ''}" style="padding: 0.3rem; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 0.825rem; flex: 1; background: #fff; color: #1e293b;">
                    <button onclick="applyCustomRange('cumul')" style="padding: 0.3rem 0.6rem; width: 100%; background: var(--primary); color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 0.825rem;">Aplicar</button>
                </div>
                 <div style="display: flex; gap: 1rem; font-size: 0.825rem; margin-bottom: 0.5rem; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 0.3rem; color: #ef4444;"><span style="width:8px; height:8px; background:#ef4444; border-radius:50%;"></span> Mês Anterior</div>
                    <div style="display: flex; align-items: center; gap: 0.3rem; color: ${metricColor};"><span style="width:8px; height:8px; background:${metricColor}; border-radius:50%;"></span> Mês Atual</div>
                </div>
                <div style="height: 160px; width: 100%;"><canvas id="cumulativeChart"></canvas></div>
            `;
            initCumulativeChart();
            if (window.lucide) lucide.createIcons();
        }
    }



    function initCumulativeChart() {
        const ctx = document.getElementById('cumulativeChart')?.getContext('2d');
        if (!ctx || !state.cumulativeData) return;

        if (cumulativeChart) cumulativeChart.destroy();

        const data = state.cumulativeData;
        const metric = state.currentMetric || 'revenue';
        const metricColor = metric === 'orders' ? '#10b981' : (metric === 'lucro' ? '#8b5cf6' : (metric === 'averages' ? '#f59e0b' : '#5a57e6'));
        const isCurrency = ['revenue', 'averages', 'lucro'].includes(metric);
        const formatCurrency = v => v ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00';
        const formatValue = v => isCurrency ? formatCurrency(v) : (v || 0).toString();

        cumulativeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Mês Anterior',
                        data: data.previous,
                        borderColor: '#ef4444',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#ef4444',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                    },
                    {
                        label: 'Mês Atual',
                        data: data.current,
                        borderColor: metricColor,
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: metricColor,
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#1e293b',
                        bodyColor: '#475569',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: (items) => items[0].label,
                            label: (item) => formatValue(item.raw),
                            labelTextColor: (item) => item.dataset.borderColor
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(241, 245, 249, 0.5)', drawBorder: false },
                        ticks: { 
                            maxRotation: 0, 
                            autoSkip: false,
                            font: { size: 10, weight: '600' }, 
                            color: '#64748b',
                            callback: function(val, index) {
                                const label = this.getLabelForValue(val);
                                if (!label) return "";
                                const num = parseInt(label);
                                return (num - 1) % 3 === 0 ? label : "";
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(241, 245, 249, 0.5)', drawBorder: false },
                        ticks: { 
                            font: { size: 9, weight: '600' }, 
                            color: '#64748b',
                            maxTicksLimit: 5
                        }
                    }
                }
            }
        });
    }

    function initDashboardCharts() {
        if (!document.getElementById('mainChart')) return;
        if (!state.chartData?.labels) return;
        if (!dashboardChart) {
            dashboardChart = new DashboardChart('mainChart');
        }
        const serie = state.chartData.labels.map((l, i) => ({ 
            data: l, 
            faturamento: state.chartData.revenue[i] || 0, 
            pedidos: state.chartData.orders[i] || 0, 
            ticketMedio: state.chartData.averages[i] || 0, 
            lucro: state.chartData.profit[i] || 0 
        }));
        dashboardChart.render(serie, state.currentMetric);
    }

    async function initPaymentChart() {
        const ctx = document.getElementById('paymentChart')?.getContext('2d');
        if (!ctx) return;
        
        const container = document.getElementById('payment-stats-block');
        if (container) container.classList.add('loading');

        try {
            const p = state.payStatsPeriod || '30d';
            const tz = new Date().getTimezoneOffset();
            let url = `/api/admin/detailed-analytics?period=${p}&tzOffset=${tz}`;
            if (p === 'custom' && state.payCustomFrom && state.payCustomTo) {
                url += `&from=${state.payCustomFrom}&to=${state.payCustomTo}`;
            }

            const response = await fetch(url, { 
                headers: { 'Authorization': `Bearer ${state.token}` },
                cache: 'no-store' 
            });
            const data = await response.json();
            const breakdown = data.paymentBreakdown;

            if (paymentChart) paymentChart.destroy();
            
            const rawData = [
                { label: 'Pix', value: breakdown?.pix?.revenue || 0, color: '#5a57e6' },
                { label: 'Cartão de crédito', value: breakdown?.credito?.revenue || 0, color: '#10b981' },
                { label: 'Cartão de débito', value: breakdown?.debito?.revenue || 0, color: '#f59e0b' },
                { label: 'Outros / Offline', value: breakdown?.outros?.revenue || 0, color: '#94a3b8' }
            ].filter(d => d.value > 0 || ['Pix', 'Cartão de crédito', 'Cartão de débito'].includes(d.label));

            const total = rawData.reduce((a, b) => a + b.value, 0);
            const hasData = total > 0;

            paymentChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: rawData.map(d => d.label),
                    datasets: [{
                        data: hasData ? rawData.map(d => d.value) : [1],
                        backgroundColor: hasData ? rawData.map(d => d.color) : ['#f1f5f9'],
                        hoverOffset: hasData ? 6 : 0,
                        borderWidth: 0,
                        cutout: '75%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: hasData,
                            backgroundColor: '#fff',
                            titleColor: '#1e293b',
                            bodyColor: '#64748b',
                            borderColor: '#e2e8f0',
                            borderWidth: 1,
                            padding: 10,
                            callbacks: {
                                label: (context) => {
                                    const val = context.raw;
                                    const pct = ((val / total) * 100).toFixed(0);
                                    return ` R$ ${val.toLocaleString('pt-BR')} (${pct}%)`;
                                }
                            }
                        }
                    }
                }
            });

            const legendContainer = document.querySelector('.payment-legend-container');

            if (legendContainer) {
                legendContainer.innerHTML = rawData.map((item) => `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; gap: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.845rem; font-weight: 700; color: #475569;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${item.color}; flex-shrink:0;"></span>
                            <span style="white-space: nowrap;">${item.label}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.845rem; font-weight: 800; color: #1e293b; line-height:1;">R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            <div style="font-size: 0.775rem; font-weight: 600; color: #94a3b8; margin-top: 2px;">${hasData ? Math.round((item.value/total)*100) : 0}%</div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error("Erro ao carregar gráfico de canais:", err);
        } finally {
            if (container) container.classList.remove('loading');
        }
    }

    const getFriendlyPeriodLabel = (p) => {
        const labels = {
            'today': 'Hoje',
            'yesterday': 'Ontem',
            '7d': '7 dias',
            '15d': '15 dias',
            'month': 'Este mês',
            '30d': '30 dias',
            'custom': 'Personalizado'
        };
        return labels[p] || 'Selecione';
    };

    const getPeriodSelectorHTML = (current, id) => {
        const options = [
            { val: 'today', label: 'Hoje' },
            { val: 'yesterday', label: 'Ontem' },
            { val: '7d', label: '7 dias' },
            { val: '15d', label: '15 dias' },
            { val: 'month', label: 'Este mês' },
            { val: '30d', label: '30 dias' },
            { val: 'custom', label: 'Personalizado' }
        ];
        return `
            <div class="period-selector-container">
                <button class="period-selector-btn" onclick="togglePeriodSelector('${id}', event)">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                        <span>${getFriendlyPeriodLabel(current)}</span>
                    </div>
                    <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                </button>
                <div id="${id}" class="period-selector-menu" style="display: none;">
                    ${options.map(opt => `
                        <div class="period-option ${current === opt.val ? 'active' : ''}" 
                             onclick="selectPeriod('${opt.val}', '${id}')">
                            ${opt.label}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    // =========================================================================
    // 🛑 ÁREA PROTEGIDA - NÃO ALTERAR - APROVADO & CONGELADO (DASHBOARD)
    // Nenhuma refatoração, alteração de layout, cores ou rotas permitida aqui.
    // Qualquer nova funcionalidade deve ir para uma nova aba isolada.
    // =========================================================================
    function renderDashboard() {
        const d = new Date(), months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"], todayStr = `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
        const formatCurrency = v => v ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00';
        const formatPerc = (v, p) => { if (!v || v === 0) return `<span style="color:#94a3b8; font-weight:600; font-size:0.875rem;">--% vs ${p}</span>`; const color = v > 0 ? '#10b981' : '#ef4444', sign = v > 0 ? '+' : ''; return `<span style="color:${color}; font-weight:800; font-size:0.875rem;">${sign}${v.toFixed(1)}%</span> <span style="color:#94a3b8; font-weight:600; font-size:0.875rem;">vs ${p}</span>`; };
        const prevLabel = state.statsPeriod === 'today' ? 'dia anterior' : (state.statsPeriod === 'yesterday' ? 'dia anterior' : (state.statsPeriod === 'month' ? 'mês anterior' : 'período anterior'));

        adminMain.innerHTML = `
            <div class="dashboard-v3-container" style="animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); padding-bottom: 2rem;">
                <div class="dashboard-top-header" style="margin-bottom: 1.5rem;">
                    <p style="font-size: 0.875rem; color: #94a3b8; font-weight: 700; margin-bottom: 0.25rem; letter-spacing: 0.5px;">${todayStr}</p>
                    <h1 style="font-size: 1.375rem; font-weight: 800; color: #1e293b; margin: 0;">Boas vindas, TOCHA PADARIA</h1>
                </div>

                <div style="margin-bottom: 2rem;">
                    <div class="unit-card-simple" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; display: inline-flex; flex-direction: column; gap: 1rem; min-width: 260px;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="unit-logo-square" style="width: 44px; height: 44px; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                <img src="/assets/logo-tocha.png" style="width: 65%;">
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <h4 style="font-size: 0.975rem; font-weight: 700; color: #1e293b; margin: 0;">Tocha Padaria</h4>
                                <a onclick="window.navTo('sobre-loja')" style="font-size: 0.875rem; color: var(--primary); font-weight: 600; text-decoration: none; cursor: pointer; margin-top:0.1rem;">Minha conta</a>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; width: 100%;">
                            <button onclick="window.copyStoreLink()" style="flex: 1; height:32px; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; font-size: 0.825rem; font-weight: 600; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;"><i data-lucide="link" style="width:12px; height:12px;"></i> Link da loja</button>
                            <button onclick="window.open(window.location.origin, '_blank')" style="flex: 1; height:32px; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; font-size: 0.825rem; font-weight: 600; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;"><i data-lucide="external-link" style="width:12px; height:12px;"></i> Acessar loja</button>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 520px; gap: 2rem; align-items: flex-start;">
                    
                    <div class="dash-main-column" style="display: flex; flex-direction: column; gap: 1.5rem;">
                        
                        <div id="visao-geral-block" class="visao-geral-section" style="background: transparent;">
                            <div style="margin-bottom: 1.25rem;">
                                <h3 style="font-size: 1.075rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem;">Visão Geral</h3>
                                <div class="dashboard-filters" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <div class="tab-dash ${state.statsPeriod === 'yesterday' ? 'active' : ''}" onclick="setPeriod('yesterday')" style="padding:0.35rem 0.8rem; font-size:0.875rem; border-radius: 6px; font-weight: 600; border: 1px solid var(--primary); color: ${state.statsPeriod === 'yesterday' ? '#fff' : 'var(--primary)'}; background: ${state.statsPeriod === 'yesterday' ? 'var(--primary)' : 'transparent'}; cursor:pointer;">Ontem</div>
                                    <div class="tab-dash ${state.statsPeriod === 'today' ? 'active' : ''}" onclick="setPeriod('today')" style="padding:0.35rem 0.8rem; font-size:0.875rem; border-radius: 6px; font-weight: 600; border: 1px solid var(--primary); color: ${state.statsPeriod === 'today' ? '#fff' : 'var(--primary)'}; background: ${state.statsPeriod === 'today' ? 'var(--primary)' : 'transparent'}; cursor:pointer;">Hoje</div>
                                    <div class="tab-dash ${state.statsPeriod === '15d' ? 'active' : ''}" onclick="setPeriod('15d')" style="padding:0.35rem 0.8rem; font-size:0.875rem; border-radius: 6px; font-weight: 600; border: 1px solid var(--primary); color: ${state.statsPeriod === '15d' ? '#fff' : 'var(--primary)'}; background: ${state.statsPeriod === '15d' ? 'var(--primary)' : 'transparent'}; cursor:pointer;">15 dias</div>
                                    <div class="tab-dash ${state.statsPeriod === 'month' ? 'active' : ''}" onclick="setPeriod('month')" style="padding:0.35rem 0.8rem; font-size:0.875rem; border-radius: 6px; font-weight: 600; border: 1px solid var(--primary); color: ${state.statsPeriod === 'month' ? '#fff' : 'var(--primary)'}; background: ${state.statsPeriod === 'month' ? 'var(--primary)' : 'transparent'}; cursor:pointer;">Este mês</div>
                                    <div class="tab-dash ${state.statsPeriod === 'custom' ? 'active' : ''}" onclick="selectPeriod('custom', 'global-period-selector')" style="padding:0.35rem 0.8rem; font-size:0.875rem; border-radius: 6px; font-weight: 600; border: 1px solid var(--primary); color: ${state.statsPeriod === 'custom' ? '#fff' : 'var(--primary)'}; background: ${state.statsPeriod === 'custom' ? 'var(--primary)' : 'transparent'}; display: flex; align-items: center; gap: 0.4rem; cursor:pointer;"><i data-lucide="calendar" style="width:12px; height:12px;"></i> Personalizar</div>
                                </div>
                                <div id="dash-custom-dates" class="date-picker-wrap" style="display: ${state.statsPeriod === 'custom' ? 'flex' : 'none'}; margin-top: 1rem; padding: 1rem; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; gap: 0.75rem; align-items: center;">
                                    <input type="date" id="dash-from" onchange="applyCustomRange('global')" value="${state.customFrom || ''}" style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; background: #fff; color: #1e293b; outline:none;">
                                    <span style="color:#64748b; font-weight:600; font-size: 0.825rem; text-transform:uppercase;">até</span>
                                    <input type="date" id="dash-to" onchange="applyCustomRange('global')" value="${state.customTo || ''}" style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; background: #fff; color: #1e293b; outline:none;">
                                    <button onclick="applyCustomRange('global')" style="padding: 0.5rem 1rem; background: var(--primary); color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.875rem;">Aplicar</button>
                                </div>
                            </div>

                            <div class="metric-cards-grid" style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                                <!-- Faturamento -->
                                <div class="metric-card ${state.currentMetric === 'revenue' ? 'active' : ''}" onclick="switchMetric('revenue')" style="flex: 1; padding: 1.25rem; border-radius: 8px; border: 1px solid ${state.currentMetric === 'revenue' ? 'var(--primary)' : '#e2e8f0'}; background: #fff; cursor: pointer; transition: 0.2s;">
                                     <p style="font-size: 0.875rem; font-weight: 600; color: ${state.currentMetric === 'revenue' ? 'var(--primary)' : '#475569'}; margin-bottom: 0.75rem;">Faturamento</p>
                                     <h2 style="font-size: 1.475rem; font-weight: 700; color: #1e293b; margin-bottom: 0.25rem;">${formatCurrency(state.stats?.revenue)}</h2>
                                     <div style="font-size: 0.875rem;">${formatPerc(state.stats?.revenueVar, prevLabel)}</div>
                                </div>
                                <!-- Pedidos -->
                                <div class="metric-card ${state.currentMetric === 'orders' ? 'active' : ''}" onclick="switchMetric('orders')" style="flex: 1; padding: 1.25rem; border-radius: 8px; border: 1px solid ${state.currentMetric === 'orders' ? 'var(--primary)' : '#e2e8f0'}; background: #fff; cursor: pointer; transition: 0.2s;">
                                     <p style="font-size: 0.875rem; font-weight: 600; color: ${state.currentMetric === 'orders' ? 'var(--primary)' : '#475569'}; margin-bottom: 0.75rem;">Pedidos</p>
                                     <h2 style="font-size: 1.475rem; font-weight: 700; color: #1e293b; margin-bottom: 0.25rem;">${state.stats?.ordersCount || 0}</h2>
                                     <div style="font-size: 0.875rem;">${formatPerc(state.stats?.ordersVar, prevLabel)}</div>
                                </div>
                                <!-- Ticket Médio -->
                                <div class="metric-card ${state.currentMetric === 'averages' ? 'active' : ''}" onclick="switchMetric('averages')" style="flex: 1; padding: 1.25rem; border-radius: 8px; border: 1px solid ${state.currentMetric === 'averages' ? 'var(--primary)' : '#e2e8f0'}; background: #fff; cursor: pointer; transition: 0.2s;">
                                     <p style="font-size: 0.875rem; font-weight: 600; color: ${state.currentMetric === 'averages' ? 'var(--primary)' : '#475569'}; margin-bottom: 0.75rem;">Ticket Médio</p>
                                     <h2 style="font-size: 1.475rem; font-weight: 700; color: #1e293b; margin-bottom: 0.25rem;">${formatCurrency(state.stats?.averageTicket)}</h2>
                                     <div style="font-size: 0.875rem;">${formatPerc(state.stats?.ticketVar, prevLabel)}</div>
                                </div>
                                <!-- Lucro -->
                                <div class="metric-card ${state.currentMetric === 'lucro' ? 'active' : ''}" onclick="switchMetric('lucro')" style="flex: 1; padding: 1.25rem; border-radius: 8px; border: 1px solid ${state.currentMetric === 'lucro' ? 'var(--primary)' : '#e2e8f0'}; background: #fff; cursor: pointer; transition: 0.2s;">
                                     <p style="font-size: 0.875rem; font-weight: 600; color: ${state.currentMetric === 'lucro' ? 'var(--primary)' : '#475569'}; margin-bottom: 0.75rem;">Lucro</p>
                                     <h2 style="font-size: 1.475rem; font-weight: 700; color: #1e293b; margin-bottom: 0.25rem;">${formatCurrency(state.stats?.profit)}</h2>
                                     <div style="font-size: 0.875rem;">${formatPerc(state.stats?.profitVar, prevLabel)}</div>
                                </div>
                            </div>

                            <div style="height: 250px; position: relative; width: 100%;"><canvas id="mainChart"></canvas></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;">
                                <div style="display: flex; align-items: center; gap: 0.4rem; border: 1px solid #e2e8f0; padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.875rem; font-weight: 600; color: #475569; background:#fff; cursor: pointer;">Hora <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i></div>
                                <a onclick="window.navTo('performance')" style="font-size: 0.875rem; color: var(--primary); font-weight: 600; text-decoration: none; cursor: pointer; display: flex; align-items: center; gap: 4px;">Ver relatórios <i data-lucide="arrow-right" style="width:12px; height:12px;"></i></a>
                            </div>
                        </div>

                        <!-- Desempenho de Itens -->
                        <div class="desempenho-itens-section component-container ${state.isItemsLoading ? 'loading' : ''}" style="background: transparent;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                                <h3 style="font-size: 1.075rem; font-weight: 700; color: #1e293b;">Desempenho de itens</h3>
                                ${getPeriodSelectorHTML(state.itemsStatsPeriod, 'items-period-selector')}
                            </div>
                            <div id="items-custom-dates" style="display:${state.itemsStatsPeriod==='custom'?'flex':'none'}; margin-bottom:1rem; gap:0.5rem; flex-wrap:wrap; align-items:center; background:#f8fafc; padding:0.75rem; border-radius:8px; border:1px solid #e2e8f0;">
                                <input type="date" id="items-from" value="${state.itemsCustomFrom || ''}" style="padding:0.4rem; font-size:0.875rem; border:1px solid #e2e8f0; border-radius:4px; outline:none; flex:1;" onchange="applyCustomRange('items')">
                                <input type="date" id="items-to" value="${state.itemsCustomTo || ''}" style="padding:0.4rem; font-size:0.875rem; border:1px solid #e2e8f0; border-radius:4px; outline:none; flex:1;" onchange="applyCustomRange('items')">
                            </div>
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                                <div class="tab-dash active" style="padding: 0.35rem 0.8rem; border-radius: 4px; font-size: 0.875rem; border: 1px solid var(--primary); background: #fff; color: var(--primary); font-weight: 600;">Produtos</div>
                            </div>
                            <div id="dashboard-top-items-container" style="max-height: 480px; overflow-y: auto;">
                                ${state.detailedAnalytics ? getTopItemsHTML(state.detailedAnalytics.itemPerformance.products, 30) : `
                                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 0; border: 1px dashed #cbd5e1; border-radius: 8px;">
                                        <div style="width: 48px; height: 48px; background: #e0e7ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                                            <i data-lucide="list" style="width: 24px; height: 24px; color: var(--primary);"></i>
                                        </div>
                                        <h4 style="font-size: 1.075rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">Processando dados...</h4>
                                        <p style="font-size: 0.925rem; color: #64748b; max-width: 300px; text-align: center;">Aguarde enquanto carregamos o desempenho dos produtos.</p>
                                    </div>
                                `}
                            </div>
                            <div style="display: flex; justify-content: flex-end; margin-top: 1rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                                <a onclick="window.navTo('performance')" style="font-size: 0.875rem; color: var(--primary); font-weight: 600; text-decoration: none; cursor: pointer; display: flex; align-items: center; gap: 4px; text-transform:uppercase; letter-spacing:0.5px;">Ver relatório completo <i data-lucide="arrow-right" style="width:12px; height:12px;"></i></a>
                            </div>
                        </div>

                        <!-- GESTÃO DE CLIENTES RECORRENTES (CRM INTELIGENTE) -->
                        <div class="crm-intelligence-row" style="margin-top:2rem; display:grid; grid-template-columns: 1.6fr 1.1fr; gap:1.5rem;">
                            <!-- Ranking de Recorrência -->
                            <div class="component-container" style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:1.5rem; box-shadow:0 4px 20px rgba(0,0,0,0.02); display:flex; flex-direction:column; gap:1.5rem;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <div>
                                        <h3 style="font-size: 1.175rem; font-weight:950; color:#1e293b; margin:0; letter-spacing:-0.5px;">Ranking de Recorrência</h3>
                                        <div style="font-size:0.875rem; color:#64748b; font-weight:700; margin-top:4px;">Seus clientes mais leais e ativos</div>
                                    </div>
                                    <div style="width:42px; height:42px; background:#f5f3ff; color:#8b5cf6; border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.1);">
                                        <i data-lucide="award" style="width:22px; height:22px;"></i>
                                    </div>
                                </div>
                                <div style="overflow-x:auto;">
                                    ${getRecurringRankingHTML(state.customers)}
                                </div>
                            </div>

                            <!-- Clientes Ausentes -->
                            <div class="component-container" style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:1.5rem; box-shadow:0 4px 20px rgba(0,0,0,0.02); display:flex; flex-direction:column; gap:1.5rem;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <div>
                                        <h3 style="font-size: 1.175rem; font-weight:950; color:#1e293b; margin:0; letter-spacing:-0.5px;">Clientes em Pausa</h3>
                                        <div style="font-size:0.875rem; color:#64748b; font-weight:700; margin-top:4px;">Recorrentes sem comprar há +15 dias</div>
                                    </div>
                                    <div style="width:42px; height:42px; background:#fff1f2; color:#ef4444; border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.1);">
                                        <i data-lucide="zap-off" style="width:22px; height:22px;"></i>
                                    </div>
                                </div>
                                <div style="flex:1;">
                                    ${getInactiveCRMHTML(state.customers)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="dash-sidebar-column" style="display: flex; flex-direction: column; gap: 2rem;">
                        <!-- Canais de Venda -->
                        <div id="payment-stats-block" class="side-panel-card component-container ${state.isPaymentLoading ? 'loading' : ''}">
                             <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                                 <h3 style="font-size: 1.075rem; font-weight: 700; color: #1e293b;">Formas de pagamento</h3>
                                 ${getPeriodSelectorHTML(state.payStatsPeriod, 'pay-period-selector')}
                             </div>
                             <div id="pay-custom-dates" style="display:${state.payStatsPeriod==='custom'?'flex':'none'}; margin-bottom:1rem; gap:0.5rem; flex-wrap:wrap; align-items:center; background:#f8fafc; padding:0.75rem; border-radius:8px; border:1px solid #e2e8f0;">
                                 <input type="date" id="pay-from" value="${state.payCustomFrom || ''}" style="padding:0.4rem; font-size:0.875rem; border:1px solid #e2e8f0; border-radius:4px; outline:none; flex:1;" onchange="applyCustomRange('pay')">
                                 <input type="date" id="pay-to" value="${state.payCustomTo || ''}" style="padding:0.4rem; font-size:0.875rem; border:1px solid #e2e8f0; border-radius:4px; outline:none; flex:1;" onchange="applyCustomRange('pay')">
                                 <button onclick="applyCustomRange('pay')" style="padding: 0.4rem; width: 100%; background: var(--primary); color: #fff; border: none; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 0.875rem;">Aplicar Filtro</button>
                             </div>


                             <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 170px;">
                                 <div class="payment-legend-container" style="display: flex; flex-direction: column; gap: 0.6rem; flex: 1.2;">
                                     <!-- Injetado via initPaymentChart -->
                                 </div>
                                 <div style="width: 160px; height: 160px; position:relative; flex-shrink: 0;">
                                     <canvas id="paymentChart"></canvas>
                                 </div>
                             </div>

                        </div>

                        <!-- Faturamento Acumulado -->
                        <div id="cumulative-stats-block" class="side-panel-card cumul-block-card component-container ${state.isCumulLoading ? 'loading' : ''}">
                             <!-- Injetado via refreshCumulativeBlock -->
                        </div>

                    </div>
                </div>
            </div>
        `;
        initDashboardCharts();
        initPaymentChart();
        refreshCumulativeBlock();
        refreshItemsBlock();
        if (window.lucide) lucide.createIcons();
    }

    async function fetchSummaryData() {
        state.isSummaryLoading = true;
        try {
            const get = async u => { const r = await fetch(u, { headers: { 'Authorization': `Bearer ${state.token}` } }); return r.ok ? r.json() : null; };
            const tz = new Date().getTimezoneOffset();
            // Fixamos 30 dias para capturar todas as fornadas ativas sem dependência de filtro manual
            let url = `/api/admin/detailed-analytics?period=30d&tzOffset=${tz}`;
            
            const data = await get(url);
            if (data) state.summaryData = data;
        } finally { 
            state.isSummaryLoading = false; 
        }
    }



    async function changeCalendarDate(month, year) {
        state.calMonth = parseInt(month);
        state.calYear = parseInt(year);
        
        const pad = v => v.toString().padStart(2, '0');
        const from = `${year}-${pad(state.calMonth + 1)}-01`;
        const lastDay = new Date(year, state.calMonth + 1, 0).getDate();
        const to = `${year}-${pad(state.calMonth + 1)}-${pad(lastDay)}`;
        
        const tz = new Date().getTimezoneOffset();
        const url = `/api/admin/detailed-analytics?period=custom&from=${from}&to=${to}&tzOffset=${tz}`;
        
        const get = async u => { const r = await fetch(u, { headers: { 'Authorization': `Bearer ${state.token}` } }); return r.ok ? r.json() : null; };
        const data = await get(url);
        if (data) {
            state.calendarData = data;
            renderPerformance();
        }
    }

    async function renderOrdersSummary() {
        const adminMain = document.getElementById('admin-main');
        if (!adminMain) return;

        if (!state.summaryData) {
            await fetchSummaryData();
        }

        const data = state.summaryData;
        const products = data?.itemPerformance?.products || [];
        
        // Contadores independentes por fornada
        const totalItemsAtual = products.reduce((sum, p) => sum + (p.qtyAtual || 0), 0);
        const totalItemsProxima = products.reduce((sum, p) => sum + (p.qtyProxima || 0), 0);

        // Formatação das datas das fornadas para os títulos
        const fmtSummaryDate = s => {
            if (!s) return 'DD/MM';
            const parts = s.split('T')[0].split('-');
            if (parts.length < 3) return 'DD/MM';
            return `${parts[2]}/${parts[1]}`;
        };

        const currentBakeRaw = data?.production?.currentBakeDate || '';
        const nextBakeRaw = data?.production?.nextBakeDate || '';
        const currentBakeFmt = fmtSummaryDate(currentBakeRaw);
        const nextBakeFmt = fmtSummaryDate(nextBakeRaw);

        // Listas filtradas e ordenadas
        const listAtual = products.filter(p => (p.qtyAtual || 0) > 0).sort((a,b) => b.qtyAtual - a.qtyAtual);
        const listProxima = products.filter(p => (p.qtyProxima || 0) > 0).sort((a,b) => b.qtyProxima - a.qtyProxima);

        adminMain.innerHTML = `
            <div class="summary-view" style="animation: fadeIn 0.4s ease-out; padding: 0.5rem 1rem;">
                
                <!-- HEADER PRINCIPAL -->
                <div style="margin-bottom: 3.5rem;">
                    <h2 style="font-size: 1.975rem; font-weight: 950; color: #1e293b; margin: 0; letter-spacing: -0.8px;">Resumo de Produção</h2>
                    <p style="color: #64748b; margin-top: 0.6rem; font-size: 1.075rem; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
                        Consolidado operacional em tempo real por ciclo de fornada
                    </p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 2.5rem; align-items: start;">
                    
                    <!-- BLOCO 1: FORNADA ATUAL -->
                    <div style="background: #fff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.02); transition: 0.3s ease;">
                        <div style="padding: 2rem 2.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.4rem;">
                                    <div style="width: 28px; height: 28px; background: #fff1f2; color: #ef4444; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.025rem;"><i data-lucide="flame" style="width: 16px; height: 16px;"></i></div>
                                    <h3 style="margin: 0; font-size: 1.275rem; font-weight: 900; color: #1e293b; letter-spacing: -0.3px;">Produzir Hoje</h3>
                                </div>
                                <span style="font-size: 0.975rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">FORNADA ${currentBakeFmt}</span>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.725rem; font-weight: 950; color: #1e293b; line-height: 1;">${totalItemsAtual}</div>
                                <div style="font-size: 0.825rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">ITENS TOTAIS</div>
                            </div>
                        </div>
                        <div style="padding: 1rem 0;">
                            ${listAtual.length > 0 ? listAtual.map(p => `
                                <div style="padding: 1.1rem 2.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc; transition: background 0.2s;">
                                    <span style="font-size: 1.075rem; font-weight: 700; color: #334155;">${p.name}</span>
                                    <span style="font-size: 1.225rem; font-weight: 900; color: #1e293b; background: #f1f5f9; padding: 4px 12px; border-radius: 10px; min-width: 42px; text-align: center;">${p.qtyAtual}</span>
                                </div>
                            `).join('') : `
                                <div style="padding: 5rem 2rem; text-align: center;">
                                    <div style="color: #cbd5e1; margin-bottom: 1rem;"><i data-lucide="check-circle" style="width: 48px; height: 48px; opacity: 0.3;"></i></div>
                                    <p style="color: #94a3b8; font-weight: 600; font-size: 1.025rem;">Tudo pronto por aqui! Nenhum item pendente.</p>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- BLOCO 2: PRÓXIMA FORNADA -->
                    <div style="background: #fff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.02); transition: 0.3s ease;">
                        <div style="padding: 2rem 2.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.4rem;">
                                    <div style="width: 28px; height: 28px; background: #eff6ff; color: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.025rem;"><i data-lucide="snowflake" style="width: 16px; height: 16px;"></i></div>
                                    <h3 style="margin: 0; font-size: 1.275rem; font-weight: 900; color: #1e293b; letter-spacing: -0.3px;">Próxima Fornada</h3>
                                </div>
                                <span style="font-size: 0.975rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">FILA ACUMULADA • ${nextBakeFmt}</span>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.725rem; font-weight: 950; color: var(--primary); line-height: 1;">${totalItemsProxima}</div>
                                <div style="font-size: 0.825rem; color: #64748b; font-weight: 800; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">ITENS TOTAIS</div>
                            </div>
                        </div>
                        <div style="padding: 1rem 0;">
                            ${listProxima.length > 0 ? listProxima.map(p => `
                                <div style="padding: 1.1rem 2.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc; transition: background 0.2s;">
                                    <span style="font-size: 1.075rem; font-weight: 700; color: #334155;">${p.name}</span>
                                    <span style="font-size: 1.225rem; font-weight: 900; color: var(--primary); background: rgba(90, 87, 230, 0.05); padding: 4px 12px; border-radius: 10px; min-width: 42px; text-align: center;">${p.qtyProxima}</span>
                                </div>
                            `).join('') : `
                                <div style="padding: 5rem 2rem; text-align: center;">
                                    <div style="color: #cbd5e1; margin-bottom: 1rem;"><i data-lucide="clock" style="width: 48px; height: 48px; opacity: 0.3;"></i></div>
                                    <p style="color: #94a3b8; font-weight: 600; font-size: 1.025rem;">Aguardando os primeiros pedidos do próximo ciclo.</p>
                                </div>
                            `}
                        </div>
                    </div>

                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();
    }

    // =========================================================================
    // 🛑 ÁREA PROTEGIDA - NÃO ALTERAR - APROVADO & CONGELADO (PERFORMANCE)
    // =========================================================================
    function renderPerformance() {
        const d = new Date(), months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const formatCurrency = v => v ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00';
        const data = state.detailedAnalytics;
        if (!data) { adminMain.innerHTML = `<div style="padding:5rem; text-align:center; color:#64748b; font-weight:800; font-size:1.225rem;">Carregando analytics premium...</div>`; return; }

        const calSource = state.calendarData || data;

        // Dispara o carregamento inicial do calendário se estiver vazio
        if (!state.calendarData && !state.isCalendarLoading) {
            state.isCalendarLoading = true;
            changeCalendarDate(state.calMonth, state.calYear).finally(() => state.isCalendarLoading = false);
        }

        adminMain.innerHTML = `
            <div style="margin-bottom: 2.5rem;">
                <h1 style="font-size: 1.8rem; font-weight: 950; color: #1e293b; margin-bottom: 0.5rem; letter-spacing:-0.5px;">Performance Estratégica</h1>
                <p style="font-size: 1.075rem; color: #64748b; font-weight: 600;">Análise profunda de faturamento, ticket médio e volume de vendas.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 3rem;">
                ${renderMetricCard('Faturamento bruto', data.metrics.revenue, 'dollar-sign', '#3b82f6')}
                ${renderMetricCard('Ticket médio', data.metrics.ticket, 'trending-up', '#f59e0b')}
                ${renderMetricCard('Nº pedidos', data.metrics.totalOrders, 'shopping-cart', '#ef4444', false)}
            </div>

            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:32px; padding:2.5rem; margin-bottom:4rem; box-shadow: 0 10px 40px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2.5rem;">
                    <div>
                        <h3 style="font-weight:900; font-size:1.225rem; color:#1e293b; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.25rem;">Evolução de Longo Prazo</h3>
                        <p style="font-size:0.975rem; color:#64748b; font-weight:600;">Histórico mensal consolidado dos últimos 12 meses</p>
                    </div>
                </div>

                <div id="historicalMonthlyArea" style="min-height: 480px; position: relative;">
                    <div style="display: flex; align-items: center; justify-content: center; height: 480px; color: #94a3b8; font-weight: 700;">Consolidando métricas financeiras...</div>
                </div>
            </div>

            <!-- NOVO BLOCO: VENDAS DO MÊS (CALENDÁRIO) -->
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:32px; padding:2.5rem; margin-bottom:4rem; box-shadow: 0 10px 40px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2.5rem;">
                    <h2 style="font-size: 1.525rem; font-weight: 950; color: #1e293b; margin: 0;">Vendas do mês</h2>
                    <select onchange="changeCalendarDate(this.value.split('-')[0], this.value.split('-')[1])" style="padding: 0.6rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #475569; outline: none; background: #f8fafc; cursor: pointer;">
                        ${months.map((m, i) => `
                            <option value="${i}-${state.calYear}" ${i === state.calMonth ? 'selected' : ''}>${m} de ${state.calYear}</option>
                        `).join('')}
                    </select>
                </div>

                <div style="display: flex; gap: 1.5rem; margin-bottom: 2rem;">
                    <div style="flex: 1; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 16px; padding: 1.5rem;">
                        <div style="font-size: 0.925rem; font-weight: 700; color: #7c3aed; text-transform: uppercase; margin-bottom: 0.5rem;">Venda total</div>
                        <div style="font-size: 1.525rem; font-weight: 900; color: #1e293b;">${formatCurrency(calSource.metrics.revenue)}</div>
                    </div>
                    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem;">
                        <div style="font-size: 0.925rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem;">Pedidos</div>
                        <div style="font-size: 1.525rem; font-weight: 900; color: #1e293b;">${calSource.metrics.totalOrders}</div>
                    </div>
                    <div style="flex: 2; display: flex; align-items: center; gap: 0.75rem; color: #0ea5e9;">
                         <i data-lucide="info" style="width: 20px; height: 20px;"></i>
                         <span style="font-size: 0.975rem; font-weight: 600;">As informações correspondem ao mês de ${months[state.calMonth]} de ${state.calYear}</span>
                    </div>
                </div>

                ${renderMonthlyCalendar(calSource.dailyBreakdown, state.calMonth, state.calYear)}
            </div>

            <div style="margin-bottom:4rem;">
                <h3 style="font-weight:900; margin-bottom:2rem; font-size:1.15rem; color:#1e293b; text-transform:uppercase; letter-spacing:1px;">Ranking de Itens Vendidos (Top 100)</h3>
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:20px; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
                    ${getTopItemsHTML(data.itemPerformance.products, 100)}
                </div>
            </div>
        `;

        renderHistoricalMonthlyChart();
        if (window.lucide) lucide.createIcons();
    }

    window.openDayDetail = (key) => {
        const data = state.calendarData || state.detailedAnalytics;
        if (!data || !data.dailyBreakdown || !data.dailyBreakdown[key]) return;
        const dayInfo = data.dailyBreakdown[key];
        if (!dayInfo.orderList || dayInfo.orderList.length === 0) return;

        // Ordenar por hora (cronológico)
        const sorted = [...dayInfo.orderList].sort((a, b) => a.time.localeCompare(b.time));

        const html = `
            <div style="width: 100%; overflow-x: hidden;">
                <h2 style="font-size: 1.625rem; font-weight: 950; color: #1e293b; margin-bottom: 0.5rem; letter-spacing: -0.5px;">Detalhamento de Vendas</h2>
                <p style="font-size: 1.025rem; color: #64748b; font-weight: 600; margin-bottom: 2rem;">Referente ao dia ${dayInfo.day} de ${["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][state.calMonth]}</p>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 500px; overflow-y: auto; overflow-x: hidden; padding-right: 15px;">
                    ${sorted.map(o => {
                        let bakeFmt = '--/--';
                        if (o.bakeDate) {
                            const raw = o.bakeDate.split('T')[0];
                            const parts = raw.split(/[-/]/);
                            if (parts.length >= 3) {
                                // Se o primeiro tem 4 dígitos (YYYY-MM-DD)
                                if (parts[0].length === 4) bakeFmt = `${parts[2].padStart(2,'0')}/${parts[1].padStart(2,'0')}`;
                                // Se o último tem 4 dígitos (DD/MM/YYYY)
                                else if (parts[2].length === 4) bakeFmt = `${parts[0].padStart(2,'0')}/${parts[1].padStart(2,'0')}`;
                            } else if (parts.length === 2) {
                                bakeFmt = `${parts[0].padStart(2,'0')}/${parts[1].padStart(2,'0')}`;
                            }
                        }
                        return `
                            <div style="padding: 1rem 0; border-bottom: 1px solid #f1f5f9; font-size: 1.025rem; color: #1e293b; font-weight: 700; white-space: nowrap;">
                                ${o.customer} — <span style="color:#6366f1;">Pedido #${o.orderNumber}</span> — ${o.time} — <span style="color:#64748b;">Fornada ${bakeFmt}</span> — <span style="font-weight:900;">R$ ${o.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div style="margin-top: 2rem; padding: 1.25rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.925rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Total faturado no dia</div>
                    <div style="font-size: 1.375rem; font-weight: 1000; color: #1e293b;">R$ ${dayInfo.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>

                <button onclick="window.closeOrderModal()" style="width: 100%; margin-top: 1.5rem; padding: 1rem; background: #1e293b; color: #fff; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; transition: 0.2s;">Fechar Detalhes</button>
            </div>
        `;

        const modalBody = document.getElementById('modal-body-content');
        const modalOverlay = document.getElementById('order-modal-overlay');
        if (modalBody && modalOverlay) {
            modalBody.innerHTML = html;
            modalOverlay.classList.add('active');
        }
    };

    function renderMonthlyCalendar(dailyData, month, year) {
        const d = new Date(year, month, 1);
        const startDay = d.getDay(); // 0 (Dom) a 6 (Sab)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
        const weekdayTotals = Array(7).fill(0);
        let monthlyTotal = 0;
        
        let html = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 800px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
                    <thead style="background: #e0e7ff; color: #4338ca;">
                        <tr>
                            ${weekdays.map(w => `<th style="padding: 0.75rem; font-size: 0.875rem; font-weight: 800; text-transform: uppercase; text-align: left;">${w}</th>`).join('')}
                            <th style="padding: 0.75rem; font-size: 0.875rem; font-weight: 800; text-transform: uppercase; text-align: right; background: #e0e7ff;">Total semana</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let currentDay = 1;
        let weekTotal = 0;

        // Loop das semanas
        for (let row = 0; row < 6; row++) {
            if (currentDay > daysInMonth) break;
            html += `<tr>`;
            weekTotal = 0;

            for (let col = 0; col < 7; col++) {
                if ((row === 0 && col < startDay) || currentDay > daysInMonth) {
                    html += `<td style="border: 1px solid #f1f5f9; background: #fbfcfd; height: 100px;"></td>`;
                } else {
                    const key = `${year}-${month + 1}-${currentDay}`;
                    const dayInfo = dailyData[key] || { revenue: 0, orders: 0 };
                    const rev = dayInfo.revenue || 0;
                    
                    weekTotal += rev;
                    weekdayTotals[col] += rev;
                    monthlyTotal += rev;

                    html += `
                        <td onclick="openDayDetail('${key}')" style="border: 1px solid #f1f5f9; padding: 0.75rem; vertical-align: top; height: 100px; background: #fff; cursor: pointer; transition: 0.2s;">
                            <div style="font-size: 0.925rem; font-weight: 800; color: #94a3b8; margin-bottom: 0.4rem;">${currentDay}</div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.975rem; font-weight: 800; color: ${rev > 0 ? '#1e293b' : '#cbd5e1'};">R$ ${rev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                ${dayInfo.orders > 0 ? `<div style="font-size: 0.845rem; color: #94a3b8; font-weight: 600; margin-top: 4px;">${dayInfo.orders} pedidos</div>` : ''}
                            </div>
                        </td>
                    `;
                    currentDay++;
                }
            }

            html += `
                <td style="border: 1px solid #f1f5f9; padding: 0.75rem; text-align: right; background: #f8fafc; font-weight: 900; color: #475569; vertical-align: bottom;">
                    <div style="font-size: 0.975rem;">R$ ${weekTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </td>
            </tr>`;
        }

        // Linha de Totais por dia da semana
        html += `
                    <tr style="background: #f8fafc; font-weight: 900; font-size: 0.975rem; color: #1e293b;">
                        ${weekdayTotals.map(t => `<td style="padding: 1rem 0.75rem; border: 1px solid #e2e8f0; text-align: right;">R$ ${t.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>`).join('')}
                        <td style="padding: 1rem 0.75rem; border: 1px solid #e0e7ff; text-align: right; background: #e0e7ff; color: #4338ca; font-size: 1.125rem;">
                            <div style="font-size: 0.775rem; color: #4338ca; text-transform: uppercase;">Total mês</div>
                            R$ ${monthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>`;

        return html;
    }

    function renderMetricCard(label, val, icon, color, isCurrency = true) {
        return `
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.75rem; display: flex; flex-direction: column; gap: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: ${color}15; color: ${color}; display: flex; align-items: center; justify-content: center; border: 1px solid ${color}25;"><i data-lucide="${icon}" style="width:22px; height:22px;"></i></div>
                    <div style="font-size: 0.975rem; font-weight: 900; color: #64748b; letter-spacing: 0.5px; text-transform:uppercase;">${label}</div>
                </div>
                <div style="font-size: 1.8rem; font-weight: 950; color: #1e293b; letter-spacing:-0.5px;">${isCurrency ? `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : val}</div>
            </div>
        `;
    }

    function renderSummaryBox(label, val, icon) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return `
            <div style="flex: 1; background: ${isDark ? '#f8fafc' : '#eff6ff'}; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; border: 1px solid #e2e8f0;">
                <div style="width: 42px; height: 42px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; color: var(--primary); border: 1px solid #e2e8f0;"><i data-lucide="${icon}" style="width:20px; height:20px;"></i></div>
                <div>
                    <div style="font-size: 0.975rem; font-weight: 700; color: #94a3b8; margin-bottom:0.15rem;">${label}</div>
                    <div style="font-size: 1.125rem; font-weight: 800; color: #1e293b;">${val || 'Sem informação'}</div>
                </div>
            </div>
        `;
    }

    function renderCalendar(data, month, year) {
        const d = new Date(year, month, 1);
        const startDay = d.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const bgOdd = isDark ? '#fff' : '#fbfcfd';
        const borderColor = isDark ? '#1F1F1F' : '#f1f5f9';
        
        const rows = [];
        let cells = [];
        for (let i = 0; i < startDay; i++) cells.push(`<div style="background:${bgOdd}; min-height:120px; padding:1rem; border: 1px solid ${borderColor};"></div>`);
        for (let i = 1; i <= daysInMonth; i++) {
            const dayData = data[i] || { revenue: 0, orders: 0 };
            const revStr = `R$ ${dayData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            const ordStr = `${dayData.orders} pedidos`;
            cells.push(`
                <div style="min-height:120px; padding:1.25rem; border: 1px solid ${borderColor}; display: flex; flex-direction: column; justify-content: space-between; position: relative; background: #fff;">
                    <div style="font-size: 1.125rem; font-weight: 800; color: #64748b;">${i}</div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.975rem; font-weight: 800; color: ${dayData.revenue > 0 ? '#1e293b' : '#64748b'};">${revStr}</div>
                        <div style="font-size: 0.845rem; font-weight: 600; color: #94a3b8; margin-top: 2px;">${ordStr}</div>
                    </div>
                </div>
            `);
            if (cells.length === 7) { rows.push(cells); cells = []; }
        }
        if (cells.length > 0) { while (cells.length < 7) cells.push(`<div style="background:${bgOdd}; min-height:120px; padding:1rem; border: 1px solid ${borderColor};"></div>`); rows.push(cells); }

        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Resumo"];
        const headerBg = isDark ? '#121212' : '#f1f0ff';
        const headerText = isDark ? '#AAAAAA' : '#5a57e6';

        return `
            <div style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1.5px solid ${borderColor};">
                <div style="display: grid; grid-template-columns: repeat(8, 1fr); background: ${headerBg}; border-bottom: 1.5px solid ${borderColor};">
                    ${dayNames.map(n => `<div style="padding: 1.25rem; font-size: 0.975rem; font-weight: 800; color:${headerText}; text-align: left;">${n}</div>`).join('')}
                </div>
                ${rows.map((row, rIdx) => {
                    const rowSumRev = row.reduce((acc, c) => {
                        if (c.includes('background:#fbfcfd')) return acc;
                        const match = c.match(/R\$ ([\d,.]+)/);
                        return match ? acc + parseFloat(match[1].replace('.','').replace(',','.')) : acc;
                    }, 0);
                    const rowSumOrd = row.reduce((acc, c) => {
                        if (c.includes('background:#fbfcfd')) return acc;
                        const match = c.match(/(\d+) pedidos/);
                        return match ? acc + parseInt(match[1]) : acc;
                    }, 0);
                    return `
                        <div style="display: grid; grid-template-columns: repeat(8, 1fr);">
                            ${row.join('')}
                            <div style="background: ${bgOdd}; min-height:120px; padding:1.25rem; border: 1.5px solid ${borderColor}; display: flex; flex-direction: column; justify-content: space-between;">
                                <div style="font-size: 1.125rem; font-weight: 800; color: #64748b; display:none;">-</div>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.975rem; font-weight: 950; color: #1e293b;">R$ ${rowSumRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    <div style="font-size: 0.845rem; font-weight: 700; color: #94a3b8; margin-top: 2px;">${rowSumOrd} ped.</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
                <div style="display: grid; grid-template-columns: repeat(8, 1fr); background: ${bgOdd}; font-weight: 800;">
                    ${Array.from({length: 7}).map((_, colIdx) => {
                        let rev = 0, ord = 0;
                        rows.forEach(row => {
                            const c = row[colIdx];
                            if (!c || c.includes('background:#fbfcfd') || c.includes(`background:${bgOdd}`)) return;
                            const mR = c.match(/R\$ ([\d,.]+)/); if (mR) rev += parseFloat(mR[1].replace('.','').replace(',','.'));
                            const mO = c.match(/(\d+) pedidos/); if (mO) ord += parseInt(mO[1]);
                        });
                        return `
                            <div style="padding: 1.25rem; font-size: 0.975rem; color: #1e293b; text-align: right; border: 1px solid ${borderColor};">
                                <div>R$ ${rev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                <div style="font-size: 0.825rem; color: #94a3b8; font-weight: 800;">${ord} ped.</div>
                            </div>
                        `;
                    }).join('')}
                    <div style="padding: 1.25rem; font-size: 1.075rem; font-weight: 950; color: var(--primary); text-align: right; background: ${headerBg}; display: flex; flex-direction: column; justify-content: center; border: 1px solid ${borderColor};">
                        <div>R$ ${Object.values(data).reduce((s, d) => s + (d.revenue || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div style="font-size: 0.875rem; font-weight: 900;">${Object.values(data).reduce((s, d) => s + (d.orders || 0), 0)} pedidos</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * initDashboardCharts
     * Converte state.chartData (arrays paralelos da API) para serieTemporal
     * e renderiza usando o componente DashboardChart com a métrica ativa.
     */
    async function renderHistoricalMonthlyChart() {
        const container = document.getElementById('historicalMonthlyArea');
        if (!container) return;
        
        try {
            const resp = await fetch('/api/admin/historical-monthly-metrics', { 
                headers: { 'Authorization': `Bearer ${state.token}` } 
            });
            
            if (!resp.ok) {
                container.innerHTML = `<div style="padding:4rem; text-align:center; color:#94a3b8; font-weight:700;">Erro ${resp.status}: Falha ao buscar dados históricos.</div>`;
                return;
            }

            const data = await resp.json();
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = `<div style="padding:4rem; text-align:center; color:#94a3b8; font-weight:700;">Nenhum dado histórico encontrado para o período.</div>`;
                return;
            }

            const latest = data[data.length - 1];
            const renderBadge = (v = 0) => {
                const isPos = v >= 0;
                return `<span style="padding: 0.35rem 0.65rem; border-radius: 8px; font-size: 0.875rem; font-weight: 850; background: ${isPos ? '#f0fdf4' : '#fef2f2'}; color: ${isPos ? '#166534' : '#991b1b'}; display: inline-flex; align-items: center; gap: 4px; border: 1px solid ${isPos ? 'rgba(22, 101, 52, 0.1)' : 'rgba(153, 27, 27, 0.1)'};">
                    <i data-lucide="${isPos ? 'trending-up' : 'trending-down'}" style="width:12px; height:12px;"></i>
                    ${isPos ? '+' : ''}${v.toFixed(1)}%
                </span>`;
            };

            container.innerHTML = `
                <div style="display: flex; justify-content: flex-start; align-items: center; margin-bottom: 3rem; flex-wrap: wrap; gap: 2.5rem; background: #f8fafc; padding: 1.5rem; border-radius: 20px; border: 1px solid #f1f5f9;">
                         <div style="min-width: 140px;">
                            <div style="font-size: 0.825rem; font-weight: 850; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.5px;">Último Mês</div>
                            <div style="font-size: 0.975rem; font-weight: 900; color: #64748b; margin-top: -3px;">${latest.label}</div>
                         </div>
                         <div style="min-width: 160px; border-left: 1px solid #e2e8f0; padding-left: 1.5rem;">
                            <div style="font-size: 0.825rem; font-weight: 850; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Faturamento</div>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span style="font-size: 1.275rem; font-weight: 950; color: #1e293b;">R$ ${Number(latest.revenue || 0).toLocaleString('pt-BR')}</span>
                                ${renderBadge(latest.revenueVar || 0)}
                            </div>
                         </div>
                         <div style="min-width: 120px; border-left: 1px solid #e2e8f0; padding-left: 1.5rem;">
                            <div style="font-size: 0.825rem; font-weight: 850; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Vendas</div>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span style="font-size: 1.275rem; font-weight: 950; color: #1e293b;">${latest.orders || 0}</span>
                                ${renderBadge(latest.ordersVar || 0)}
                            </div>
                         </div>
                         <div style="min-width: 160px; border-left: 1px solid #e2e8f0; padding-left: 1.5rem;">
                            <div style="font-size: 0.825rem; font-weight: 850; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Lucro Real</div>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span style="font-size: 1.275rem; font-weight: 950; color: #1e293b;">R$ ${Number(latest.profit || 0).toLocaleString('pt-BR')}</span>
                                ${renderBadge(latest.profitVar || 0)}
                            </div>
                         </div>
                </div>
                <div style="height: 400px;"><canvas id="historicalChartCanvas"></canvas></div>
            `;

            if (window.lucide) lucide.createIcons();

            const ctx = document.getElementById('historicalChartCanvas').getContext('2d');
            new Chart(ctx, {
                data: {
                    labels: data.map(m => m.label),
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Faturamento Bruto',
                            data: data.map(m => m.revenue),
                            backgroundColor: 'rgba(90, 87, 230, 0.85)',
                            hoverBackgroundColor: '#5a57e6',
                            borderRadius: 10,
                            barThickness: 24,
                            yAxisID: 'y'
                        },
                        {
                            type: 'line',
                            label: 'Pedidos',
                            data: data.map(m => m.orders),
                            borderColor: '#ef4444',
                            borderWidth: 4,
                            pointRadius: 5,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#ef4444',
                            pointBorderWidth: 2,
                            tension: 0.4,
                            yAxisID: 'y1'
                        },
                        {
                            type: 'line',
                            label: 'Lucro Real',
                            data: data.map(m => m.profit),
                            borderColor: '#10b981',
                            borderWidth: 4,
                            pointRadius: 5,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#10b981',
                            pointBorderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            yAxisID: 'y'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { 
                            position: 'bottom', 
                            labels: { 
                                boxWidth: 10, 
                                usePointStyle: true, 
                                padding: 25, 
                                font: { weight: '800', size: 12, family: 'Inter' } 
                            } 
                        },
                        tooltip: {
                            backgroundColor: '#fff',
                            titleColor: '#1e293b',
                            bodyColor: '#475569',
                            borderColor: '#e2e8f0',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                label: (ctx) => {
                                    let val = ctx.parsed.y;
                                    if (ctx.dataset.label.includes('Bruto') || ctx.dataset.label.includes('Lucro')) {
                                        return `${ctx.dataset.label}: R$ ${val.toLocaleString('pt-BR')}`;
                                    }
                                    return `${ctx.dataset.label}: ${val} un`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: { 
                            position: 'left', 
                            grid: { color: '#f1f5f9', drawBorder: false }, 
                            ticks: { 
                                color: '#94a3b8', 
                                font: { weight: '700', size: 10 },
                                callback: val => 'R$ ' + (val/1000).toFixed(0) + 'k'
                            } 
                        },
                        y1: { 
                            position: 'right', 
                            grid: { display: false }, 
                            ticks: { 
                                color: '#ef4444', 
                                font: { weight: '800', size: 10 },
                                callback: val => val + ' un'
                            } 
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { weight: '750', size: 10 } }
                        }
                    }
                }
            });

        } catch (e) {
            console.error("Erro ao renderizar gráfico histórico:", e);
            container.innerHTML = `<div style="padding:4rem; text-align:center; color:#94a3b8;">Erro ao carregar dados históricos.</div>`;
        }
    }

    let paymentChartObj = null;
    // Função duplicada removida conforme solicitado para manter independència e conectividade real.
    // Funções de gráficos duplicadas removidas.


    window.setPerformanceTab = async t => { state.performanceTab = t; renderPerformance(); };

    async function updateOrderStatus(id, status, silent = false) {
        try {
            const resp = await fetch('/api/admin/update-order-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
                body: JSON.stringify({ id, status })
            });
            if (resp.ok) {
                await fetchData();
                renderOrders();
            }
        } catch (e) { console.error(e); if (!silent) showToast("Erro ao atualizar!"); }
    }

    window.updateOrderStatus = updateOrderStatus;

    // =========================================================================
    // 🛑 ÁREA PROTEGIDA - NÃO ALTERAR - APROVADO & CONGELADO (GESTÃO DE PEDIDOS)
    // =========================================================================
    window.toggleOrderSelection = function(e, id) {
        if (e) e.stopPropagation();
        if (!window.selectedOrdersIds) window.selectedOrdersIds = [];
        const idx = window.selectedOrdersIds.indexOf(id);
        if (idx === -1) window.selectedOrdersIds.push(id);
        else window.selectedOrdersIds.splice(idx, 1);
        renderOrders();
    };

    window.applyBatchAction = async function() {
        const select = document.getElementById('batch-action-select');
        const btn = document.getElementById('batch-apply-btn');
        const targetStatus = select?.value;
        if (!targetStatus) return;

        // Priorizar seleção manual, se não houver, usa todos da aba
        const idsToUpdate = (window.selectedOrdersIds && window.selectedOrdersIds.length > 0) 
            ? window.selectedOrdersIds 
            : (window.currentFilteredOrdersIds || []);
            
        if (idsToUpdate.length === 0) return alert('Nenhum pedido selecionado.');

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="lucide-refresh-cw" style="width:14px; height:14px; animation: spin 1s linear infinite;"></i>...';
            
            await Promise.all(idsToUpdate.map(id => 
                fetch('/api/admin/update-order-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
                    body: JSON.stringify({ id, status: targetStatus })
                })
            ));

            window.selectedOrdersIds = []; // Limpar seleção após sucesso
            await fetchData();
            renderOrders();
        } catch (err) {
            console.error('Erro no lote:', err);
            alert('Erro ao processar lote.');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = 'Aplicar'; }
            if (select) select.value = "";
        }
    };

    async function renderOrders() {
        try {
            const adminMain = document.getElementById('admin-main');
            const config = state.content['opening_hours'];
            const currentBakeDate = config?.currentBatch?.bakeDate;
            if (!window.selectedOrdersIds) window.selectedOrdersIds = [];

            // Filtro Principal: Apenas pedidos da FORNADA ATUAL (Cycle 1)
            let filtered = (state.pedidos || []).filter(o => {
                let items = o.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch { return false; }
                }
                const orderBakeDate = items?.batch_date;
                return orderBakeDate === currentBakeDate;
            });

            // Filtro por Tab de Status
            const tabsLabels = [
                { id: 'aceito', label: 'Aceitos', class: 'status-paid', btnLabel: 'Iniciar Preparo', btnColor: '#8b5cf6', next: 'preparo' },
                { id: 'preparo', label: 'Em Preparo', class: 'status-preparing', btnLabel: 'Pronto p/ Retirada', btnColor: '#3b82f6', next: 'retirada' },
                { id: 'retirada', label: 'Pronto p/ Retirada', class: 'status-ready', btnLabel: 'Finalizar Pedido', btnColor: '#10b981', next: 'concluido' },
                { id: 'concluido', label: 'Concluídos', class: 'status-completed' },
                { id: 'cancelado', label: 'Cancelados', class: 'status-canceled' }
            ];

            const activeTab = state.ordersTab || 'aceito';
            filtered = filtered.filter(p => {
                const s = (p.status || '').toLowerCase();
                if (activeTab === 'aceito') return ['paid', 'pago', 'aceito', 'accepted'].includes(s);
                if (activeTab === 'preparo') return ['preparo', 'preparing', 'preparando'].includes(s);
                if (activeTab === 'retirada') return ['retirada', 'pronto', 'entrega', 'delivery', 'pronto para retirada'].includes(s);
                if (activeTab === 'concluido') return ['concluido', 'completed', 'finalizado'].includes(s);
                if (activeTab === 'cancelado') return ['cancelado', 'canceled', 'cancelled'].includes(s);
                return s === activeTab;
            });

            if (state.searchQuery) {
                const q = state.searchQuery.toLowerCase();
                filtered = filtered.filter(p => (p.customer_name || p.clientes?.name || '').toLowerCase().includes(q) || String(p.id).toLowerCase().includes(q));
            }

            // Sincronizar IDs para ações em lote
            window.currentFilteredOrdersIds = filtered.map(p => p.id);
            const selectedCount = window.selectedOrdersIds.length;

            const headerDateLabel = config?.currentBatch?.bakeDate ? 
                new Date(config.currentBatch.bakeDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 
                'Fornada Atual';

            adminMain.innerHTML = `
                <style>
                    .order-card-v2 {
                        background: #ffffff;
                        border: 1.5px solid #eef2f6;
                        border-radius: 18px;
                        padding: 1.25rem;
                        display: flex;
                        flex-direction: column;
                        gap: 1.25rem;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
                        position: relative;
                        overflow: hidden;
                        height: 100%;
                    }

                    .order-card-v2:hover {
                        transform: translateY(-5px);
                        border-color: #e0e7ff;
                        box-shadow: 0 12px 20px -5px rgba(90, 87, 230, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.02);
                    }

                    .order-card-v2.active {
                        border-color: var(--primary);
                        background: #fbfbff;
                        box-shadow: 0 0 0 4px rgba(90, 87, 230, 0.1);
                    }

                    .order-card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-bottom: 0.75rem;
                        border-bottom: 1px solid #f8fafc;
                    }

                    .order-number {
                        font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
                        font-size: 0.925rem;
                        font-weight: 800;
                        color: #64748b;
                        background: #f1f5f9;
                        padding: 4px 10px;
                        border-radius: 8px;
                        letter-spacing: 0.5px;
                    }

                    .order-card-body {
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                        flex-grow: 1;
                    }

                    .customer-name-block {
                        font-size: 1.225rem;
                        font-weight: 900;
                        color: #1e293b;
                        letter-spacing: -0.3px;
                        margin-bottom: 0.25rem;
                        display: block;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .order-info-row {
                        display: flex;
                        align-items: center;
                        gap: 0.6rem;
                        color: #64748b;
                        font-size: 0.975rem;
                        font-weight: 600;
                    }

                    .order-info-row i {
                        width: 14px;
                        height: 14px;
                        color: #94a3b8;
                    }

                    .order-card-footer {
                        margin-top: auto;
                        padding-top: 1rem;
                        border-top: 1px solid #f8fafc;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }

                    .total-label {
                        font-size: 0.775rem;
                        font-weight: 800;
                        color: #94a3b8;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 2px;
                    }

                    .order-total-highlight {
                        font-size: 1.375rem;
                        font-weight: 950;
                        color: var(--primary);
                        letter-spacing: -0.5px;
                    }
                    }
                    .status-badge {
                        font-size: 0.775rem !important;
                        padding: 6px 12px !important;
                        border-radius: 10px !important;
                        text-transform: uppercase !important;
                        font-weight: 900 !important;
                    }
                    .total-label {
                        font-size: 0.775rem;
                        font-weight: 800;
                        color: #94a3b8;
                        text-transform: uppercase;
                    }
                </style>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <h2 style="font-size: 1.725rem; font-weight: 950; color: #1e293b; margin:0;">Fila de Produção</h2>
                            <span style="background: #10b981; color: #fff; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.775rem; font-weight: 900; text-transform: uppercase;">Fornada ${headerDateLabel}</span>
                        </div>
                        <p style="font-size: 1.075rem; color: #64748b; font-weight: 600;">Gerencie os pedidos confirmados para a produção deste ciclo.</p>
                    </div>
                    <button onclick="fetchOrders().then(renderOrders)" class="action-btn-dash" style="padding: 0 1.25rem; height: 42px; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; gap: 8px; background: #fff; color: #64748b; font-weight: 700; cursor: pointer;">
                        <i data-lucide="refresh-cw" style="width:16px; height:16px;"></i> Atualizar
                    </button>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
                    <div class="orders-tabs-v2" style="display: flex; gap: 0.5rem; background: #f1f5f9; padding: 0.4rem; border-radius: 12px;">
                        ${tabsLabels.map(t => `
                            <button onclick="window.setOrdersTab('${t.id}')" class="order-tab-btn ${activeTab === t.id ? 'active' : ''}" style="padding: 0.6rem 1.25rem; border: none; border-radius: 8px; font-weight: 800; font-size: 0.975rem; cursor: pointer; transition: 0.2s; ${activeTab === t.id ? 'background: #fff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.05);' : 'background: transparent; color: #64748b;'}">
                                ${t.label}
                            </button>
                        `).join('')}
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <!-- Operação em Lote -->
                        ${selectedCount > 0 ? `<span style="background: var(--primary); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.875rem; font-weight: 900; animation: bounceIn 0.3s ease;">${selectedCount} selecionados</span>` : ''}
                        <div style="display: flex; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 4px; gap: 4px;">
                            <select id="batch-action-select" style="border: none; background: transparent; padding: 6px 10px; font-weight: 750; font-size: 0.925rem; color: #64748b; outline: none; cursor: pointer;">
                                <option value="" disabled selected>Ações em lote...</option>
                                <option value="aceito">Mover p/ Aceitos</option>
                                <option value="preparo">Mover p/ Em Preparo</option>
                                <option value="retirada">Mover p/ Pronto</option>
                                <option value="concluido">Mover p/ Concluídos</option>
                            </select>
                            <button id="batch-apply-btn" onclick="window.applyBatchAction()" style="background: #3b82f6; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; font-weight: 800; font-size: 0.875rem; cursor: pointer; transition: 0.2s;">
                                Aplicar
                            </button>
                        </div>
                        <input type="text" value="${state.searchQuery}" oninput="window.setOrderSearch(this.value)" placeholder="Buscar cliente..." style="border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; font-size:1.025rem; width:220px; font-weight:600; outline:none; transition: 0.3s;" onfocus="this.style.borderColor='var(--primary)';" onblur="this.style.borderColor='#e2e8f0';">
                    </div>
                </div>

                <div class="orders-list-content">
                    ${filtered.length > 0 ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                            ${filtered.map(p => {
                                const isSelected = (window.selectedOrdersIds || []).includes(p.id);
                                const total = p.total_amount || 0;
                                let statConfig = tabsLabels.find(t => {
                                    const s = (p.status || '').toLowerCase();
                                    if (t.id === 'aceito') return ['paid', 'pago', 'aceito', 'accepted'].includes(s);
                                    if (t.id === 'preparo') return ['preparo', 'preparing', 'preparando'].includes(s);
                                    if (t.id === 'retirada') return ['retirada', 'pronto', 'entrega', 'delivery', 'pronto para retirada'].includes(s);
                                    if (t.id === 'concluido') return ['concluido', 'completed', 'finalizado'].includes(s);
                                    if (t.id === 'cancelado') return ['cancelado', 'canceled', 'cancelled'].includes(s);
                                    return s === t.id;
                                }) || tabsLabels[0];

                                return `
                                    <div class="order-card-v2 ${isSelected ? 'active' : ''}" onclick="toggleOrderDetail(event, '${p.id}')">
                                         <div class="order-card-header">
                                             <div style="display: flex; align-items: center; gap: 10px;">
                                                 <div onclick="window.toggleOrderSelection(event, '${p.id}')" style="width: 20px; height: 20px; border: 2px solid ${isSelected ? 'var(--primary)' : '#cbd5e1'}; border-radius: 6px; background: ${isSelected ? 'var(--primary)' : '#fff'}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;">
                                                     ${isSelected ? '<i data-lucide="check" style="width:14px; height:14px; color:#fff;"></i>' : ''}
                                                 </div>
                                                 <span class="order-number">#${String(p.id).slice(0, 5).toUpperCase()}</span>
                                             </div>
                                             <span class="status-badge ${statConfig.class}">${statConfig.label}</span>
                                         </div>
                                         <div class="order-card-body">
                                             <div class="customer-name-block">${p.customer_name || p.clientes?.name || 'Cliente'}</div>
                                             <div class="order-info-row"><i data-lucide="clock"></i><span>${new Date(p.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span></div>
                                             <div class="order-info-row"><i data-lucide="calendar"></i><span>${new Date(p.created_at).toLocaleDateString()}</span></div>
                                         </div>
                                         <div class="order-card-footer">
                                             <div style="flex: 1;">
                                                 <div class="total-label">Total Gasto</div>
                                                 <div class="order-total-highlight">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                             </div>
                                             <div style="display: flex; gap: 8px;">
                                                 ${(() => {
                                                     const s = (p.status || '').toLowerCase();
                                                     let nextS = '', label = '', color = '#5a57e6';
                                                     if (['paid','pago','aceito','accepted'].includes(s)) { nextS = 'preparo'; label = 'Preparar'; }
                                                     else if (['preparo','preparing','preparando'].includes(s)) { nextS = 'retirada'; label = 'Pronto'; }
                                                     else if (['retirada','pronto','entrega','delivery','pronto para retirada'].includes(s)) { nextS = 'concluido'; label = 'Concluir'; color = '#10b981'; }
                                                     if (!nextS) return '';
                                                     return `<button onclick="event.stopPropagation(); this.disabled=true; window.updateOrderStatus('${p.id}', '${nextS}')" style="padding: 0.5rem 1rem; background: ${color}; color: #fff; border: none; border-radius: 10px; font-weight: 800; font-size: 0.875rem; cursor: pointer;">${label}</button>`;
                                                 })()}
                                                 <div style="width: 34px; height: 34px; background: #f8fafc; border: 1px solid #eef2f6; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8;"><i data-lucide="eye" style="width: 16px; height: 16px;"></i></div>
                                             </div>
                                         </div>
                                         <div id="full-detail-${p.id}" style="display:none;">
                                            <div style="padding: 2.5rem; max-width: 600px; margin: 0 auto;">
                                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
                                                    <div style="font-size: 1.525rem; font-weight: 950; color: #1e293b;">#${String(p.id).slice(0,5).toUpperCase()}</div>
                                                    <span style="padding: 0.5rem 1rem; border-radius: 10px; font-weight: 900; font-size: 0.975rem; background: #d1fae5; color: #10b981;">${(p.status === 'paid' ? 'PAGO' : (p.status || 'PAGO')).toUpperCase()}</span>
                                                </div>
                                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
                                                    <div>
                                                        <div class="total-label">Cliente</div>
                                                        <div style="font-weight: 850; color: #1e293b; font-size: 1.225rem;">${p.customer_name || p.clientes?.name || 'Cliente'}</div>
                                                    </div>
                                                    <div>
                                                         <div class="total-label">Pagamento</div>
                                                         <div style="font-weight: 850; color: #1e293b;">${(p.payment_method || 'Cartão').toUpperCase()}</div>
                                                    </div>
                                                    <div>
                                                         <div class="total-label">Tipo de Entrega</div>
                                                         <div style="font-weight: 850; color: #1e293b;">${(() => {
                                                             let itemsRaw = p.items;
                                                             if (typeof itemsRaw === 'string') { try { itemsRaw = JSON.parse(itemsRaw); } catch { itemsRaw = {}; } }
                                                             const bDate = itemsRaw?.batch_date;
                                                             if (bDate) {
                                                                 const d = new Date(bDate + 'T12:00:00');
                                                                 return `Retirada na fornada ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
                                                             }
                                                             return p.scheduled_at ? 'Retirada Agendada' : 'Retirada Imediata';
                                                         })()}</div>
                                                    </div>
                                                    <div>
                                                         <div class="total-label">Data e Hora</div>
                                                         <div style="font-weight: 850; color: #1e293b;">${new Date(p.created_at).toLocaleString('pt-BR')}</div>
                                                    </div>
                                                </div>
                                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; margin-bottom: 2rem;">
                                                    <table style="width:100%; border-collapse: collapse;">
                                                        ${parseItems(p.items).map(i => `
                                                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                                                <td style="padding: 0.75rem 0; font-weight: 900; color: #5a57e6; width: 40px;">${i.qty}x</td>
                                                                <td style="padding: 0.75rem 0; font-weight: 700; color: #1e293b;">${i.name}</td>
                                                                <td style="padding: 0.75rem 0; text-align: right; font-weight: 850; color: #1e293b;">R$ ${Number(i.price * i.qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                            </tr>
                                                        `).join('')}
                                                    </table>
                                                </div>
                                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2.5rem;">
                                                    <div style="font-size: 1.525rem; font-weight: 950; color: #1e293b;">Total</div>
                                                    <div style="font-size: 1.8rem; font-weight: 950; color: #5a57e6;">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                                </div>
                                                <div style="display: flex; gap: 1rem;">
                                                    <a href="https://wa.me/55${(p.clientes?.whatsapp || '').replace(/\D/g, '')}" target="_blank" onclick="event.stopPropagation();" style="flex: 1; padding: 1.1rem; background: #22c55e; color: #fff; border-radius: 12px; font-weight: 800; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 1.025rem;">
                                                        <i data-lucide="message-square" style="width: 18px; height: 18px;"></i> WhatsApp
                                                    </a>
                                                    ${(() => {
                                                        const s = (p.status || '').toLowerCase();
                                                        let nextS = '', label = '', color = '#5a57e6';
                                                        
                                                        if (['paid','pago','aceito','accepted'].includes(s)) { 
                                                            nextS = 'preparo'; label = 'Entrar em Preparo'; 
                                                        } else if (['preparo','preparing','preparando'].includes(s)) { 
                                                            nextS = 'retirada'; label = 'Pronto p/ Retirada'; 
                                                        } else if (['retirada','pronto','entrega','delivery','pronto para retirada'].includes(s)) { 
                                                            nextS = 'concluido'; label = 'Concluir'; color = '#10b981'; 
                                                        }

                                                        if (!nextS) return ''; // Não mostrar botão fechar aqui, apenas WhatsApp
                                                        
                                                        return `<button onclick="window.closeOrderModal(); window.updateOrderStatus('${p.id}', '${nextS}')" style="flex: 1.5; padding: 1.1rem; background: ${color}; color: #fff; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; font-size: 1.025rem; transition: 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">${label}</button>`;
                                                    })()}
                                                </div>
                                                <button onclick="window.closeOrderModal()" style="width:100%; margin-top: 1.25rem; background: transparent; color: #94a3b8; border: none; font-weight: 800; cursor: pointer; font-size: 0.975rem; text-decoration: underline;">Voltar para a Fila</button>
                                            </div>
                                         </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `<div style="text-align:center; padding:5rem; background:#f8fafc; border-radius:24px; color:#94a3b8; font-weight:700;">Nenhum pedido nesta etapa.</div>`}
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        } catch(e) { console.error(e); }
    }

    window.setOrdersTab = t => { state.ordersTab = t; renderOrders(); };

    let currentPopupId = null;
    window.showOrderDetail = (e, id) => {
        if (window.innerWidth < 1024) return;
        const popup = document.getElementById(`detail-pop-${id}`);
        const fullDetail = document.getElementById(`full-detail-${id}`);
        if (!popup || !fullDetail) return;
        currentPopupId = id;
        popup.innerHTML = fullDetail.innerHTML;
        popup.style.display = 'block';
        const rect = e.currentTarget.getBoundingClientRect();
        let left = rect.right + 20;
        if (left + 400 > window.innerWidth) left = rect.left - 420;
        popup.style.position = 'fixed';
        popup.style.left = `${left}px`;
        popup.style.top = `${rect.top}px`;
        if (window.lucide) lucide.createIcons();
    };

    window.hideOrderDetail = () => {
        if (!currentPopupId) return;
        const popup = document.getElementById(`detail-pop-${currentPopupId}`);
        if (popup) popup.style.display = 'none';
        currentPopupId = null;
    };

    window.toggleOrderDetail = (e, id) => {
        e.stopPropagation();
        const fullDetail = document.getElementById(`full-detail-${id}`);
        const modalBody = document.getElementById('modal-body-content');
        const modalOverlay = document.getElementById('order-modal-overlay');
        if (fullDetail && modalBody && modalOverlay) {
            modalBody.innerHTML = fullDetail.innerHTML;
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (window.lucide) lucide.createIcons();
        }
    };

    window.closeOrderModal = () => {
        const modalOverlay = document.getElementById('order-modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            modalOverlay.style.display = '';
            document.body.style.overflow = 'auto';
        }
    };

    window.toggleBulkActions = (e) => {
        e.stopPropagation();
        const menu = document.getElementById('bulk-actions-menu');
        if (menu) menu.classList.toggle('active');
    };

    window.moveAllOrders = async (fromStatus, toStatus) => {
        // Encontrar pedidos que correspondem ao filtro do status de origem
        const targets = state.pedidos?.filter(p => {
            const s = (p.status || '').toLowerCase();
            if (fromStatus === 'aceito') return ['paid', 'pago', 'aceito', 'accepted'].includes(s);
            if (fromStatus === 'preparo') return ['preparo', 'preparing', 'preparando'].includes(s);
            if (fromStatus === 'retirada') return ['retirada', 'pronto', 'entrega', 'delivery', 'pronto para retirada'].includes(s);
            return false;
        }) || [];

        if (targets.length === 0) {
            showToast('Nenhum pedido encontrado para mover.');
            const menu = document.getElementById('bulk-actions-menu');
            if (menu) menu.classList.remove('active');
            return;
        }

        try {
            // Atualizar um por um (ou bulk se a API suportar, mas aqui seguimos o padrão individual pré-existente)
            for (const p of targets) {
                await updateOrderStatus(p.id, toStatus, true); // modo silencioso sem toast individual se possível
            }
            await fetchData();
            renderOrders();
        } catch (err) {
            console.error(err);
            showToast('Erro ao mover pedidos.');
        }

        const menu = document.getElementById('bulk-actions-menu');
        if (menu) menu.classList.remove('active');
    };

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', () => {
        const menu = document.getElementById('bulk-actions-menu');
        if (menu) menu.classList.remove('active');
    });

    window.setOrderSearch = (q) => {
        state.searchQuery = q;
        renderOrders();
    };

    window.setCustomerSearch = (q) => {
        state.customerSearchQuery = q;
        state.customerPage = 1;
        renderCustomers();
    };

    window.toggleFullScreen = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else if (document.exitFullscreen) document.exitFullscreen();
    };

    function getRelativeTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        const now = new Date();
        const diffInMs = now - d;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInMonths = Math.floor(diffInDays / 30);
        const diffInYears = Math.floor(diffInMonths / 12);

        if (diffInYears >= 1) return `${diffInYears} ano${diffInYears > 1 ? 's' : ''}`;
        if (diffInMonths >= 1) return `${diffInMonths} ${diffInMonths > 1 ? 'meses' : 'mês'}`;
        return `${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    }

    window.exportCustomersCSV = () => {
        const headers = ["Nome", "Telefone", "Email", "Total Gasto", "Pedidos"];
        const rows = state.customers.map(c => {
            const total = c.crm_total !== undefined ? c.crm_total : 0;
            const count = c.crm_count !== undefined ? c.crm_count : 0;
            return [c.name, `"${c.whatsapp || ''}"`, c.email || '', total.toFixed(2), count];
        });
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "clientes_tocha.csv");
        link.click();
    };

    window.setCustomerSearch = (q) => { state.customerSearchQuery = q; state.customerPage = 1; renderCustomers(); };
    window.setCustomerSort = (col) => {
        if (state.customerSortCol === col) state.customerSortDir = state.customerSortDir === 'asc' ? 'desc' : 'asc';
        else { state.customerSortCol = col; state.customerSortDir = 'asc'; }
        renderCustomers();
    };
    window.setCustomerFilter = (f) => { state.customerFilter = f; state.customerPage = 1; renderCustomers(); };
    window.setCustomerPageSize = (s) => { state.customerPageSize = parseInt(s); state.customerPage = 1; renderCustomers(); };
    window.setCustomerPage = (p) => { state.customerPage = p; renderCustomers(); };



    window.savePaymentSettings = async () => {
        const btn = document.getElementById('btn-save-payments');
        if (btn) btn.innerHTML = '<i class="spinner-small" style="margin-right: 8px;"></i> Salvando...';
        
        const settings = {
            card: document.getElementById('toggle-card').checked,
            pix: document.getElementById('toggle-pix').checked,
            mp_card: document.getElementById('toggle-mp-card')?.checked || false,
            mp_pix: document.getElementById('toggle-mp-pix')?.checked ?? true
        };
        
        try {
            const resp = await fetch('/api/admin/save-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
                body: JSON.stringify({ key: 'payment_methods', value: settings })
            });
            if (resp.ok) {
                state.content['payment_methods'] = settings;
                showToast("Formas de pagamento atualizadas com sucesso!");
            } else {
                showToast("Erro ao atualizar!");
            }
        } catch (e) {
            console.error(e);
            showToast("Erro de rede.");
        } finally {
            if (btn) btn.innerHTML = 'Salvar Configurações';
        }
    };

    function renderPayments() {
        const settings = state.content['payment_methods'] || { card: true, pix: true };

        adminMain.innerHTML = `
            <style>
                .toggle-switch { position: relative; width: 44px; height: 24px; display: inline-block; }
                .toggle-switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 24px; }
                .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                input:checked + .slider { background-color: #10b981; }
                input:checked + .slider:before { transform: translateX(20px); }
            </style>
            
            <div style="margin-bottom: 2.5rem;">
                <h2 style="font-size: 1.725rem; font-weight: 950; color: #1e293b; margin-bottom: 0.5rem; letter-spacing:-0.5px;">Formas de Pagamento</h2>
                <p style="font-size: 1.075rem; color: #64748b; font-weight: 600;">Habilite ou desabilite os métodos oferecidos aos clientes no Checkout.</p>
            </div>

            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 3rem; max-width: 900px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
                <div style="display: flex; flex-direction: column; gap: 3rem;">
                    
                    <!-- Gateway Geral -->
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 2.5rem; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; position:relative; overflow:hidden;">
                        <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:#635bff;"></div>
                        <div style="display: flex; align-items: center; gap: 2rem;">
                            <div style="width: 72px; height: 72px; background: #635bff; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 8px 30px rgba(99,91,255,0.3);">
                                <i data-lucide="credit-card" style="width:36px; height:36px;"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0; font-weight: 950; font-size: 1.525rem; color: #1e293b; letter-spacing:-0.5px;">Stripe Business</h4>
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-top:0.6rem;">
                                    <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px rgba(16,185,129,0.5);"></div>
                                    <span style="font-size: 0.975rem; color: #10b981; font-weight: 900; text-transform: uppercase; letter-spacing:1px;">Gateway Conectado</span>
                                </div>
                            </div>
                        </div>
                        <button onclick="window.open('https://dashboard.stripe.com/settings/payments', '_blank')" style="padding: 1rem 2rem; background: #f1f5f9; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 1.025rem; font-weight: 900; color: #635bff; cursor: pointer; transition: 0.2s; text-transform:uppercase; letter-spacing:0.5px;" onmouseover="this.style.background='#635bff'; this.style.color='#fff';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#635bff';">Ajustes no Stripe</button>
                    </div>

                    <!-- Lista de Métodos -->
                    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                        <h4 style="font-size: 0.975rem; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.5rem;">Controle de Métodos</h4>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
                            <div style="display: flex; align-items: center; gap: 1.25rem;">
                                <div style="width:44px; height:44px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                                    <i data-lucide="credit-card" style="width:20px; height:20px; color: var(--primary);"></i>
                                </div>
                                <div style="display:flex; flex-direction:column;">
                                   <span style="font-weight: 800; color: #1e293b; font-size: 1.125rem;">Cartões de Crédito & Débito</span>
                                   <span style="font-size: 0.925rem; color: #64748b; font-weight: 500;">Bandeiras Visa, Mastercard, Elo, etc.</span>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="toggle-card" ${settings.card ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
                            <div style="display: flex; align-items: center; gap: 1.25rem;">
                                <div style="width:44px; height:44px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                                    <i data-lucide="qr-code" style="width:20px; height:20px; color: var(--primary);"></i>
                                </div>
                                <div style="display:flex; flex-direction:column;">
                                   <span style="font-weight: 800; color: #1e293b; font-size: 1.125rem;">PIX Instantâneo</span>
                                   <span style="font-size: 0.925rem; color: #64748b; font-weight: 500;">Transferências diretas (Aprovação rápida)</span>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="toggle-pix" ${settings.pix ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div style="padding-top: 1rem; display: flex; justify-content: flex-end;">
                           <button id="btn-save-payments" onclick="window.savePaymentSettings()" style="padding: 0.8rem 2.5rem; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1.075rem; transition: 0.2s;">Salvar Configurações</button>
                        </div>
                    </div>

                    <!-- Mercado Pago -->
                    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 2.5rem; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; position:relative; overflow:hidden;">
                            <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:#009ee3;"></div>
                            <div style="display: flex; align-items: center; gap: 2rem;">
                                <div style="width: 72px; height: 72px; background: #009ee3; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 8px 30px rgba(0,158,227,0.3);">
                                    <i data-lucide="banknote" style="width:36px; height:36px;"></i>
                                </div>
                                <div>
                                    <h4 style="margin: 0; font-weight: 950; font-size: 1.525rem; color: #1e293b; letter-spacing:-0.5px;">Mercado Pago</h4>
                                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-top:0.6rem;">
                                        <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px rgba(16,185,129,0.5);"></div>
                                        <span style="font-size: 0.975rem; color: #10b981; font-weight: 900; text-transform: uppercase; letter-spacing:1px;">Gateway Conectado</span>
                                    </div>
                                </div>
                            </div>
                            <button onclick="window.open('https://www.mercadopago.com.br/developers/panel/credentials', '_blank')" style="padding: 1rem 2rem; background: #f1f5f9; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 1.025rem; font-weight: 900; color: #009ee3; cursor: pointer; transition: 0.2s; text-transform:uppercase; letter-spacing:0.5px;" onmouseover="this.style.background='#009ee3'; this.style.color='#fff';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#009ee3';">Ajustes no MP</button>
                        </div>

                        <h4 style="font-size: 0.975rem; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin: 0.5rem 0;">Métodos Mercado Pago</h4>

                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
                            <div style="display: flex; align-items: center; gap: 1.25rem;">
                                <div style="width:44px; height:44px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                                    <i data-lucide="credit-card" style="width:20px; height:20px; color: #009ee3;"></i>
                                </div>
                                <div style="display:flex; flex-direction:column;">
                                   <span style="font-weight: 800; color: #1e293b; font-size: 1.125rem;">Cartão de Crédito/Débito</span>
                                   <span style="font-size: 0.925rem; color: #64748b; font-weight: 500;">Checkout transparente · Desativa Stripe automaticamente</span>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="toggle-mp-card" ${settings.mp_card ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
                            <div style="display: flex; align-items: center; gap: 1.25rem;">
                                <div style="width:44px; height:44px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                                    <i data-lucide="qr-code" style="width:20px; height:20px; color: #009ee3;"></i>
                                </div>
                                <div style="display:flex; flex-direction:column;">
                                   <span style="font-weight: 800; color: #1e293b; font-size: 1.125rem;">PIX</span>
                                   <span style="font-size: 0.925rem; color: #64748b; font-weight: 500;">QR Code automático via Mercado Pago</span>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="toggle-mp-pix" ${settings.mp_pix !== false ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div style="padding: 1rem 1.25rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; font-size: 0.975rem; color: #0369a1; font-weight: 600; line-height: 1.5;">
                            ℹ️ Cartão MP e Stripe são mutuamente exclusivos — ativar um desativa o outro automaticamente. PIX usa QR Code gerado pelo Mercado Pago.
                        </div>
                    </div>

                    <!-- Aviso de Segurança -->
                    <div style="margin-top: 1rem; padding: 2rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; display: flex; gap: 1.75rem; align-items: flex-start;">
                        <div style="width:48px; height:48px; border-radius:12px; background:rgba(59, 130, 246, 0.1); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                             <i data-lucide="shield-check" style="width:24px; height:24px; color: #3b82f6;"></i>
                        </div>
                        <div>
                            <h5 style="margin: 0 0 0.6rem 0; font-weight: 950; color: #1e293b; font-size: 1.225rem; letter-spacing:-0.3px;">Aplicação Imediata & Segura</h5>
                            <p style="margin: 0; font-size: 1.075rem; color: #64748b; line-height: 1.6; font-weight: 600;">
                                O nosso backend se conecta com o Stripe e injeta os métodos na criação da sessão. Se você desabilitar um método aqui, <b>ele sequer será enviado para o processador de pagamento</b>, tornando qualquer injeção forçada impossível na camada de frontend.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        const _tCard = document.getElementById('toggle-card');
        const _tMpCard = document.getElementById('toggle-mp-card');
        if (_tCard && _tMpCard) {
            _tCard.addEventListener('change', function() { if (this.checked) _tMpCard.checked = false; });
            _tMpCard.addEventListener('change', function() { if (this.checked) _tCard.checked = false; });
        }
    }

    window.setCustomerPriorityFilter = (f) => { state.customerPriorityFilter = f; state.customerPage = 1; renderCustomers(); };

    function renderCustomers() {
        const query = (state.customerSearchQuery || '').toLowerCase();
        let list = (state.customers || []).map(c => {
            // Prioriza dados enriquecidos do backend (CRM Real), fallback para cálculo local reativo
            const count = (c.crm_count !== undefined) ? c.crm_count : (state.pedidos || []).filter(p => p.customer_id === c.id).length;
            const lastDate = (c.crm_last) ? new Date(c.crm_last) : (count > 0 ? new Date(Math.max(...(state.pedidos || []).filter(p => p.customer_id === c.id).map(o => new Date(o.created_at)))) : null);
            const totalSpent = (c.crm_total !== undefined) ? c.crm_total : (state.pedidos || []).filter(p => p.customer_id === c.id).reduce((sum, p) => sum + (p.total_amount || 0), 0);
            
            const firstOrder = count > 0 ? new Date(c.created_at) : new Date(c.created_at);
            
            let pLevel = 'Baixa';
            if (count > 4 || totalSpent > 250) pLevel = 'Alta';
            else if (count >= 2) pLevel = 'Média';

            return {
                ...c,
                orderCount: count,
                lastOrderDate: lastDate,
                firstOrderDate: firstOrder,
                totalSpent: totalSpent,
                priorityLogic: pLevel
            };
        });

        if (query) {
            list = list.filter(c => (c.name || '').toLowerCase().includes(query) || (c.whatsapp || '').includes(query));
        }

        if (state.customerFilter && state.customerFilter !== 'all') {
            const daysLimit = parseInt(state.customerFilter);
            if (!isNaN(daysLimit)) {
                const limitDate = new Date();
                limitDate.setDate(limitDate.getDate() - daysLimit);
                list = list.filter(c => !c.lastOrderDate || c.lastOrderDate <= limitDate);
            }
        }

        if (state.customerPriorityFilter && state.customerPriorityFilter !== 'all') {
            list = list.filter(c => c.priorityLogic === state.customerPriorityFilter);
        }

        const sortCol = state.customerSortCol || 'date';
        const sortDir = state.customerSortDir || 'desc';

        list.sort((a, b) => {
            let valA, valB;
            if (sortCol === 'name') { valA = (a.name || '').toLowerCase(); valB = (b.name || '').toLowerCase(); }
            else if (sortCol === 'phone') { valA = a.whatsapp || ''; valB = b.whatsapp || ''; }
            else if (sortCol === 'firstDate') { valA = a.firstOrderDate || 0; valB = b.firstOrderDate || 0; }
            else if (sortCol === 'date') { valA = a.lastOrderDate || 0; valB = b.lastOrderDate || 0; }
            else if (sortCol === 'count') { valA = a.orderCount || 0; valB = b.orderCount || 0; }

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        const sortArrow = (col) => {
            if (state.customerSortCol === col) {
                return state.customerSortDir === 'asc' ? '<span style="font-size:0.925rem; margin-left:0.3rem; color:#8b5cf6;">&#8593;</span>' : '<span style="font-size:0.925rem; margin-left:0.3rem; color:#8b5cf6;">&#8595;</span>';
            }
            return '<span style="font-size:0.825rem; margin-left:0.3rem; color:#cbd5e1;">&#8597;</span>';
        };

        const totalItems = list.length;
        state.customerPageSize = 20; // FIXADO COMO 20 CONFORME PEDIDO
        const totalPages = Math.ceil(totalItems / state.customerPageSize) || 1;
        if (state.customerPage > totalPages) state.customerPage = totalPages;
        if (state.customerPage < 1) state.customerPage = 1;
        const startIdx = (state.customerPage - 1) * state.customerPageSize;
        const paginated = list.slice(startIdx, startIdx + state.customerPageSize);

        const formatPhoneNice = (p) => {
             if (!p) return '-';
             const c = p.replace(/\D/g, '');
             if (c.length === 11) return `(${c.substring(0,2)}) ${c.substring(2,7)}-${c.substring(7)}`;
             return p;
        };

        const renderPagination = () => {
            let pHtml = `<div style="display: flex; gap: 0.4rem;">`;
            pHtml += `<button ${state.customerPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : `onclick="setCustomerPage(${state.customerPage - 1})"`} style="width:28px; height:28px; background:#fff; border:1px solid #e2e8f0; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#64748b; cursor:${state.customerPage === 1 ? 'not-allowed' : 'pointer'};">&lt;</button>`;
            
            for(let i=1; i<=totalPages; i++) {
                if(i === state.customerPage) {
                    pHtml += `<button style="width:28px; height:28px; background:#f5f3ff; border:1px solid #8b5cf6; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#5a57e6; font-weight:800; font-size:0.925rem;">${i}</button>`;
                } else {
                    pHtml += `<button onclick="setCustomerPage(${i})" style="width:28px; height:28px; background:#fff; border:1px solid #e2e8f0; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#64748b; font-weight:600; font-size:0.925rem; cursor:pointer;">${i}</button>`;
                }
            }

            pHtml += `<button ${state.customerPage === totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : `onclick="setCustomerPage(${state.customerPage + 1})"`} style="width:28px; height:28px; background:#fff; border:1px solid #e2e8f0; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#64748b; cursor:${state.customerPage === totalPages ? 'not-allowed' : 'pointer'};">&gt;</button>`;
            pHtml += `</div>`;
            return pHtml;
        };

        adminMain.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="font-size: 1.625rem; font-weight: 800; color: #1e293b; margin:0;">Clientes</h2>
                <button onclick="exportCustomersCSV()" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border: 1.5px solid #8b5cf6; border-radius: 8px; background: #fff; color: #5a57e6; font-weight: 700; cursor: pointer; font-size: 0.975rem;">
                    <i data-lucide="download" style="width:16px; height:16px;"></i> Exportar Clientes
                </button>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem; flex: 1; max-width: 400px;">
                    <div style="position: relative; width: 100%;">
                        <i data-lucide="search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8;"></i>
                        <input id="customerSearchInput" type="text" oninput="setCustomerSearch(this.value)" value="${state.customerSearchQuery || ''}" placeholder="Busque por nome ou telefone" style="width: 100%; padding: 0.6rem 1rem 0.6rem 2.5rem; border: 1.5px solid #e2e8f0; border-radius: 6px; font-size: 0.975rem; outline: none;">
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 2rem;">
                    <div style="text-align: left; line-height:1.2;">
                        <div style="font-size: 0.825rem; color: #64748b; font-weight: 800;">Total de clientes</div>
                        <div style="font-size: 1.125rem; font-weight: 800; color: #1e293b;">${totalItems}</div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.925rem; font-weight: 700; color: #1e293b;">Filtrar clientes:</span>
                        <select onchange="setCustomerFilter(this.value)" style="padding: 0.5rem 1rem 0.5rem 0.5rem; border: 1.5px solid #e2e8f0; border-radius: 6px; font-weight: 600; color: #475569; outline: none; background: #fff; font-size:0.975rem; cursor: pointer;">
                            <option value="all" ${state.customerFilter==='all'?'selected':''}>Todos os clientes</option>
                            <option value="7" ${state.customerFilter==='7'?'selected':''}>Não pedem há 7 dias ou mais</option>
                            <option value="15" ${state.customerFilter==='15'?'selected':''}>Não pedem há 15 dias ou mais</option>
                            <option value="30" ${state.customerFilter==='30'?'selected':''}>Não pedem há 30 dias ou mais</option>
                            <option value="45" ${state.customerFilter==='45'?'selected':''}>Não pedem há 45 dias ou mais</option>
                            <option value="60" ${state.customerFilter==='60'?'selected':''}>Não pedem há 60 dias ou mais</option>
                        </select>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.925rem; font-weight: 700; color: #1e293b;">Prioridade:</span>
                        <select onchange="window.setCustomerPriorityFilter(this.value)" style="padding: 0.5rem 1rem 0.5rem 0.5rem; border: 1.5px solid #e2e8f0; border-radius: 6px; font-weight: 600; color: #475569; outline: none; background: #fff; font-size:0.975rem; cursor: pointer;">
                            <option value="all" ${(!state.customerPriorityFilter || state.customerPriorityFilter==='all')?'selected':''}>Todas as prioridades</option>
                            <option value="Alta" ${state.customerPriorityFilter==='Alta'?'selected':''}>Alta</option>
                            <option value="Média" ${state.customerPriorityFilter==='Média'?'selected':''}>Média</option>
                            <option value="Baixa" ${state.customerPriorityFilter==='Baixa'?'selected':''}>Baixa</option>
                        </select>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.925rem; font-weight: 700; color: #1e293b;">Visualizar:</span>
                        <select disabled style="padding: 0.5rem 1rem 0.5rem 0.5rem; border: 1.5px solid #e2e8f0; border-radius: 6px; font-weight: 600; color: #475569; outline: none; background: #f8fafc; font-size:0.975rem; opacity:0.8; cursor:not-allowed;">
                            <option>20 clientes</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style="background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; min-width: 1050px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #f1f5f9; text-align: left;">
                            <th onclick="window.setCustomerSort('name')" style="padding: 1.25rem 1.5rem; font-size: 0.975rem; font-weight: 700; color: #475569; text-transform: none; cursor: pointer; user-select: none;">Nome ${sortArrow('name')}</th>
                            <th onclick="window.setCustomerSort('phone')" style="padding: 1.25rem 1.5rem; font-size: 0.975rem; font-weight: 700; color: #475569; text-transform: none; cursor: pointer; user-select: none;">Telefone ${sortArrow('phone')}</th>
                            <th onclick="window.setCustomerSort('firstDate')" style="padding: 1.25rem 1.5rem; font-size: 0.975rem; font-weight: 700; color: #475569; text-transform: none; cursor: pointer; user-select: none;">Cliente há ${sortArrow('firstDate')}</th>
                            <th onclick="window.setCustomerSort('date')" style="padding: 1.25rem 1.5rem; font-size: 0.975rem; font-weight: 700; color: #475569; text-transform: none; cursor: pointer; user-select: none;">Último pedido ${sortArrow('date')}</th>
                            <th onclick="window.setCustomerSort('count')" style="padding: 1.25rem 1.5rem; font-size: 0.975rem; font-weight: 700; color: #475569; text-transform: none; text-align: center; cursor: pointer; user-select: none;">Quant. pedidos ${sortArrow('count')}</th>
                            <th style="padding: 1.25rem 1.5rem;"></th>
                            <th style="padding: 1.25rem 1.5rem;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paginated.map(c => `
                            <tr style="border-bottom: 1px solid #f8fafc; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 1.25rem 1.5rem;">
                                    <div style="font-weight: 800; color: #1e293b; font-size: 1.025rem; cursor: pointer; display: inline-block; transition:0.2s;" onmouseover="this.style.color='#5a57e6'" onmouseout="this.style.color='#1e293b'" onclick="viewCustomerDetails('${c.id}')">${c.name}</div>
                                    <div style="font-size: 0.875rem; color: #94a3b8; font-weight: 600; margin-top: 0.15rem;">${c.email || 'Sem e-mail'}</div>
                                </td>
                                <td style="padding: 1.25rem 1.5rem; font-weight: 600; color: #475569; font-size: 0.975rem;">${formatPhoneNice(c.whatsapp)}</td>
                                <td style="padding: 1.25rem 1.5rem; color: #64748b; font-size: 0.975rem; font-weight: 600;">${getRelativeTime(c.firstOrderDate)}</td>
                                <td style="padding: 1.25rem 1.5rem; color: #64748b; font-size: 0.975rem; font-weight: 600;">${getRelativeTime(c.lastOrderDate)}</td>
                                <td style="padding: 1.25rem 1.5rem; font-weight: 800; color: #64748b; text-align: center; font-size: 0.975rem;">${c.orderCount}</td>
                                <td style="padding: 1.25rem 0.5rem; text-align: right; width: 110px;">
                                    <button onclick="viewCustomerDetails('${c.id}')" style="padding: 0.45rem 0.85rem; border: 1.5px solid #e2e8f0; border-radius: 6px; background: #fff; font-size: 0.875rem; font-weight: 700; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition:0.2s;" onmouseover="this.style.borderColor='#cbd5e1'" onmouseout="this.style.borderColor='#e2e8f0'">
                                        <i data-lucide="plus" style="width:14px; height:14px;"></i> Detalhes
                                    </button>
                                </td>
                                <td style="padding: 1.25rem 1.5rem 1.25rem 0.5rem; text-align: left; width: 130px;">
                                    <button onclick="window.open('https://wa.me/55${(c.whatsapp||'').replace(/\\D/g, '')}', '_blank')" style="padding: 0.45rem 0.85rem; border: 1.5px solid #e9d5ff; border-radius: 6px; background: #fff; font-size: 0.875rem; font-weight: 800; color: #7e22ce; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition:0.2s;" onmouseover="this.style.background='#faf5ff'" onmouseout="this.style.background='#fff'">
                                        <i data-lucide="message-circle" style="width:14px; height:14px;"></i> Mensagem
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${paginated.length === 0 ? '<div style="padding:4rem; text-align:center; color:#94a3b8; font-weight:700; font-size:1.075rem;">Nenhum cliente encontrado com os filtros atuais.</div>' : ''}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;">
                <div style="font-size: 0.875rem; color: #64748b; font-weight: 600;">
                    Exibindo ${totalItems === 0 ? 0 : startIdx + 1}-${Math.min(startIdx + state.customerPageSize, totalItems)} de ${totalItems} Clientes
                </div>
                ${totalItems > 0 ? renderPagination() : ''}
            </div>
        `;

        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            const input = document.getElementById('customerSearchInput');
            if (input && state.customerSearchQuery) {
                input.focus();
                const len = input.value.length;
                input.setSelectionRange(len, len);
            }
        }, 0);
    }

    window.viewCustomerDetails = async (id) => {
        const modalOverlay = document.getElementById('order-modal-overlay');
        const modalBody = document.getElementById('modal-body-content');
        
        if (!modalOverlay || !modalBody) return;

        // Mostrar loading no modal
        modalBody.innerHTML = `<div style="padding: 4rem; text-align: center; color: #94a3b8;"><div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #5a57e6; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>Carregando histórico...</div>`;
        modalOverlay.classList.add('active');
        
        try {
            const resp = await fetch(`/api/admin/customer-details/${id}`, {
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            
            const data = await resp.json();
            
            if (!resp.ok) {
                throw new Error(data.error || "Erro ao carregar detalhes");
            }
            
            const { customer, orders, summary } = data;
            
            modalBody.innerHTML = `
                <div style="margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <div style="width: 64px; height: 64px; background: #eef2ff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="user" style="width: 32px; height: 32px; color: #5a57e6;"></i>
                        </div>
                        <div>
                            <h2 style="font-size: 1.525rem; font-weight: 900; color: #1e293b; margin: 0;">${customer.name}</h2>
                            <p style="font-size: 1.025rem; color: #64748b; font-weight: 600; margin-top: 0.25rem;">${formatPhone(customer.whatsapp)} • ${customer.email || 'Sem e-mail'}</p>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: #f8fafc; padding: 1.25rem; border-radius: 12px; border: 1.5px solid #f1f5f9;">
                        <div style="font-size: 0.825rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Total de Pedidos</div>
                        <div style="font-size: 1.525rem; font-weight: 900; color: #1e293b;">${summary.totalOrders}</div>
                    </div>
                    <div style="background: #eff6ff; padding: 1.25rem; border-radius: 12px; border: 1.5px solid #dbeafe;">
                        <div style="font-size: 0.825rem; font-weight: 800; color: #3b82f6; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Total Investido</div>
                        <div style="font-size: 1.525rem; font-weight: 900; color: #1e3a8a;">R$ ${summary.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>

                <div>
                    <h3 style="font-size: 0.975rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; letter-spacing: 0.5px;">
                        Histórico Cronológico
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 400px; overflow-y: auto; padding-right: 0.5rem;">
                        ${orders.length === 0 ? '<p style="color: #94a3b8; font-size: 1.025rem; text-align: center; padding: 2rem;">Este cliente ainda não realizou pedidos.</p>' : ''}
                        ${orders.map(o => {
                            let items = [];
                            try { 
                                items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); 
                            } catch(e) {
                                console.error('Error parsing items:', e);
                                items = [];
                            }
                            
                            // Garantia total: se não for array, transforma em array ou esvazia
                            if (!Array.isArray(items)) {
                                if (items && typeof items === 'object') {
                                    items = Object.values(items); // Tenta converter objeto em array de valores
                                } else {
                                    items = [];
                                }
                            }

                            const itemsList = items.length > 0 
                                ? items.map(i => `${i.qty || 0}x ${i.name || 'Item'}`).join(', ')
                                : 'Nenhum item encontrado';

                            const statusColor = o.status === 'paid' || o.status === 'pago' || o.status === 'concluído' ? '#10b981' : '#f59e0b';

                            return `
                                <div style="padding: 1.25rem; border: 1.5px solid #f1f5f9; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                                    <div style="flex: 1; padding-right: 1.5rem;">
                                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                                            <span style="font-weight: 900; color: #1e293b; font-size: 1.075rem;">Pedido #${String(o.id).slice(0, 5).toUpperCase()}</span>
                                            <span style="font-size: 0.775rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; background: ${statusColor}15; color: ${statusColor}; text-transform: uppercase;">${o.status}</span>
                                        </div>
                                        <div style="font-size: 0.925rem; color: #64748b; margin-top: 0.35rem; font-weight: 500; line-height: 1.4;">${itemsList}</div>
                                        <div style="font-size: 0.825rem; color: #94a3b8; margin-top: 0.5rem; font-weight: 600;">${new Date(o.created_at).toLocaleDateString('pt-BR')} às ${new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    <div style="text-align: right; min-width: 100px;">
                                        <div style="font-weight: 900; color: #1e293b; font-size: 1.125rem;">R$ ${(o.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            
            if (window.lucide) lucide.createIcons();
        } catch (err) {
            console.error(err);
            modalBody.innerHTML = `<div style="padding: 4rem; text-align: center; color: #ef4444; font-weight: 700;">Erro ao carregar detalhes.<br><span style="font-size:0.825rem; font-weight:500; opacity:0.7;">${err.message}</span></div>`;
        }
    };

    let autoUpdateInterval = null;

    function renderOpeningHours() {
        const config = state.content['opening_hours'] || { 
            manualBlock: false, 
            currentBatch: { start: '', end: '', bakeDate: '' },
            nextBatch: { start: '', end: '', bakeDate: '' }
        };
        
        // Limpa intervalo anterior se existir
        if (autoUpdateInterval) clearInterval(autoUpdateInterval);
        
        adminMain.innerHTML = `
            <div style="margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h2 style="font-size: 1.725rem; font-weight: 950; color: #1e293b; margin-bottom: 0.5rem; letter-spacing:-0.5px;">Ciclos de Venda</h2>
                    <p style="font-size: 1.075rem; color: #64748b; font-weight: 600;">Gerencia janelas de pedidos e datas de produção.</p>
                </div>
            </div>

            <!-- BLOCO 1: STATUS MANUAL -->
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 48px; height: 48px; border-radius: 14px; background: ${config.manualBlock ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; display: flex; align-items: center; justify-content: center; color: ${config.manualBlock ? '#ef4444' : '#10b981'};">
                        <i data-lucide="${config.manualBlock ? 'lock' : 'unlock'}"></i>
                    </div>
                    <div>
                        <div style="font-weight: 900; color: #1e293b; font-size: 1.125rem;">${config.manualBlock ? 'Pausado Manualmente' : 'Operação Automática'}</div>
                        <p style="font-size: 0.925rem; color: #64748b; font-weight: 500;">O fechamento manual ignora as janelas abaixo.</p>
                    </div>
                </div>
                <button onclick="updateStoreConfig('manualBlock', !${config.manualBlock})" style="padding: 0.75rem 1.5rem; background: ${config.manualBlock ? '#10b981' : '#ef4444'}; color: #fff; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s;">
                    ${config.manualBlock ? 'Retomar Vendas' : 'Pausar Vendas'}
                </button>
            </div>

            <!-- BLOCO 2: JANELAS DE CICLO -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <!-- CICLO 1: FORNADA ATUAL -->
                <div style="background: #fff; border: 2px solid var(--primary); border-radius: 24px; padding: 2rem; box-shadow: 0 10px 25px rgba(90, 87, 230, 0.05);">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                        <span style="background: var(--primary); color: #fff; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.775rem; font-weight: 900; text-transform: uppercase;">Ciclo 1</span>
                        <h3 style="font-size: 1.125rem; font-weight: 900; color: #1e293b;">Fornada Atual</h3>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">Data da Produção (Exibida ao cliente)</label>
                            <input type="date" value="${config.currentBatch?.bakeDate || ''}" onchange="updateBatchField('currentBatch', 'bakeDate', this.value)" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 12px; font-weight: 700; outline: none;">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.875rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">Início da Janela</label>
                                <input type="datetime-local" value="${config.currentBatch?.start || ''}" onchange="updateBatchField('currentBatch', 'start', this.value)" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 12px; font-weight: 700; outline: none; font-size: 0.925rem;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.875rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">Fim da Janela</label>
                                <input type="datetime-local" value="${config.currentBatch?.end || ''}" onchange="updateBatchField('currentBatch', 'end', this.value)" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 12px; font-weight: 700; outline: none; font-size: 0.925rem;">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CICLO 2: PRÓXIMA FORNADA -->
                <div style="background: #fff; border: 1.5px solid #e2e8f0; border-radius: 24px; padding: 2rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                        <span style="background: #94a3b8; color: #fff; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.775rem; font-weight: 900; text-transform: uppercase;">Ciclo 2</span>
                        <h3 style="font-size: 1.125rem; font-weight: 900; color: #1e293b;">Próxima Fornada</h3>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                        <div>
                            <label style="display: block; font-size: 0.875rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">Data da Produção (Exibida ao cliente)</label>
                            <input type="date" value="${config.nextBatch?.bakeDate || ''}" onchange="updateBatchField('nextBatch', 'bakeDate', this.value)" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 12px; font-weight: 700; outline: none;">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.875rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">Início da Janela</label>
                                <input type="datetime-local" value="${config.nextBatch?.start || ''}" onchange="updateBatchField('nextBatch', 'start', this.value)" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 12px; font-weight: 700; outline: none; font-size: 0.925rem;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.875rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">Fim da Janela</label>
                                <input type="datetime-local" value="${config.nextBatch?.end || ''}" onchange="updateBatchField('nextBatch', 'end', this.value)" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 12px; font-weight: 700; outline: none; font-size: 0.925rem;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- BLOCO 3: SIMULADOR DE STATUS -->
            <div id="opening-simulator-container"></div>

            <div style="margin-top: 3rem; padding: 2.5rem 0; border-top: 1.5px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 1.25rem;">
                <button onclick="renderSection('dashboard')" style="padding: 1rem 2.5rem; background: #fff; color: #64748b; border: 1.5px solid #e2e8f0; border-radius: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 1.025rem;">Cancelar</button>
                <button onclick="saveOpeningHours()" style="padding: 1.1rem 4rem; background: var(--primary); color: #fff; border: none; border-radius: 14px; font-weight: 900; cursor: pointer; box-shadow: 0 8px 24px rgba(90, 87, 230, 0.3); transition: 0.2s; font-size: 1.075rem; text-transform: uppercase; letter-spacing: 0.5px;">Salvar Alterações</button>
            </div>
        `;

        renderOpeningSimulator();
        autoUpdateInterval = setInterval(renderOpeningSimulator, 30000); // Atualiza a cada 30s
        if (window.lucide) lucide.createIcons();
    }

    // --- MOTOR DE CÁLCULO LOCAL (SINCRONIZADO 1:1 COM BACKEND/CLIENTE) ---
    function calculateLocalStatus(cfg) {
        if (!cfg) return { statusMode: 'closed', message: 'Carregando...', countdown: null };
        
        // 1. Prioridade Máxima: Manual
        if (cfg.manualBlock) {
            return { statusMode: 'closed', message: 'Loja temporariamente fechada', countdown: null };
        }

        // 2. Horário de Brasília (BRT) consistente
        const now = new Date();
        const brOffset = -3;
        const brTime = new Date(now.getTime() + (now.getTimezoneOffset() + (brOffset * 60)) * 60000);
        const nowMs = brTime.getTime();

        const parseDate = (d) => {
            if (!d) return null;
            // Se for apenas data sem hora, adiciona T00:00 para garantir parsing local do início do dia
            const str = (d.length === 10) ? d + 'T00:00:00' : d;
            return new Date(str).getTime();
        };
        
        const formatCountdown = (ms) => {
            const totalSeconds = Math.floor(ms / 1000);
            const ds = Math.floor(totalSeconds / 86400);
            const hrs = Math.floor((totalSeconds % 86400) / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            let p = [];
            if (ds > 0) p.push(`${ds}d`);
            if (hrs > 0) p.push(`${hrs}h`);
            if (mins > 0) p.push(`${mins}min`);
            return p.length === 0 ? "1min" : p.join(' ');
        };

        const cStart = parseDate(cfg.currentBatch?.start);
        const cEnd   = parseDate(cfg.currentBatch?.end);
        const nStart = parseDate(cfg.nextBatch?.start);
        const nEnd   = parseDate(cfg.nextBatch?.end);

        // Ciclo 1 Ativo?
        if (cStart && cEnd && nowMs >= cStart && nowMs <= cEnd) {
            const countdown = formatCountdown(cEnd - nowMs);
            const dateStr = cfg.currentBatch.bakeDate;
            const d = new Date(dateStr + 'T12:00:00');
            const weekDay = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][d.getDay()];
            const simpleDate = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
            
            return { 
                statusMode: 'open', 
                message: `Pedidos abertos para est${weekDay.endsWith('o')?'e':'a'} ${weekDay} — ${simpleDate} — Encerra em ${countdown}`, 
                countdown: countdown 
            };
        }

        // Ciclo 2 Ativo?
        if (nStart && nEnd && nowMs >= nStart && nowMs <= nEnd) {
            const dateStr = cfg.nextBatch.bakeDate;
            const d = new Date(dateStr + 'T12:00:00');
            const weekDay = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][d.getDay()];
            const simpleDate = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
            return { 
                statusMode: 'next_batch', 
                message: `Encomendas abertas para o próximo ${weekDay} — ${simpleDate}`, 
                countdown: null 
            };
        }

        return { statusMode: 'closed', message: 'Loja temporariamente fechada', countdown: null };
    }

    function syncHeaderStatus() {
        // Função agora limitada a atualizar componentes secundários (como o simulador).
        // O status GLOBAL (header) é controlado exclusivamente por syncStoreStatus.
        if (document.getElementById('opening-simulator-container')) {
            renderOpeningSimulator();
        }
    }

    window.updateStoreManualStatus = async (isBlocked) => {
        if (!state.content['opening_hours']) {
            state.content['opening_hours'] = { manualBlock: false, currentBatch: {}, nextBatch: {} };
        }
        
        state.content['opening_hours'].manualBlock = isBlocked;

        try {
            // Estado neutro imediato para feedback tátil
            state.storeStatusMode = 'updating';
            updateStoreUI();
            
            // Persistência Centralizada
            const success = await saveOpeningHours(false); // Silent save
            
            if (success) {
                showToast(isBlocked ? 'Loja FECHADA com sucesso!' : 'Loja ABERTA com sucesso!', 'success');
                // syncStoreStatus já é chamado dentro de saveOpeningHours, 
                // mas garantimos aqui para sincronia definitiva da ÚNICA FONTE DE VERDADE.
                await syncStoreStatus(); 
            }
            
            const dropdown = document.getElementById('store-dropdown');
            if (dropdown) dropdown.classList.remove('active');
            
        } catch (e) {
            console.error(e);
            state.storeStatusMode = 'closed';
            updateStoreUI();
            showToast('Erro ao atualizar status da loja.', 'error');
        }
    };

    function setupGlobalEvents() {
        const trigger = document.getElementById('store-status-trigger');
        const dropdown = document.getElementById('store-dropdown');

        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('profile-menu')?.classList.remove('active');
                dropdown.classList.toggle('active');
            });
            document.addEventListener('click', () => dropdown.classList.remove('active'));
        }
    }

    function renderOpeningSimulator() {
        const config = state.content['opening_hours'];
        const container = document.getElementById('opening-simulator-container');
        if (!config) return;

        const status = calculateLocalStatus(config);

        if (!container) return;

        container.innerHTML = `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; display: flex; align-items: center; gap: 2rem;">
                <div style="flex-shrink: 0; background: #fff; padding: 1rem; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${status.statusMode === 'open' ? '#10b981' : status.statusMode === 'next_batch' ? '#f59e0b' : '#ef4444'};"></div>
                    <div>
                        <div style="font-size: 0.775rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Status Calculado</div>
                        <div style="font-size: 1.025rem; font-weight: 950; color: #1e293b;">${status.statusMode === 'open' ? 'Fornada Atual' : status.statusMode === 'next_batch' ? 'Próxima Fornada' : 'Fechada'}</div>
                    </div>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 0.775rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 0.2rem;">Comunicação para o Cliente</div>
                    <div style="font-size: 1.075rem; font-weight: 950; color: var(--primary);">${status.message}</div>
                </div>
            </div>
        `;
    }


    window.setOpeningMode = null; // Removido por conflito
    window.updateSchedule = null; // Removido por conflito
    window.addScheduleRow = null; // Removido por conflito
    window.removeScheduleRow = null; // Removido por conflito

    window.saveOpeningHours = async (showSuccessToast = true) => {
        if (!state.token) return false;
        
        console.log(">>> [ADMIN] Iniciando persistência de opening_hours...", state.content['opening_hours']);
        
        try {
            const resp = await fetch('/api/admin/save-content', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${state.token}` 
                },
                body: JSON.stringify({ key: 'opening_hours', value: state.content['opening_hours'] })
            });

            const data = await resp.json();
            if (resp.ok && data.success) {
                console.log(">>> [ADMIN] Salvo com sucesso!");
                if (showSuccessToast) showToast("Configurações salvas com sucesso!");
                await syncStoreStatus(); // Sincroniza o topo após salvar
                return true;
            } else {
                throw new Error(data.error || "Falha na resposta do servidor.");
            }
        } catch (e) { 
            console.error(">>> [ADMIN] Falha crítica no salvamento:", e);
            showToast("Erro ao salvar! Verifique sua conexão."); 
            return false;
        }
    };
    
    window.updateStoreConfig = (field, val) => {
        if (!state.content['opening_hours']) {
            state.content['opening_hours'] = { manualBlock: false, currentBatch: {}, nextBatch: {} };
        }
        state.content['opening_hours'][field] = val;
        
        // Estado neutro imediato no badge
        state.storeStatusMode = 'updating';
        updateStoreUI();

        // Atualiza UI da seção imediatamente
        renderOpeningHours();
        
        // Persiste no banco e sincroniza com o servidor (Fonte de Verdade)
        saveOpeningHours();
    };

    window.updateBatchField = (batch, field, val) => {
        // Garantia de inicialização do estado
        if (!state.content['opening_hours']) {
            state.content['opening_hours'] = { manualBlock: false, currentBatch: {}, nextBatch: {} };
        }
        const config = state.content['opening_hours'];
        if (!config[batch]) config[batch] = {};
        
        // Normalização preventiva: se o valor inserido tiver :59, corrige para :00
        let cleanVal = val;
        if (field === 'end' && typeof val === 'string' && val.includes(':59')) {
            cleanVal = val.replace(':59', ':00');
        }
        
        config[batch][field] = cleanVal;

        // --- SINCRONIZAÇÃO OBRIGATÓRIA ENTRE CICLOS ---
        const pad = (n) => String(n).padStart(2, '0');
        const shift7Days = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
            d.setDate(d.getDate() + 7);
            const yyyy = d.getFullYear();
            const mm = pad(d.getMonth() + 1);
            const dd = pad(d.getDate());
            if (dateStr.includes('T')) {
                const hh = pad(d.getHours());
                const min = pad(d.getMinutes());
                return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
            }
            return `${yyyy}-${mm}-${dd}`;
        };

        // Recálculo Reativo se houver mudança na BakeDate do Ciclo 1
        if (batch === 'currentBatch' && field === 'bakeDate' && val) {
            // Mantém horários atuais se existirem, senão usa padrões
            const startHour = config.currentBatch.start ? (config.currentBatch.start.split('T')[1] || "00:01") : "00:01";
            const endHour   = config.currentBatch.end   ? (config.currentBatch.end.split('T')[1]   || "16:00") : "16:00";
            
            // Recalcula janelas do Ciclo 1 com base na nova produção (-9 e -2 dias)
            const d1 = new Date(val + 'T12:00:00');
            const dStart = new Date(d1); dStart.setDate(d1.getDate() - 9);
            const dEnd   = new Date(d1); dEnd.setDate(d1.getDate() - 2);
            
            config.currentBatch.start = `${dStart.getFullYear()}-${pad(dStart.getMonth()+1)}-${pad(dStart.getDate())}T${startHour}`;
            config.currentBatch.end   = `${dEnd.getFullYear()}-${pad(dEnd.getMonth()+1)}-${pad(dEnd.getDate())}T${endHour}`;
        }

        // SEMPRE sincroniza o Ciclo 2 para ser Ciclo 1 + 7 dias em todos os campos
        if (batch === 'currentBatch') {
            config.nextBatch = {
                bakeDate: shift7Days(config.currentBatch.bakeDate),
                start:    shift7Days(config.currentBatch.start),
                end:      shift7Days(config.currentBatch.end)
            };
        }

        // Sincronização UI
        renderOpeningHours();
        renderOpeningSimulator();
        
        // Badge fica em modo 'updating' até o servidor confirmar
        state.storeStatusMode = 'updating';
        updateStoreUI();
        
        saveOpeningHours(false); 
    };


    // =========================================================================
    // PRÉ-VENDA (STEP 2)
    // =========================================================================
    // ==========================================
    // SEÇÃO PRÉ-VENDA (FILA FUTURA)
    // ==========================================
    async function renderPreVenda() {
        const adminMain = document.getElementById('admin-main');
        adminMain.innerHTML = `<div style="padding: 4rem; text-align: center; color: #94a3b8;"><div class="spinner-small" style="margin-bottom: 1rem;"></div>Carregando Pré-venda...</div>`;
        
        try {
            const config = state.content['opening_hours'];
            const nextBakeDate = config?.nextBatch?.bakeDate;
            
            // Busca pedidos específicos de Pré-venda
            const resp = await fetch('/api/admin/pre-orders', { headers: { 'Authorization': `Bearer ${state.token}` } });
            const preOrders = await resp.json();
            
            // Filtro: apenas pedidos onde batch_date === nextBakeDate
            const filtered = preOrders.filter(o => {
                let items = o.items;
                if (typeof items === 'string') { try { items = JSON.parse(items); } catch { return false; } }
                return items?.batch_date === nextBakeDate;
            });

            // Cálculos para cards
            const totalOrders = filtered.length;
            let totalItems = 0;
            let totalRevenue = 0;
            const productionSummary = {};

            filtered.forEach(o => {
                totalRevenue += Number(o.total_amount || 0);
                let items = o.items;
                if (typeof items === 'string') try { items = JSON.parse(items); } catch {}
                const actualItems = Array.isArray(items) ? items : (items?.actual_items || []);
                
                actualItems.forEach(i => {
                    const qty = Number(i.qty || i.quantity || 0);
                    totalItems += qty;
                    if (!productionSummary[i.name]) productionSummary[i.name] = 0;
                    productionSummary[i.name] += qty;
                });
            });

            const dateLabel = nextBakeDate ? new Date(nextBakeDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '--';

            adminMain.innerHTML = `
                <style>
                    .order-card-v2 {
                        background: #ffffff;
                        border: 1.5px solid #eef2f6;
                        border-radius: 18px;
                        padding: 1.25rem;
                        display: flex;
                        flex-direction: column;
                        gap: 1.25rem;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
                        position: relative;
                        overflow: hidden;
                        height: 100%;
                        cursor: pointer;
                    }

                    .order-card-v2:hover {
                        transform: translateY(-5px);
                        border-color: #e0e7ff;
                        box-shadow: 0 12px 20px -5px rgba(90, 87, 230, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.02);
                    }

                    .order-card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-bottom: 0.75rem;
                        border-bottom: 1px solid #f8fafc;
                    }

                    .order-number {
                        font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
                        font-size: 0.925rem;
                        font-weight: 800;
                        color: #64748b;
                        background: #f1f5f9;
                        padding: 4px 10px;
                        border-radius: 8px;
                        letter-spacing: 0.5px;
                    }

                    .order-card-body {
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                        flex-grow: 1;
                    }

                    .customer-name-block {
                        font-size: 1.225rem;
                        font-weight: 900;
                        color: #1e293b;
                        letter-spacing: -0.3px;
                        margin-bottom: 0.25rem;
                        display: block;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .order-info-row {
                        display: flex;
                        align-items: center;
                        gap: 0.6rem;
                        color: #64748b;
                        font-size: 0.975rem;
                        font-weight: 600;
                    }

                    .order-info-row i {
                        width: 14px;
                        height: 14px;
                        color: #94a3b8;
                    }

                    .order-card-footer {
                        margin-top: auto;
                        padding-top: 1rem;
                        border-top: 1px solid #f8fafc;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }

                    .total-label {
                        font-size: 0.775rem;
                        font-weight: 800;
                        color: #94a3b8;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 2px;
                    }

                    .order-total-highlight {
                        font-size: 1.375rem;
                        font-weight: 950;
                        color: var(--primary);
                        letter-spacing: -0.5px;
                    }
                    
                    .status-badge {
                        font-size: 0.775rem !important;
                        padding: 6px 12px !important;
                        border-radius: 10px !important;
                        text-transform: uppercase !important;
                        font-weight: 900 !important;
                    }
                </style>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <h2 style="font-size: 1.725rem; font-weight: 950; color: #1e293b; margin:0; letter-spacing:-0.5px;">Pré-venda</h2>
                            <span style="background: #6366f1; color: #fff; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.775rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Próxima Fornada</span>
                        </div>
                        <p style="font-size: 1.075rem; color: #64748b; font-weight: 600;">Fila de pedidos agendados para a fornada de ${dateLabel}.</p>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="window.forceCycleTurnover()" style="padding: 0 1.5rem; height: 48px; background: #fff; border: 2px solid #6366f1; color: #6366f1; border-radius: 12px; font-weight: 900; font-size: 1.025rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#6366f1'; this.style.color='#fff';" onmouseout="this.style.background='#fff'; this.style.color='#6366f1';">
                             <i data-lucide="zap" style="width:18px; height:18px;"></i> Forçar Virada de Ciclo
                        </button>
                    </div>
                </div>

                <div class="dashboard-kpis" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; zoom: 0.7; width: calc(100% / 0.7);">
                    <div class="kpi-card-dash" style="border-bottom: 4px solid #6366f1;">
                        <div class="label">Total Pedidos</div>
                        <div class="val" style="color: #6366f1;">${totalOrders}</div>
                    </div>
                    <div class="kpi-card-dash" style="border-bottom: 4px solid #8b5cf6;">
                        <div class="label">Total de Itens</div>
                        <div class="val" style="color: #8b5cf6;">${totalItems}</div>
                    </div>
                    <div class="kpi-card-dash" style="border-bottom: 4px solid #3b82f6;">
                        <div class="label">Faturamento Projetado</div>
                        <div class="val" style="color: #3b82f6; font-size: 1.725rem;">R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div class="kpi-card-dash" style="border-bottom: 4px solid #64748b;">
                        <div class="label">Data Produção</div>
                        <div class="val" style="color: #1e293b; font-size: 1.525rem;">${dateLabel}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <h3 style="font-size: 1.125rem; font-weight: 950; color: #1e293b; margin:0;">Lista de Encomendas</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                            ${filtered.map(o => {
                                const total = Number(o.total_amount || 0);
                                return `
                                    <div class="order-card-v2" onclick="toggleOrderDetail(event, '${o.id}')">
                                         <div class="order-card-header">
                                             <div style="display: flex; align-items: center; gap: 10px;">
                                                 <div style="width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 6px; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                                                 </div>
                                                 <span class="order-number">#${String(o.id).slice(0, 5).toUpperCase()}</span>
                                             </div>
                                             <span class="status-badge" style="background: rgba(99, 102, 241, 0.1); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.3);">PRÉ-VENDA</span>
                                         </div>
                                         <div class="order-card-body">
                                             <div class="customer-name-block">${o.clientes?.name || 'Cliente'}</div>
                                             <div class="order-info-row"><i data-lucide="clock"></i><span>${new Date(o.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span></div>
                                             <div class="order-info-row"><i data-lucide="calendar"></i><span>${new Date(o.created_at).toLocaleDateString()}</span></div>
                                         </div>
                                         <div class="order-card-footer">
                                             <div style="flex: 1;">
                                                 <div class="total-label">Total Gasto</div>
                                                 <div class="order-total-highlight">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                             </div>
                                             <div style="display: flex; gap: 8px;">
                                                 <div style="width: 34px; height: 34px; background: #f8fafc; border: 1px solid #eef2f6; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8;"><i data-lucide="eye" style="width: 16px; height: 16px;"></i></div>
                                             </div>
                                         </div>
                                         <div id="full-detail-${o.id}" style="display:none;"></div>
                                    </div>
                                `;
                            }).join('')}
                            ${filtered.length === 0 ? `<div style="grid-column: 1 / -1; padding: 4rem; text-align: center; color: #94a3b8; font-weight: 600;">Nenhum pedido de pré-venda encontrado.</div>` : ''}
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <div class="chart-box-main" style="padding: 1.5rem; background: #fdfaff; border: 1.5px solid #e9d5ff;">
                            <h3 style="font-size: 1.025rem; font-weight: 950; color: #581c87; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="shopping-basket" style="width:18px; height:18px;"></i> Resumo de Produção
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                ${Object.keys(productionSummary).length > 0 ? Object.entries(productionSummary).map(([name, qty]) => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #fff; border-radius: 8px; border: 1px solid #f1f5f9;">
                                        <span style="font-weight: 700; color: #1e293b; font-size: 0.975rem;">${name}</span>
                                        <span style="background: #8b5cf6; color: #fff; padding: 2px 10px; border-radius: 12px; font-weight: 900; font-size: 0.925rem;">${qty}x</span>
                                    </div>
                                `).join('') : `<p style="color: #94a3b8; font-size: 0.925rem; text-align: center;">Nenhum item para produzir.</p>`}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();

            // Detalhes escondidos para modais
            filtered.forEach(o => {
                const modalTarget = document.getElementById(`full-detail-${o.id}`);
                if (modalTarget) {
                    let items = o.items;
                    if (typeof items === 'string') try { items = JSON.parse(items); } catch {}
                    const itemsArr = Array.isArray(items) ? items : (items?.actual_items || []);
                    const waUrl = o.clientes?.whatsapp ? `https://wa.me/55${o.clientes.whatsapp.replace(/\D/g, '')}` : '#';

                    modalTarget.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:1.25rem;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <div>
                                    <h3 style="margin:0; font-size:1.225rem; font-weight:800; color:#1e293b;">${o.clientes?.name || 'Cliente'}</h3>
                                    <div style="color:#94a3b8; font-size:0.975rem; font-weight:600;">${window.formatPhone(o.clientes?.whatsapp)}</div>
                                </div>
                                <span class="status-badge" style="background: rgba(99, 102, 241, 0.1); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.3);">PRÉ-VENDA</span>
                            </div>
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:1.25rem;">
                                <div style="font-size:0.875rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:1rem; letter-spacing:0.5px;">Itens da Encomenda</div>
                                <div style="display:flex; flex-direction:column; gap:0.75rem;">
                                    ${itemsArr.map(i => `
                                        <div style="display:flex; justify-content:space-between; font-size:1.075rem;">
                                            <span style="color:var(--text-content); font-weight:600;"><span style="font-weight:800; color:#6366f1;">${i.qty}x</span> ${i.name}</span>
                                            <span style="color:#1e293b; font-weight:800;">R$ ${(i.price * i.qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div style="display:flex; gap:1rem; margin-top:0.5rem;">
                                <a href="${waUrl}" target="_blank" onclick="event.stopPropagation();" style="flex:1; height:48px; background:#25d366; color:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; text-decoration:none; gap:0.6rem; font-weight:800; font-size:1.075rem;"><i data-lucide="phone" style="width:20px; height:20px;"></i> WhatsApp</a>
                            </div>
                        </div>
                    `;
                }
            });

        } catch (e) {
            console.error(e);
            adminMain.innerHTML = `<div style="padding:4rem; text-align:center; color:#ef4444;">Erro ao carregar pré-venda.</div>`;
        }
    }

    window.forceCycleTurnover = () => {
        showConfirm("Virada de Ciclo", "Deseja forçar a virada de ciclo agora?\\n\\nIsso moverá todos os pedidos de Pré-venda para a Fila de Produção e avançará as datas das janelas de venda.", async () => {
            try {
                const resp = await fetch('/api/admin/force-cycle-turnover', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${state.token}` }
                });
                const data = await resp.json();
                if (data.success) {
                    showToast(data.message);
                    await fetchData();
                    renderPreVenda();
                    syncStoreStatus();
                } else {
                    showToast(data.error || "Erro ao realizar virada.");
                }
            } catch (e) {
                console.error(e);
                showToast("Erro de conexão.");
            }
        });
    };

    // =========================================================================
    // 🛑 ÁREA PROTEGIDA - NÃO ALTERAR - APROVADO & CONGELADO (SOBRE A LOJA)
    // =========================================================================
    function renderStoreInfo() {
        const info = state.content['store_info'] || { name: '', cuisine: 'Padaria & Conveniência', description: '', address: '', hide_address: false };
        const publicUrl = window.location.origin;

        adminMain.innerHTML = `
            <div style="animation: fadeIn 0.3s ease;">
                <!-- Header and Tabs -->
                <div style="margin-bottom: 2rem;">
                    <h2 style="font-size: 1.625rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem;">Loja</h2>
                    <div style="display: flex; gap: 2rem; border-bottom: 1px solid #e2e8f0;">
                        <div style="padding-bottom: 0.8rem; border-bottom: 2px solid var(--primary); color: var(--primary); font-weight: 700; font-size: 1.025rem; cursor: default;">Sobre a Loja</div>
                    </div>
                </div>

                <!-- Blue Banner Link -->
                <div style="background: #eef2ff; border-radius: 8px; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; width: 100%; max-width: 1100px;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i data-lucide="link" style="color: #6366f1; width: 20px; height: 20px;"></i>
                        <div>
                            <div style="font-size: 0.875rem; font-weight: 600; color: #475569; margin-bottom: 0.2rem;">Meu link</div>
                            <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--primary); font-weight: 700; font-size: 1.025rem;">
                                ${publicUrl}
                                <i data-lucide="copy" onclick="fallbackCopy('${publicUrl}')" style="width: 14px; height: 14px; cursor: pointer; color: var(--primary);"></i>
                            </div>
                        </div>
                    </div>
                    <button style="background: var(--primary); color: #fff; border: none; border-radius: 6px; padding: 0.5rem 1rem; font-weight: 700; font-size: 0.925rem; cursor: pointer;">Editar</button>
                </div>

                <!-- Form Area -->
                <div style="display: flex; flex-direction: column; gap: 2rem; width: 100%; max-width: 1100px;">
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Nome do estabelecimento</label>
                            <input type="text" id="store-name" value="${info.name || ''}" placeholder="" style="width: 100%; padding: 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; font-weight: 500; outline:none; transition:0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Estilo de culinária</label>
                            <div style="position: relative;">
                                <select id="store-cuisine" style="width: 100%; padding: 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; background:#fff; font-weight:500; appearance: none; outline:none; cursor:pointer;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">
                                    <option value="Padaria & Conveniência" ${(!info.cuisine || info.cuisine === 'Padaria & Conveniência') ? 'selected' : ''}>Padaria & Conveniência</option>
                                    <option value="Restaurante" ${info.cuisine === 'Restaurante' ? 'selected' : ''}>Restaurante</option>
                                    <option value="Lanchonete" ${info.cuisine === 'Lanchonete' ? 'selected' : ''}>Lanchonete</option>
                                </select>
                                <i data-lucide="chevron-down" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #64748b; pointer-events: none;"></i>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Título</label>
                        <input type="text" id="store-title" value="${info.title || ''}" placeholder="Ex: Nossa História" style="width: 100%; padding: 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; font-weight: 500; outline:none; transition:0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Nossa História</label>
                        <textarea id="store-desc" style="width: 100%; height: 250px; padding: 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; font-weight:500; resize: vertical; outline:none; transition:0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">${info.description || ''}</textarea>
                    </div>

                    <div style="padding-top: 1.5rem;">
                        <h3 style="font-size: 0.925rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 1.25rem; letter-spacing: 0.5px;">LOCALIZAÇÃO</h3>
                        
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Endereço</label>
                            <div style="position: relative;">
                                <input type="text" id="store-address" value="${info.address || ''}" placeholder="" style="width: 100%; padding: 0.8rem 2.5rem 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; font-weight:500; outline:none; transition:0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">
                                <i data-lucide="map-pin" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #1e293b;"></i>
                            </div>
                        </div>
                    </div>

                    <div style="padding-top: 1.5rem; display: flex; justify-content: flex-end;">
                        <button onclick="saveStoreInfo()" style="padding: 0.6rem 2rem; background: var(--primary); color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 1.025rem;">Salvar</button>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }

    window.saveStoreInfo = async () => {
        const info = {
            name: document.getElementById('store-name').value,
            cuisine: document.getElementById('store-cuisine').value,
            title: document.getElementById('store-title').value,
            description: document.getElementById('store-desc').value,
            address: document.getElementById('store-address').value,
            hide_address: document.getElementById('hide-address') ? document.getElementById('hide-address').checked : (state.content['store_info']?.hide_address || false)
        };
        try {
            const resp = await fetch('/api/admin/save-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
                body: JSON.stringify({ key: 'store_info', value: info })
            });
            if (resp.ok) {
                state.content['store_info'] = info;
                showToast("Informações da loja atualizadas com sucesso!");
            }
        } catch (e) { showToast("Erro ao salvar!"); }
    };

    // ==========================================
    // CONFIGURAÇÃO HOME PAGE
    // ==========================================
    window.handleHeroPhotoChange = async (input) => {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);
        try {
            const resp = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${state.token}` },
                body: formData
            });
            const data = await resp.json();
            if (data.success) {
                state.tempHeroImg = data.url;
                const preview = document.getElementById('hero-img-preview');
                if (preview) preview.src = '/' + data.url;
                showToast("Imagem carregada!");
                document.getElementById('config-home-save-btn').disabled = false;
                document.getElementById('config-home-save-btn').style.background = 'var(--primary)';
                document.getElementById('config-home-save-btn').style.color = '#fff';
            }
        } catch (e) {
            console.error(e);
            showToast("Erro no upload");
        }
    };

    window.saveConfigHome = async () => {
        const titleVal = document.getElementById('hero-title').value;
        const finalTitle = titleVal.replace(/\*(.*?)\*/g, '<em>$1</em>'); 
        
        const heroBtn = document.getElementById('config-home-save-btn');
        heroBtn.innerHTML = '<i class="spinner-small"></i>';

        const hero = {
            eyebrow: document.getElementById('hero-eyebrow').value,
            title: finalTitle,
            description: document.getElementById('hero-desc').value,
            image_url: state.tempHeroImg || (state.content['hero']?.image_url || 'assets/sourdough.jpg')
        };
        try {
            const resp = await fetch('/api/admin/save-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
                body: JSON.stringify({ key: 'hero', value: hero })
            });
            if (resp.ok) {
                state.content['hero'] = hero;
                state.tempHeroImg = null;
                showToast("Home Page atualizada com sucesso!");
                heroBtn.disabled = true;
                heroBtn.style.background = '#e2e8f0';
                heroBtn.style.color = '#94a3b8';
            }
        } catch (e) { showToast("Erro ao salvar!"); }
        finally {
            heroBtn.innerHTML = 'Atualizar Home Page';
        }
    };

    // =========================================================================
    // 🛑 ÁREA PROTEGIDA - NÃO ALTERAR - APROVADO & CONGELADO (CONFIG HOME)
    // =========================================================================
    function renderConfigHome() {
        const hero = state.content['hero'] || { 
            eyebrow: 'Fermentação Natural', 
            title: 'O pão que\n<em>transforma</em>\no seu dia', 
            description: 'Cada pão nasce de levain vivo, farinha de qualidade e tempo; não tem atalho, tem respeito.', 
            image_url: 'assets/sourdough.jpg' 
        };
        
        // Conversao para exibir asteriscos e raw QUEBRAS DE LINHA na text area
        const displayTitle = hero.title.replace(/<em>(.*?)<\/em>/g, '*$1*');

        adminMain.innerHTML = `
            <div style="animation: fadeIn 0.3s ease;">
                <!-- Header and Tabs -->
                <div style="margin-bottom: 2.5rem;">
                    <h2 style="font-size: 1.625rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem;">Loja</h2>
                    <div style="display: flex; gap: 2rem; border-bottom: 1px solid #e2e8f0;">
                        <div style="padding-bottom: 0.8rem; border-bottom: 2px solid var(--primary); color: var(--primary); font-weight: 700; font-size: 1.025rem; cursor: default;">Configuração Home Page</div>
                    </div>
                </div>

                <!-- Label -->
                <div style="margin-bottom: 1.5rem;">
                    <div style="font-size: 0.875rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Banner Principal</div>
                </div>

                <div style="display: flex; gap: 2.5rem; width: 100%; max-width: 1100px;">
                    <!-- Left: Form -->
                    <div style="flex: 2; padding-right: 1rem;">
                        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                            
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Texto Curto Superior <span style="color: #64748b; font-weight: 500; font-size: 0.875rem; margin-left: 0.2rem;">(Ref. Retângulo Verde)</span></label>
                                <input type="text" id="hero-eyebrow" value="${hero.eyebrow}" style="width: 100%; padding: 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; font-weight: 500; outline:none; transition:0.2s;" oninput="document.getElementById('config-home-save-btn').disabled=false; document.getElementById('config-home-save-btn').style.background='var(--primary)'; document.getElementById('config-home-save-btn').style.color='#fff'; document.getElementById('config-home-save-btn').style.cursor='pointer';" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Título Principal Grande <span style="color: #64748b; font-weight: 500; font-size: 0.875rem; margin-left: 0.2rem;">(Ref. Retângulo Vermelho)</span></label>
                                <textarea id="hero-title" style="width: 100%; height: 110px; padding: 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; font-weight:500; resize: vertical; outline:none; transition:0.2s; line-height:1.4;" oninput="document.getElementById('config-home-save-btn').disabled=false; document.getElementById('config-home-save-btn').style.background='var(--primary)'; document.getElementById('config-home-save-btn').style.color='#fff'; document.getElementById('config-home-save-btn').style.cursor='pointer';" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">${displayTitle}</textarea>
                                <p style="font-size: 0.875rem; color: #64748b; margin-top: -0.2rem;">Use asteriscos para destacar o texto em dourado. Ex: *transforma*</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Texto Descritivo <span style="color: #64748b; font-weight: 500; font-size: 0.875rem; margin-left: 0.2rem;">(Ref. Retângulo Roxo)</span></label>
                                <textarea id="hero-desc" style="width: 100%; height: 80px; padding: 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; font-weight:500; resize: vertical; outline:none; transition:0.2s; line-height:1.4;" oninput="document.getElementById('config-home-save-btn').disabled=false; document.getElementById('config-home-save-btn').style.background='var(--primary)'; document.getElementById('config-home-save-btn').style.color='#fff'; document.getElementById('config-home-save-btn').style.cursor='pointer';" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">${hero.description}</textarea>
                            </div>

                        </div>
                    </div>

                    <!-- Right: Upload Card -->
                    <div style="flex: 1; max-width: 350px; padding: 2.5rem 1rem; border: 1px dashed #cbd5e1; border-radius: 8px; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                        <div style="width: 120px; height: 160px; border-radius: 6px; overflow: hidden; background: #0f172a; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; border: 1px solid #e2e8f0;">
                            <img id="hero-img-preview" src="${(hero.image_url && hero.image_url.startsWith('http')) ? hero.image_url : '/' + hero.image_url}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="font-size: 1.225rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">Imagem Principal</div>
                        <div style="font-size: 0.875rem; color: #64748b; font-weight: 500; margin-bottom: 1.5rem;">Substitui a imagem de fundo</div>
                        
                        <button onclick="document.getElementById('hero-img-input').click()" style="padding: 0.6rem 1.25rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 700; color: #475569; font-size: 0.975rem; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">Substituir imagem</button>
                        <input type="file" id="hero-img-input" accept="image/*" style="display: none;" onchange="window.handleHeroPhotoChange(this)">
                    </div>
                </div>

                <div style="padding-top: 1.5rem; border-top: 1px solid #e2e8f0; margin-top: 2rem; display: flex; justify-content: flex-end; width: 100%; max-width: 1100px;">
                    <button id="config-home-save-btn" disabled onclick="window.saveConfigHome()" style="padding: 0.8rem 2.5rem; background: #e2e8f0; color: #94a3b8; border: none; border-radius: 6px; font-weight: 700; cursor: not-allowed; font-size: 1.075rem; transition: 0.2s;">Atualizar Home Page</button>
                </div>
            </div>
        `;
    }

    async function handleProfilePhotoChange(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            const resp = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${state.token}` },
                body: formData
            });
            const data = await resp.json();
            if (data.success) {
                state.tempLogo = data.url;
                const preview = document.getElementById('profile-logo-preview');
                if (preview) preview.src = '/' + data.url;
                showToast("Imagem carregada!");
            }
        } catch (e) {
            console.error(e);
            showToast("Erro no upload");
        }
    }

    async function saveProfileData() {
        const email = document.getElementById('profile-email').value;
        const password = document.getElementById('profile-pass').value;
        const profileSaveBtn = document.getElementById('profile-save-btn');
        
        if (profileSaveBtn) {
            profileSaveBtn.disabled = true;
            profileSaveBtn.innerHTML = '<i class="spinner-small"></i> Salvando...';
        }

        try {
            // 1. Atualizar dados de acesso (Usuario)
            const userUpdate = { email };
            if (password && password.trim() !== '' && password !== '********') {
                userUpdate.senha = password;
            }
            
            const resp1 = await fetch('/api/admin/update-profile', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}` 
                },
                body: JSON.stringify(userUpdate)
            });

            // 2. Atualizar Logo (Site Content) se houver nova imagem
            if (state.tempLogo) {
                await fetch('/api/admin/save-content', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}` 
                    },
                    body: JSON.stringify({ key: 'site_logo', value: state.tempLogo })
                });
                state.content['site_logo'] = state.tempLogo;
                
                // Atualiza logos no cabeçalho e sidebar
                document.querySelectorAll('.photo-circle img, .logo-header-wrap img, .unit-logo-square img').forEach(img => {
                    img.src = '/' + state.tempLogo;
                });
            }

            // 3. Atualizar Nome e Telefone (store_info)
            const storeName = document.getElementById('profile-name')?.value;
            const storePhone = document.getElementById('profile-phone')?.value;
            if (storeName !== undefined && storePhone !== undefined) {
                const updatedStoreInfo = { 
                    ...(state.content['store_info'] || {}),
                    name: storeName,
                    phone: storePhone 
                };
                await fetch('/api/admin/save-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
                    body: JSON.stringify({ key: 'store_info', value: updatedStoreInfo })
                });
                state.content['store_info'] = updatedStoreInfo;
            }

            if (resp1.ok) {
                showToast("Perfil atualizado com sucesso!");
                // Se o e-mail mudou, atualizar no state local
                state.user.email = email;
                localStorage.setItem('tocha_admin_user', JSON.stringify(state.user));
            } else {
                showToast("Erro ao atualizar!");
            }
        } catch (e) {
            console.error(e);
            showToast("Erro de conexão");
        } finally {
            if (profileSaveBtn) {
                profileSaveBtn.disabled = true;
                profileSaveBtn.style.background = '#e2e8f0';
                profileSaveBtn.style.color = '#94a3b8';
                profileSaveBtn.style.cursor = 'not-allowed';
                profileSaveBtn.innerHTML = 'Salvar';
            }
        }
    }

    // =========================================================================
    // 🛑 ÁREA PROTEGIDA - NÃO ALTERAR - APROVADO & CONGELADO (PERFIL DA LOJA)
    // =========================================================================
    function renderProfile() {
        const currentEmail = state.user?.email || '';
        const currentLogo = state.content['site_logo'] ? '/' + state.content['site_logo'] : '/assets/logo-tocha.png';
        state.tempLogo = null; // reset visual temp

        adminMain.innerHTML = `
            <div style="animation: fadeIn 0.3s ease;">
                <!-- Top Header -->
                <div style="margin-bottom: 2.5rem;">
                    <h2 style="font-size: 1.625rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem;">Perfil</h2>
                    <div style="display: flex; gap: 2rem; border-bottom: 1px solid #e2e8f0;">
                        <div style="padding-bottom: 0.8rem; border-bottom: 2px solid var(--primary); color: var(--primary); font-weight: 700; font-size: 1.025rem; cursor: default;">Editar Perfil</div>
                    </div>
                </div>

                <!-- DADOS PESSOAIS Label -->
                <div style="margin-bottom: 1.5rem;">
                    <div style="font-size: 0.875rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Dados Pessoais</div>
                </div>

                <div style="display: flex; gap: 2rem; width: 100%; max-width: 1100px;">
                    <!-- Left: Upload Card -->
                    <div style="flex: 1; max-width: 400px; padding: 3rem 1rem; border: 1px dashed #cbd5e1; border-radius: 8px; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                            <img id="profile-logo-preview" src="${currentLogo}" style="width: 60%; object-fit: contain;">
                        </div>
                        <div style="font-size: 1.225rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">Foto de Perfil</div>
                        <div style="font-size: 0.875rem; color: #64748b; font-weight: 500; margin-bottom: 0.2rem;">Formato: PNG ou JPG</div>
                        <div style="font-size: 0.875rem; color: #64748b; font-weight: 500; margin-bottom: 1.5rem;">Resolução mínima: 350px x 195px</div>
                        
                        <i data-lucide="image" style="width: 24px; height: 24px; color: #94a3b8; margin-bottom: 0.5rem;"></i>
                        <div style="font-size: 0.875rem; color: #94a3b8; font-weight: 500; max-width: 250px; margin-bottom: 1.25rem;">Arraste sua imagem aqui ou escolha uma direto do seu dispositivo</div>
                        
                        <button onclick="document.getElementById('logo-upload-input').click()" style="padding: 0.6rem 1.25rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 700; color: #475569; font-size: 0.975rem; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">Escolher foto</button>
                        <input type="file" id="logo-upload-input" accept="image/png, image/jpeg" style="display: none;" onchange="handleProfilePhotoChange(this); document.getElementById('profile-save-btn').disabled=false; document.getElementById('profile-save-btn').style.background='var(--primary)'; document.getElementById('profile-save-btn').style.color='#fff'; document.getElementById('profile-save-btn').style.cursor='pointer';">
                    </div>

                    <!-- Right: Form -->
                    <div style="flex: 2; padding: 0 1rem;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Nome <span style="color: #ef4444;">*</span></label>
                                <input type="text" id="profile-name" value="${state.content['store_info']?.name || 'TOCHA PADARIA'}" style="width: 100%; padding: 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; font-weight: 500; outline:none; transition:0.2s;" oninput="document.getElementById('profile-save-btn').disabled=false; document.getElementById('profile-save-btn').style.background='var(--primary)'; document.getElementById('profile-save-btn').style.color='#fff'; document.getElementById('profile-save-btn').style.cursor='pointer';" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Telefone <span style="color: #ef4444;">*</span></label>
                                <div style="display: flex; align-items: stretch; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #fff; transition: 0.2s;" id="phone-container">
                                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0 0.8rem; background: #f8fafc; border-right: 1px solid #cbd5e1;">
                                        <img src="https://flagcdn.com/w20/br.png" width="16" alt="BR">
                                        <i data-lucide="chevron-down" style="width: 14px; height: 14px; color: #64748b;"></i>
                                    </div>
                                    <input type="text" id="profile-phone" value="${state.content['store_info']?.phone || '(21) 96627-8965'}" style="flex: 1; padding: 0.8rem 1rem; border: none; font-size: 1.075rem; color: #1e293b; font-weight: 500; outline:none;" oninput="document.getElementById('profile-save-btn').disabled=false; document.getElementById('profile-save-btn').style.background='var(--primary)'; document.getElementById('profile-save-btn').style.color='#fff'; document.getElementById('profile-save-btn').style.cursor='pointer';" onfocus="document.getElementById('phone-container').style.borderColor='var(--primary)'" onblur="document.getElementById('phone-container').style.borderColor='#cbd5e1'">
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 50%;">
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">E-mail <span style="color: #ef4444;">*</span></label>
                                <input type="email" id="profile-email" value="${currentEmail}" style="width: 100%; padding: 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; background: #fff; font-weight: 500; outline:none; transition:0.2s;" oninput="document.getElementById('profile-save-btn').disabled=false; document.getElementById('profile-save-btn').style.background='var(--primary)'; document.getElementById('profile-save-btn').style.color='#fff'; document.getElementById('profile-save-btn').style.cursor='pointer';" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#cbd5e1'">
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <label style="font-size: 0.975rem; font-weight: 800; color: #1e293b;">Senha</label>
                                <input type="password" id="profile-pass" value="********" style="width: 100%; padding: 0.8rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1.075rem; color: #1e293b; background: #fff; font-weight: 500; outline:none; transition:0.2s;" oninput="document.getElementById('profile-save-btn').disabled=false; document.getElementById('profile-save-btn').style.background='var(--primary)'; document.getElementById('profile-save-btn').style.color='#fff'; document.getElementById('profile-save-btn').style.cursor='pointer';" onfocus="this.style.borderColor='var(--primary)'; if(this.value==='********') this.value='';" onblur="this.style.borderColor='#cbd5e1'; if(this.value==='') this.value='********';">
                            </div>
                            
                            <div>
                                <span style="font-size: 0.975rem; font-weight: 700; color: var(--primary); cursor: pointer; text-decoration: none;" onclick="document.getElementById('profile-pass').focus();">Alterar Senha</span>
                            </div>
                        </div>
                        
                    </div>
                </div>
                
                <div style="padding-top: 2rem; margin-top: 2rem; padding-bottom: 2rem; display: flex; justify-content: flex-end; width: 100%; max-width: 1100px;">
                    <button id="profile-save-btn" disabled onclick="saveProfileData()" style="padding: 0.6rem 2rem; background: #e2e8f0; color: #94a3b8; border: none; border-radius: 6px; font-weight: 700; cursor: not-allowed; font-size: 1.025rem; transition: 0.2s;">Salvar</button>
                </div>
            </div>
        `;
        
        if (window.lucide) lucide.createIcons();
        window.handleProfilePhotoChange = handleProfilePhotoChange;
        window.saveProfileData = saveProfileData;
    }

    function showToast(msg) { if (toast) { toast.textContent = msg; toast.classList.add('active'); setTimeout(() => toast.classList.remove('active'), 3000); } }

    window.copyStoreLink = () => {
        const url = window.location.origin;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                showToast('Link da loja copiado!');
            }).catch(() => fallbackCopy(url));
        } else {
            fallbackCopy(url);
        }
    };
    function fallbackCopy(text) {
        const el = document.createElement('textarea'); el.value = text;
        document.body.appendChild(el); el.select();
        try { document.execCommand('copy'); showToast('Link da loja copiado!'); } catch (e) {}
        document.body.removeChild(el);
    }

    // --- INICIALIZAÇÃO ---

    if (state.token) {
        loginOverlay.style.display = 'none';
        _origFetch('/api/admin/config', { headers: { 'Authorization': `Bearer ${state.token}` } })
        .then(async res => {
            if (!res.ok) throw new Error('Token inválido ou expirado');
            await fetchCsrfToken();
            await initAdmin();
        })
        .catch(err => {
            console.error('Auto-init failed:', err);
            showToast('Sessão expirada. Faça login novamente.');
            localStorage.removeItem('tocha_admin_token');
            state.token = null;
            loginOverlay.style.display = 'flex';
        });
    }

    async function fetchHistoricoData() {
        state.isHistLoading = true;
        if (state.currentSection === 'historico-pedidos') renderHistoricoPedidos();
        try {
            const params = new URLSearchParams({
                page: state.histPage,
                limit: state.histLimit,
                start: state.histStart,
                end: state.histEnd,
                includeRejected: state.histIncludeRejected
            });
            const resp = await fetch('/api/admin/pedidos/historico?' + params.toString(), {
                headers: { 'Authorization': 'Bearer ' + state.token }
            });
            const data = await resp.json();
            state.histOrders = data?.orders || [];
            state.histCount = data?.count || 0;
            state.histStats = data?.stats || { totalRevenue: 0, totalOrders: 0, avgTicket: 0, taxTotal: 0, discountTotal: 0 };
        } catch (err) {
            console.error('fetchHistoricoData error:', err);
        } finally {
            state.isHistLoading = false;
            if (state.currentSection === 'historico-pedidos') renderHistoricoPedidos();
        }
    }

    window.updateHistFilter = (field, val) => {
        state[field] = val;
        state.histPage = 1;
        fetchHistoricoData();
    };

    window.changeHistPage = (p) => {
        state.histPage = p;
        fetchHistoricoData();
    };

    window.exportHistorico = () => {
        if (!state.histOrders.length) return showToast('Nada para exportar');
        let csv = 'Codigo;Cliente;Tipo;Pagamento;Status;Valor;Data\n';
        state.histOrders.forEach(o => {
            const total = Number(o.total_amount || 0).toFixed(2);
            csv += `#${String(o.id).slice(0,5).toUpperCase()};${o.customer_name || o.clientes?.name || 'Cliente'};${o.scheduled_at ? 'Agendada' : 'Entrega'};${o.payment_method || 'PIX'};${o.status};${total};${new Date(o.created_at).toLocaleString('pt-BR')}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'historico_pedidos_tocha.csv';
        link.click();
    };

    // =========================================================================
    // 🛑 ÁREA PROTEGIDA - NÃO ALTERAR - APROVADO & CONGELADO (HISTÓRICO)
    // =========================================================================
    function renderHistoricoPedidos() {
        const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const totalPages = Math.ceil(state.histCount / state.histLimit) || 1;

        adminMain.innerHTML = `
            <div style="animation: fadeIn 0.4s ease;">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 2.5rem;">
                    <div>
                        <h2 style="font-size: 1.8rem; font-weight: 950; color: #1e293b; margin-bottom: 0.5rem; letter-spacing:-0.5px;">Histórico de Pedidos</h2>
                        <p style="font-size: 1.125rem; color: #64748b; font-weight: 600;">Relatório consolidado de todas as transações da unidade.</p>
                    </div>
                </div>

                <!-- KPIs -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2.5rem;">
                    ${renderHistStatCard('Faturamento', fmt(state.histStats.totalRevenue), 'banknote', '#5a57e6')}

                    ${renderHistStatCard('Lucro', fmt(state.histStats.profit), 'trending-up', '#10b981')}
                    ${renderHistStatCard('Nº Pedidos', state.histStats.totalOrders, 'clipboard-check', '#8b5cf6')}
                    ${renderHistStatCard('Ticket Médio', fmt(state.histStats.avgTicket), 'trending-up', '#3b82f6')}
                </div>

                <!-- FILTROS -->
                <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <label style="font-size: 0.875rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">De</label>
                            <input type="date" value="${state.histStart}" onchange="updateHistFilter('histStart', this.value)" style="padding: 0.5rem 0.75rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.975rem; font-weight: 700; background: var(--bg); color: var(--text-main); outline: none;">
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <label style="font-size: 0.875rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Até</label>
                            <input type="date" value="${state.histEnd}" onchange="updateHistFilter('histEnd', this.value)" style="padding: 0.5rem 0.75rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.975rem; font-weight: 700; background: var(--bg); color: var(--text-main); outline: none;">
                        </div>
                        <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.975rem; font-weight: 700; color: var(--text-muted);">
                            <input type="checkbox" ${state.histIncludeRejected ? 'checked' : ''} onchange="updateHistFilter('histIncludeRejected', this.checked)" style="width: 18px; height: 18px; border-radius: 4px; accent-color: var(--primary);">
                            Exibir pedidos recusados
                        </label>
                    </div>
                    <button onclick="exportHistorico()" style="display:flex; align-items:center; gap:0.6rem; padding: 0.7rem 1.25rem; background: var(--primary); color: #fff; border: none; border-radius: 10px; font-weight: 800; font-size: 0.975rem; cursor: pointer; box-shadow: 0 4px 12px rgba(90, 87, 230, 0.4);">
                        <i data-lucide="download" style="width:16px; height:16px;"></i> Exportar
                    </button>
                </div>

                <!-- TABELA -->
                <div style="background: var(--card); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--border);">
                                ${['Código', 'Cliente', 'Tipo', 'Identificador', 'Pagamento', 'Status', 'Itens', 'Data', 'Agendamento', 'Total'].map(h => `
                                    <th style="padding: 1.25rem 1rem; text-align: left; font-size: 0.875rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">${h}</th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody id="hist-table-body">
                            ${state.isHistLoading ? `
                                <tr><td colspan="10" style="padding: 5rem; text-align: center; color: var(--text-dim);"><i class="spinner-small" style="border-top-color: var(--primary); width: 24px; height: 24px;"></i><div style="margin-top:1rem; font-weight:700;">Carregando histórico...</div></td></tr>
                            ` : (state.histOrders.length === 0 ? `
                                <tr><td colspan="10" style="padding: 5rem; text-align: center; color: var(--text-dim); font-weight: 700;">Nenhum pedido encontrado no período.</td></tr>
                            ` : state.histOrders.map(o => {
                                const status = (o.status || '').toLowerCase();
                                const isOk = ['paid', 'pago', 'concluido', 'concluído', 'finalizado', 'entregue', 'delivered', 'aceito', 'preparo', 'retirada'].includes(status);
                                return `
                                    <tr onclick="showOrderHistoryDetail('${o.id}')" style="border-bottom: 1px solid var(--border); cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                        <td style="padding: 1.25rem 1rem; font-weight: 850; color: var(--primary); font-size: 0.975rem;">#${String(o.id).slice(0,5).toUpperCase()}</td>
                                        <td style="padding: 1.25rem 1rem;">
                                            <div style="font-weight: 800; color: var(--text-main);">${o.customer_name || o.clientes?.name || 'Cliente'}</div>
                                            <div style="font-size: 0.875rem; color: var(--text-dim); font-weight: 600;">${o.clientes?.whatsapp || '-'}</div>
                                        </td>
                                        <td style="padding: 1.25rem 1rem;"><span style="font-weight: 700; font-size: 0.875rem; color: var(--text-muted);">${o.scheduled_at ? 'Agendada' : 'Entrega'}</span></td>
                                        <td style="padding: 1.25rem 1rem; font-size: 0.825rem; color: var(--text-dim); font-family: monospace;">${(o.stripe_session_id || o.id).slice(-8)}</td>
                                        <td style="padding: 1.25rem 1rem;"><span style="padding: 0.35rem 0.65rem; background: #f1f5f9; border-radius: 6px; font-size: 0.825rem; font-weight: 800; color: #64748b; text-transform: uppercase;">${(o.payment_method || 'Online').toUpperCase()}</span></td>
                                        <td style="padding: 1.25rem 1rem;"><span style="padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.825rem; font-weight: 800; ${isOk ? 'background: #d1fae5; color: #10b981;' : 'background: #fee2e2; color: #ef4444;'}">${(o.status || 'PAGO').toUpperCase()}</span></td>
                                        <td style="padding: 1.25rem 1rem; font-weight: 700; text-align: center;">${parseItems(o.items).length}</td>
                                        <td style="padding: 1.25rem 1rem; font-size: 0.875rem; font-weight: 600; color: var(--text-muted);">${new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td style="padding: 1.25rem 1rem; font-size: 0.875rem; font-weight: 600; color: var(--primary);">${o.scheduled_at ? new Date(o.scheduled_at).toLocaleDateString('pt-BR') : '-'}</td>
                                        <td style="padding: 1.25rem 1rem; font-weight: 950; color: var(--text-main); font-size: 1.075rem; letter-spacing: -0.5px;">${fmt(o.total_amount)}</td>
                                    </tr>
                                `;
                            }).join(''))}
                        </tbody>
                    </table>

                    <!-- PAGINAÇÃO -->
                    <div style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 2.5px solid var(--border); background: var(--bg-secondary);">
                        <div style="font-size: 0.975rem; font-weight: 700; color: var(--text-dim);">Exibindo ${state.histOrders.length} de ${state.histCount} pedidos</div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button ${state.histPage <= 1 ? 'disabled' : ''} onclick="changeHistPage(${state.histPage - 1})" style="padding: 0.6rem 1rem; border: 1.5px solid var(--border); background: #fff; border-radius: 8px; cursor: pointer; font-weight: 800; color: var(--text-muted);"><</button>
                            <span style="padding: 0.6rem 1.25rem; font-weight: 900; color: var(--primary); font-size: 1.075rem;">${state.histPage}</span>
                            <button ${state.histPage >= totalPages ? 'disabled' : ''} onclick="changeHistPage(${state.histPage + 1})" style="padding: 0.6rem 1rem; border: 1.5px solid var(--border); background: #fff; border-radius: 8px; cursor: pointer; font-weight: 800; color: var(--text-muted);">></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }

    function renderHistStatCard(label, val, icon, color) {
        return `
            <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.75rem;">
                    <span style="font-size: 0.875rem; font-weight: 850; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px;">${label}</span>
                    <i data-lucide="${icon}" style="width: 18px; height: 18px; color: ${color};"></i>
                </div>
                <div style="font-size: 1.525rem; font-weight: 950; color: var(--text-main); letter-spacing: -0.5px;">${val}</div>
            </div>
        `;
    }

    // Modal Centralizado para Histórico
    window.showOrderHistoryDetail = (id) => {
        const order = state.histOrders.find(o => String(o.id) === String(id));
        if (!order) return;
        
        const items = parseItems(order.items);
        const status = (order.status || '').toLowerCase();
        const isOk = ['paid', 'pago', 'concluido', 'concluído', 'finalizado', 'entregue', 'delivered', 'aceito', 'preparo', 'retirada'].includes(status);
        const total = Number(order.total_amount || 0);

        const modalHtml = `
            <div style="padding: 2.5rem; max-width: 600px; margin: 0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
                    <div style="font-size: 1.525rem; font-weight: 950; color: var(--text-main);">#${String(order.id).slice(0,5).toUpperCase()}</div>
                    <span style="padding: 0.5rem 1rem; border-radius: 10px; font-weight: 900; font-size: 0.975rem; ${isOk ? 'background: #d1fae5; color: #10b981;' : 'background: #fee2e2; color: #ef4444;'}">${(order.status || 'PAGO').toUpperCase()}</span>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
                    <div>
                        <div style="font-size: 0.825rem; font-weight: 900; color: #64748b; text-transform:uppercase; margin-bottom: 0.5rem;">Cliente</div>
                        <div style="font-weight: 850; color: #1e293b; font-size: 1.225rem;">${order.customer_name || order.clientes?.name || 'Cliente'}</div>
                        <a href="https://wa.me/55${(order.clientes?.whatsapp || '').replace(/\D/g, '')}" target="_blank" style="color: #10b981; font-weight: 700; font-size: 1.025rem; text-decoration: none; display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                            <i data-lucide="phone" style="width:14px; height:14px;"></i> ${formatPhone(order.clientes?.whatsapp)}
                        </a>
                    </div>
                    <div>
                         <div style="font-size: 0.825rem; font-weight: 900; color: #64748b; text-transform:uppercase; margin-bottom: 0.5rem;">Pagamento</div>
                         <div style="font-weight: 850; color: #1e293b;">${(order.payment_method || 'Cartão').toUpperCase()}</div>
                         <div style="font-size: 0.925rem; color: #94a3b8; font-weight: 700; margin-top: 2px;">Finalizado via Stripe</div>
                    </div>
                    <div>
                         <div style="font-size: 0.825rem; font-weight: 900; color: #64748b; text-transform:uppercase; margin-bottom: 0.5rem;">Tipo de Entrega</div>
                         <div style="font-weight: 850; color: #1e293b;">${order.scheduled_at ? 'Retirada Agendada' : 'Retirada Imediata'}</div>
                    </div>
                    <div>
                         <div style="font-size: 0.825rem; font-weight: 900; color: #64748b; text-transform:uppercase; margin-bottom: 0.5rem;">Data e Hora</div>
                         <div style="font-weight: 850; color: #1e293b;">${new Date(order.created_at).toLocaleString('pt-BR')}</div>
                    </div>
                </div>

                    <table style="width:100%; border-collapse: collapse;">
                        ${items.map(i => `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 0.75rem 0; font-weight: 900; color: var(--primary); width: 40px;">${i.qty}x</td>
                                <td style="padding: 0.75rem 0; font-weight: 700; color: #1e293b;">${i.name}</td>
                                <td style="padding: 0.75rem 0; text-align: right; font-weight: 850; color: #1e293b;">R$ ${Number(i.price * i.qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2.5rem;">
                    <div style="font-size: 1.525rem; font-weight: 950; color: #1e293b;">Total</div>
                    <div style="font-size: 1.8rem; font-weight: 950; color: var(--primary); letter-spacing: -1px;">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>

                <button onclick="window.closeOrderModal()" style="width:100%; padding: 1.1rem; background: #1e293b; color: #fff; border: none; border-radius: 12px; font-weight: 900; font-size: 1.125rem; cursor: pointer; transition: 0.2s;">Fechar Histórico</button>
            </div>
        `;

        const modalOverlay = document.getElementById('order-modal-overlay');
        const modalBody = document.getElementById('modal-body-content');
        if (modalOverlay && modalBody) {
            modalBody.innerHTML = modalHtml;
            modalOverlay.classList.add('active');
            if (window.lucide) lucide.createIcons();
        }
    };

    function renderHistoricoPedidos() {
        const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const totalPages = Math.ceil(state.histCount / state.histLimit) || 1;

        adminMain.innerHTML = `
            <div style="animation: fadeIn 0.4s ease;">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 2.5rem;">
                    <div>
                        <h2 style="font-size: 1.8rem; font-weight: 950; color: #1e293b; margin-bottom: 0.5rem; letter-spacing:-0.5px;">Histórico de Pedidos</h2>
                        <p style="font-size: 1.125rem; color: #64748b; font-weight: 600;">Relatório consolidado de todas as transações da unidade.</p>
                    </div>
                </div>

                <!-- KPIs -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2.5rem;">
                    ${renderHistStatCard('Faturamento', fmt(state.histStats.totalRevenue), 'banknote', '#5a57e6')}

                    ${renderHistStatCard('Lucro', fmt(state.histStats.profit), 'trending-up', '#10b981')}
                    ${renderHistStatCard('Nº Pedidos', state.histStats.totalOrders, 'clipboard-check', '#8b5cf6')}
                    ${renderHistStatCard('Ticket Médio', fmt(state.histStats.avgTicket), 'trending-up', '#3b82f6')}
                </div>

                <!-- FILTROS -->
                <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <label style="font-size: 0.875rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">De</label>
                            <input type="date" value="${state.histStart}" onchange="updateHistFilter('histStart', this.value)" style="padding: 0.5rem 0.75rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.975rem; font-weight: 700; background: var(--bg); color: var(--text-main); outline: none;">
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <label style="font-size: 0.875rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Até</label>
                            <input type="date" value="${state.histEnd}" onchange="updateHistFilter('histEnd', this.value)" style="padding: 0.5rem 0.75rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.975rem; font-weight: 700; background: var(--bg); color: var(--text-main); outline: none;">
                        </div>
                        <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.975rem; font-weight: 700; color: var(--text-muted);">
                            <input type="checkbox" ${state.histIncludeRejected ? 'checked' : ''} onchange="updateHistFilter('histIncludeRejected', this.checked)" style="width: 18px; height: 18px; border-radius: 4px; accent-color: var(--primary);">
                            Exibir pedidos recusados
                        </label>
                    </div>
                    <button onclick="exportHistorico()" style="display:flex; align-items:center; gap:0.6rem; padding: 0.7rem 1.25rem; background: var(--primary); color: #fff; border: none; border-radius: 10px; font-weight: 800; font-size: 0.975rem; cursor: pointer; box-shadow: 0 4px 12px rgba(90, 87, 230, 0.4);">
                        <i data-lucide="download" style="width:16px; height:16px;"></i> Exportar
                    </button>
                </div>

                <!-- TABELA -->
                <div style="background: var(--card); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--border);">
                                ${['Código', 'Cliente', 'Tipo', 'Identificador', 'Pagamento', 'Status', 'Itens', 'Data', 'Agendamento', 'Total'].map(h => `
                                    <th style="padding: 1.25rem 1rem; text-align: left; font-size: 0.875rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">${h}</th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody id="hist-table-body">
                            ${state.isHistLoading ? `
                                <tr><td colspan="10" style="padding: 5rem; text-align: center; color: var(--text-dim);"><i class="spinner-small" style="border-top-color: var(--primary); width: 24px; height: 24px;"></i><div style="margin-top:1rem; font-weight:700;">Carregando histórico...</div></td></tr>
                            ` : (state.histOrders.length === 0 ? `
                                <tr><td colspan="10" style="padding: 5rem; text-align: center; color: var(--text-dim); font-weight: 700;">Nenhum pedido encontrado no período.</td></tr>
                            ` : state.histOrders.map(o => {
                                const status = (o.status || '').toLowerCase();
                                const isOk = ['paid', 'pago', 'concluido', 'concluído', 'finalizado', 'entregue', 'delivered', 'aceito', 'preparo', 'retirada'].includes(status);
                                return `
                                    <tr onclick="showOrderHistoryDetail('${o.id}')" style="border-bottom: 1px solid var(--border); cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                        <td style="padding: 1.25rem 1rem; font-weight: 850; color: var(--primary); font-size: 0.975rem;">#${String(o.id).slice(0,5).toUpperCase()}</td>
                                        <td style="padding: 1.25rem 1rem;">
                                            <div style="font-weight: 800; color: var(--text-main);">${o.customer_name || o.clientes?.name || 'Cliente'}</div>
                                            <div style="font-size: 0.875rem; color: var(--text-dim); font-weight: 600;">${o.clientes?.whatsapp || '-'}</div>
                                        </td>
                                        <td style="padding: 1.25rem 1rem;"><span style="font-weight: 700; font-size: 0.875rem; color: var(--text-muted);">${o.scheduled_at ? 'Agendada' : 'Entrega'}</span></td>
                                        <td style="padding: 1.25rem 1rem; font-size: 0.825rem; color: var(--text-dim); font-family: monospace;">${(o.stripe_session_id || o.id).slice(-8)}</td>
                                        <td style="padding: 1.25rem 1rem;"><span style="padding: 0.35rem 0.65rem; background: #f1f5f9; border-radius: 6px; font-size: 0.825rem; font-weight: 800; color: #64748b; text-transform: uppercase;">${(o.payment_method || 'Online').toUpperCase()}</span></td>
                                        <td style="padding: 1.25rem 1rem;"><span style="padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.825rem; font-weight: 800; ${isOk ? 'background: #d1fae5; color: #10b981;' : 'background: #fee2e2; color: #ef4444;'}">${(o.status || 'PAGO').toUpperCase()}</span></td>
                                        <td style="padding: 1.25rem 1rem; font-weight: 700; text-align: center;">${parseItems(o.items).length}</td>
                                        <td style="padding: 1.25rem 1rem; font-size: 0.875rem; font-weight: 600; color: var(--text-muted);">${new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td style="padding: 1.25rem 1rem; font-size: 0.875rem; font-weight: 600; color: var(--primary);">${o.scheduled_at ? new Date(o.scheduled_at).toLocaleDateString('pt-BR') : '-'}</td>
                                        <td style="padding: 1.25rem 1rem; font-weight: 950; color: var(--text-main); font-size: 1.075rem; letter-spacing: -0.5px;">${fmt(o.total_amount)}</td>
                                    </tr>
                                `;
                            }).join(''))}
                        </tbody>
                    </table>

                    <!-- PAGINAÇÃO -->
                    <div style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 2.5px solid var(--border); background: var(--bg-secondary);">
                        <div style="font-size: 0.975rem; font-weight: 700; color: var(--text-dim);">Exibindo ${state.histOrders.length} de ${state.histCount} pedidos</div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button ${state.histPage <= 1 ? 'disabled' : ''} onclick="changeHistPage(${state.histPage - 1})" style="padding: 0.6rem 1rem; border: 1.5px solid var(--border); background: #fff; border-radius: 8px; cursor: pointer; font-weight: 800; color: var(--text-muted);"><</button>
                            <span style="padding: 0.6rem 1.25rem; font-weight: 900; color: var(--primary); font-size: 1.075rem;">${state.histPage}</span>
                            <button ${state.histPage >= totalPages ? 'disabled' : ''} onclick="changeHistPage(${state.histPage + 1})" style="padding: 0.6rem 1rem; border: 1.5px solid var(--border); background: #fff; border-radius: 8px; cursor: pointer; font-weight: 800; color: var(--text-muted);">></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }

    function renderHistStatCard(label, val, icon, color) {
        return `
            <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.75rem;">
                    <span style="font-size: 0.875rem; font-weight: 850; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px;">${label}</span>
                    <i data-lucide="${icon}" style="width: 18px; height: 18px; color: ${color};"></i>
                </div>
                <div style="font-size: 1.525rem; font-weight: 950; color: var(--text-main); letter-spacing: -0.5px;">${val}</div>
            </div>
        `;
    }

    // Modal Centralizado para Histórico
    window.showOrderHistoryDetail = (id) => {
        const order = state.histOrders.find(o => String(o.id) === String(id));
        if (!order) return;
        
        const items = parseItems(order.items);
        const status = (order.status || '').toLowerCase();
        const isOk = ['paid', 'pago', 'concluido', 'concluído', 'finalizado', 'entregue', 'delivered', 'aceito', 'preparo', 'retirada'].includes(status);
        const total = Number(order.total_amount || 0);

        const modalHtml = `
            <div style="padding: 2.5rem; max-width: 600px; margin: 0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
                    <div style="font-size: 1.525rem; font-weight: 950; color: var(--text-main);">#${String(order.id).slice(0,5).toUpperCase()}</div>
                    <span style="padding: 0.5rem 1rem; border-radius: 10px; font-weight: 900; font-size: 0.975rem; ${isOk ? 'background: #d1fae5; color: #10b981;' : 'background: #fee2e2; color: #ef4444;'}">${(order.status || 'PAGO').toUpperCase()}</span>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
                    <div>
                        <div style="font-size: 0.825rem; font-weight: 900; color: #64748b; text-transform:uppercase; margin-bottom: 0.5rem;">Cliente</div>
                        <div style="font-weight: 850; color: #1e293b; font-size: 1.225rem;">${order.customer_name || order.clientes?.name || 'Cliente'}</div>
                        <a href="https://wa.me/55${(order.clientes?.whatsapp || '').replace(/\D/g, '')}" target="_blank" style="color: #10b981; font-weight: 700; font-size: 1.025rem; text-decoration: none; display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                            <i data-lucide="phone" style="width:14px; height:14px;"></i> ${formatPhone(order.clientes?.whatsapp)}
                        </a>
                    </div>
                    <div>
                         <div style="font-size: 0.825rem; font-weight: 900; color: #64748b; text-transform:uppercase; margin-bottom: 0.5rem;">Pagamento</div>
                         <div style="font-weight: 850; color: #1e293b;">${(order.payment_method || 'Cartão').toUpperCase()}</div>
                         <div style="font-size: 0.925rem; color: #94a3b8; font-weight: 700; margin-top: 2px;">Finalizado via Stripe</div>
                    </div>
                    <div>
                         <div style="font-size: 0.825rem; font-weight: 900; color: #64748b; text-transform:uppercase; margin-bottom: 0.5rem;">Tipo de Entrega</div>
                         <div style="font-weight: 850; color: #1e293b;">${(() => {
                             let itemsRaw = order.items;
                             if (typeof itemsRaw === 'string') { try { itemsRaw = JSON.parse(itemsRaw); } catch { itemsRaw = {}; } }
                             const bDate = itemsRaw?.batch_date || (order.scheduled_at ? order.scheduled_at.split('T')[0] : null);
                             if (bDate) {
                                 const d = new Date(bDate + 'T12:00:00');
                                 return `Retirada na fornada ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
                             }
                             return 'Retirada na fornada';
                         })()}</div>
                    </div>
                    <div>
                         <div style="font-size: 0.825rem; font-weight: 900; color: #64748b; text-transform:uppercase; margin-bottom: 0.5rem;">Data e Hora</div>
                         <div style="font-weight: 850; color: #1e293b;">${new Date(order.created_at).toLocaleString('pt-BR')}</div>
                    </div>
                </div>

                <table style="width:100%; border-collapse: collapse; margin-bottom: 2.5rem;">
                    ${items.map(i => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 0.75rem 0; font-weight: 900; color: var(--primary); width: 40px;">${i.qty}x</td>
                            <td style="padding: 0.75rem 0; font-weight: 700; color: #1e293b;">${i.name}</td>
                            <td style="padding: 0.75rem 0; text-align: right; font-weight: 850; color: #1e293b;">R$ ${Number(i.price * i.qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    `).join('')}
                </table>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2.5rem;">
                    <div style="font-size: 1.525rem; font-weight: 950; color: #1e293b;">Total</div>
                    <div style="font-size: 1.8rem; font-weight: 950; color: var(--primary); letter-spacing: -1px;">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>

                <a href="https://wa.me/55${(order.clientes?.whatsapp || '').replace(/\D/g, '')}" target="_blank" style="width:100%; padding: 1.1rem; background: #22c55e; color: #fff; border: none; border-radius: 12px; font-weight: 900; font-size: 1.125rem; cursor: pointer; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 1rem; transition: 0.2s;">
                    <i data-lucide="message-circle" style="width: 22px; height: 22px;"></i> WhatsApp
                </a>

                <button onclick="window.closeOrderModal()" style="width:100%; padding: 1.1rem; background: #1e293b; color: #fff; border: none; border-radius: 12px; font-weight: 900; font-size: 1.125rem; cursor: pointer; transition: 0.2s;">Fechar Histórico</button>
            </div>
        `;

        const modalOverlay = document.getElementById('order-modal-overlay');
        const modalBody = document.getElementById('modal-body-content');
        if (modalOverlay && modalBody) {
            modalBody.innerHTML = modalHtml;
            modalOverlay.classList.add('active');
            if (window.lucide) lucide.createIcons();
        }
    };

    window.deleteEngagementContact = (id) => {
        window.showConfirm('Excluir Contato', 'Tem certeza que deseja excluir este contato permanentemente? Esta ação não pode ser desfeita.', async () => {
            try {
                const resp = await fetch('/api/admin/delete-item', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    },
                    body: JSON.stringify({ table: 'clientes', id })
                });
                const data = await resp.json();
                if (data.success) {
                    window.showToast('✅ Contato excluído com sucesso!');
                    await fetchData();
                    renderEngagement();
                } else {
                    throw new Error(data.error || 'Erro ao excluir contato.');
                }
            } catch (e) {
                console.error("Erro ao excluir contato:", e);
                window.showToast('❌ Falha ao excluir: ' + e.message);
            }
        });
    };

    window.showEngagementTemplateModal = (index = null) => {
        const templates = JSON.parse(localStorage.getItem('tocha_engagement_templates') || '[]');
        const isEdit = index !== null;
        const t = isEdit ? templates[index] : { name: '', text: '' };

        const modalHtml = `
            <div style="padding: 2.5rem; max-width: 500px; margin: 0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
                    <h3 style="font-size: 1.725rem; font-weight: 950; color: #1e293b; margin: 0;">${isEdit ? 'Editar Modelo' : 'Novo Modelo'}</h3>
                    <i data-lucide="file-text" style="width: 28px; height: 28px; color: #f59e0b;"></i>
                </div>

                <div style="display:flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2.5rem;">
                    <div>
                        <label style="display: block; font-size: 0.875rem; font-weight: 850; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Nome do Modelo</label>
                        <input type="text" id="modal-template-name" value="${t.name}" placeholder="Ex: Promoção Pão" style="width: 100%; padding: 1rem; border-radius: 12px; border: 2px solid #f1f5f9; font-size: 1.125rem; font-weight: 700; color: #1e293b; outline: none; transition: 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#f1f5f9'">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.875rem; font-weight: 850; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.5px;">Mensagem</label>
                        <textarea id="modal-template-text" placeholder="Escreva o conteúdo da mensagem..." style="width: 100%; min-height: 200px; padding: 1rem; border-radius: 12px; border: 2px solid #f1f5f9; font-size: 1.125rem; font-weight: 600; color: #1e293b; outline: none; transition: 0.2s; resize: none;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='#f1f5f9'">${t.text}</textarea>
                        <div style="margin-top: 0.5rem; font-size: 0.875rem; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="zap" style="width:12px; height:12px; color: #f59e0b;"></i> Use {nome} para personalizar
                        </div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: ${isEdit ? '1fr 1fr 1fr' : '1fr 1fr'}; gap: 1rem;">
                    <button onclick="window.closeOrderModal()" style="padding: 1.1rem; background: #f1f5f9; color: #64748b; border: none; border-radius: 12px; font-weight: 950; font-size: 1.025rem; cursor: pointer; transition: 0.2s;">Cancelar</button>
                    ${isEdit ? `
                        <button onclick="window.deleteEngagementTemplate(${index})" style="padding: 1.1rem; background: #fee2e2; color: #ef4444; border: none; border-radius: 12px; font-weight: 950; font-size: 1.025rem; cursor: pointer; transition: 0.2s;">Excluir</button>
                    ` : ''}
                    <button id="btn-save-modal-template" style="padding: 1.1rem; background: var(--primary); color: #fff; border: none; border-radius: 12px; font-weight: 950; font-size: 1.025rem; cursor: pointer; transition: 0.2s; box-shadow: 0 10px 20px rgba(90, 87, 230, 0.2);">Salvar Modelo</button>
                </div>
            </div>
        `;

        const modalOverlay = document.getElementById('order-modal-overlay');
        const modalBody = document.getElementById('modal-body-content');
        if (modalOverlay && modalBody) {
            modalBody.innerHTML = modalHtml;
            modalOverlay.classList.add('active');
            if (window.lucide) lucide.createIcons();

            document.getElementById('btn-save-modal-template').onclick = () => {
                const newName = document.getElementById('modal-template-name').value.trim();
                const newText = document.getElementById('modal-template-text').value.trim();
                if (!newName || !newText) return window.showToast('⚠️ Preencha todos os campos!');

                if (isEdit) {
                    templates[index] = { name: newName, text: newText };
                } else {
                    templates.push({ name: newName, text: newText });
                }
                localStorage.setItem('tocha_engagement_templates', JSON.stringify(templates));
                window.closeOrderModal();
                updateEngagementTemplatesList();
                window.showToast(isEdit ? '✅ Modelo atualizado!' : '✅ Modelo criado!');
            };
        }
    };

    // =========================================================================
    // MÓDULO DE ENGAJAMENTO E MENSAGENS (CAMPANHAS WHATSAPP)
    // =========================================================================
    
    window.renderEngagement = () => {
        adminMain.innerHTML = `
            <div class="welcome-section" style="margin-bottom: 2rem; animation: fadeIn 0.4s ease;">
                <p>RELACIONAMENTO & CRM</p>
                <h2 style="margin-bottom: 0.5rem;">Central de Mensagens</h2>
                <div style="font-size: 0.975rem; color: #64748b; font-weight: 600;">Comunique-se de forma inteligente e gerencie sua base de clientes com automação.</div>
            </div>

            <div style="display: grid; grid-template-columns: 320px 1fr 340px; gap: 1.5rem; align-items: stretch; animation: slideUp 0.5s ease-out;">
                
                <!-- COLUNA 1: DESTINATÁRIOS (ESQUERDA) -->
                <div style="background: var(--card); border: 1px solid var(--border); border-radius: 24px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.02); min-height: 700px;">
                    <div style="padding: 1.75rem; border-bottom: 1px solid var(--border); background: #fbfbfb;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                            <h4 style="font-size: 1.025rem; font-weight: 950; color: #1e293b; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Destinatários</h4>
                            <div id="sel-count-badge" style="background: #eef2ff; color: var(--primary); padding: 4px 12px; border-radius: 8px; font-size: 0.875rem; font-weight: 950; border: 1px solid #e0e7ff; transition: 0.3s;">0 selecionados</div>
                        </div>
                        
                        <div style="position: relative; margin-bottom: 1.25rem;">
                            <input type="text" id="eng-cust-search" placeholder="Filtrar por nome ou celular..." 
                                   oninput="state.engagementCustomerSearch = this.value; updateEngagementCustomerList()"
                                   style="width: 100%; padding: 0.8rem 1rem 0.8rem 2.5rem; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 0.975rem; outline: none; transition: 0.2s;"
                                   onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 0 3px rgba(90, 87, 230, 0.1)';" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none';">
                            <i data-lucide="search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #94a3b8;"></i>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between;">
                            <button onclick="toggleAllEngagement(true)" style="background: transparent; border: none; color: var(--primary); font-size: 0.875rem; font-weight: 850; cursor: pointer; padding: 0;">Selecionar Todos</button>
                            <button onclick="toggleAllEngagement(false)" style="background: transparent; border: none; color: #94a3b8; font-size: 0.875rem; font-weight: 850; cursor: pointer; padding: 0;">Limpar Seleção</button>
                        </div>
                    </div>
                    
                    <div id="eng-customer-list" style="flex: 1; overflow-y: auto; padding: 1rem; background: #fff;">
                        <!-- JS Dynamic Content -->
                    </div>
                </div>

                <!-- COLUNA 2: MENSAGEM (CENTRO) -->
                <div style="background: var(--card); border: 1px solid var(--border); border-radius: 28px; padding: 2.25rem; box-shadow: 0 15px 40px rgba(0,0,0,0.03); display: flex; flex-direction: column; position: relative;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
                        <h4 style="font-size: 1.225rem; font-weight: 950; color: #1e293b; margin: 0;">Mensagem da Campanha</h4>
                        <div style="display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.875rem; font-weight: 800; background: #f1f5f9; padding: 6px 14px; border-radius: 20px;">
                            <i data-lucide="zap" style="width: 14px; height: 14px; color: #f59e0b;"></i> Use {nome} para personalizar
                        </div>
                    </div>

                    <textarea id="eng-message-box" 
                              placeholder="Escreva sua mensagem aqui. Use {nome} para personalizar automaticamente com o nome do cliente..." 
                              oninput="window.updateEngagementSummary()"
                              style="width: 100%; flex: 1; min-height: 400px; padding: 1.75rem; border: 2.5px solid #f1f5f9; border-radius: 24px; font-size: 1.175rem; line-height: 1.6; color: #1e293b; outline: none; transition: 0.3s; resize: none; background: #fff; box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);"
                              onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 10px 30px rgba(90, 87, 230, 0.05)';" 
                              onblur="this.style.borderColor='#f1f5f9'; this.style.boxShadow='none';"></textarea>
                    
                    <div style="margin-top: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
                        
                        <!-- RESUMO DINÂMICO -->
                        <div id="eng-summary-line" style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.975rem; color: #64748b; font-weight: 700; background: #f8fafc; padding: 10px; border-radius: 12px; border: 1px solid #f1f5f9;">
                            Selecione destinatários e escreva a mensagem
                        </div>

                        <button onclick="window.sendEngagementCampaign()" id="btn-send-camp" 
                                style="width: 100%; background: #10b981; color: #fff; padding: 1.35rem; border-radius: 18px; border: none; font-weight: 950; font-size: 1.225rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.25); transition: all 0.3s;">
                            <i data-lucide="send" id="icon-send-camp" style="width:20px; height:20px;"></i> ENVIAR CAMPANHA AGORA
                        </button>

                        <div style="text-align: center; font-size: 0.875rem; color: #94a3b8; font-weight: 700; letter-spacing: 0.3px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i data-lucide="clock" style="width:12px; height:12px;"></i> O envio será processado em fila para garantir a entrega.
                        </div>
                    </div>
                </div>

                <!-- COLUNA 3: FERRAMENTAS & MODELOS (DIREITA) -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    
                    <!-- ADICIONAR CONTATO -->
                    <div style="background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 1.75rem; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1.25rem;">
                             <div style="width: 32px; height: 32px; background: #e0f2fe; color: #0369a1; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="user-plus" style="width: 18px; height: 18px;"></i>
                             </div>
                             <h4 style="font-size: 0.975rem; font-weight: 950; color: #1e293b; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Novo Contato</h4>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                            <input type="text" id="manual-name" placeholder="Nome do Cliente" style="padding: 0.85rem 1rem; border-radius: 12px; border: 1.5px solid #f1f5f9; font-size: 0.975rem; outline: none; background: #fcfcfd; font-weight: 600;">
                            <input type="text" id="manual-phone" placeholder="WhatsApp (DDD+Número)" 
                                   style="padding: 0.85rem 1rem; border-radius: 12px; border: 1.5px solid #f1f5f9; font-size: 0.975rem; outline: none; background: #fcfcfd; font-weight: 600;">
                            
                            <div style="font-size: 0.775rem; color: #94a3b8; font-weight: 700; text-align: center; margin-bottom: 4px;">
                                Cadastre contatos para mensagens futuras
                            </div>

                            <button onclick="saveManualContact()" style="background: #1e293b; color: #fff; border: none; padding: 0.9rem; border-radius: 12px; font-weight: 900; font-size: 0.975rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <i data-lucide="save" style="width: 14px; height: 14px;"></i> Cadastrar Contato
                            </button>
                        </div>
                    </div>

                    <!-- MODELOS DE MENSAGENS -->
                    <div style="background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 1.75rem; box-shadow: 0 10px 30px rgba(0,0,0,0.02); flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h4 id="eng-template-title" style="font-size: 0.975rem; font-weight: 950; color: #1e293b; margin: 0; text-transform: uppercase; letter-spacing: 1px; border-left: 3px solid #f59e0b; padding-left: 10px;">Modelos (0/10)</h4>
                            <button id="btn-add-template" onclick="addEngagementTemplate()" style="width: 32px; height: 32px; background: #f59e0b; color: #fff; border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);">
                                <i data-lucide="plus" style="width:18px; height:18px;"></i>
                            </button>
                        </div>
                        <div id="eng-templates-list" style="display: flex; flex-direction: column; gap: 0.85rem; overflow-y: auto; flex: 1; padding-right: 4px;">
                            <!-- JS Dynamic Content -->
                        </div>
                    </div>

                </div>
            </div>
        `;
        
        // Ativar máscara de telefone e resumo inicial
        setTimeout(() => {
            const phoneInput = document.getElementById('manual-phone');
            if (phoneInput) {
                phoneInput.oninput = (e) => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.length > 11) v = v.slice(0, 11);
                    if (v.length > 10) {
                        e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
                    } else if (v.length > 5) {
                        e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
                    } else if (v.length > 2) {
                        e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                    } else if (v.length > 0) {
                        e.target.value = `(${v}`;
                    }
                };
            }
            window.updateEngagementSummary();
        }, 100);

        updateEngagementCustomerList();
        updateEngagementTemplatesList();
        if (window.lucide) lucide.createIcons();
    };

    window.updateEngagementSummary = () => {
        const targets = state.selectedEngagementCustomers || [];
        const count = targets.length;
        const msgBox = document.getElementById('eng-message-box');
        const msgText = msgBox ? msgBox.value.trim() : "";
        const summaryBtn = document.getElementById('eng-summary-line');
        const btnSend = document.getElementById('btn-send-camp');
        const iconSend = document.getElementById('icon-send-camp');
        
        if (summaryBtn) {
            summaryBtn.innerHTML = count > 0 
                ? `<i data-lucide="check-circle" style="width:14px; height:14px; color: #10b981;"></i> Envio para <strong>${count}</strong> ${count === 1 ? 'cliente' : 'clientes'} via chat bot`
                : `<i data-lucide="alert-circle" style="width:14px; height:14px; color: #f59e0b;"></i> Nenhum cliente selecionado para o disparo`;
            if (window.lucide) lucide.createIcons();
        }
        
        if (btnSend) {
            if (count === 0 || !msgText) {
                btnSend.disabled = true;
                btnSend.style.opacity = '0.5';
                btnSend.style.cursor = 'not-allowed';
                btnSend.style.background = '#94a3b8';
                btnSend.style.transform = 'none';
            } else {
                btnSend.disabled = false;
                btnSend.style.opacity = '1';
                btnSend.style.cursor = 'pointer';
                btnSend.style.background = '#10b981';
            }
        }
    };

    window.updateEngagementCustomerList = () => {
        const query = (state.engagementCustomerSearch || '').toLowerCase();
        let list = (state.customers || []).filter(c => 
            (c.name || '').toLowerCase().includes(query) || (c.whatsapp || '').includes(query)
        );

        const listEl = document.getElementById('eng-customer-list');
        if (!listEl) return;

        listEl.innerHTML = list.map(c => {
            if (!state.selectedEngagementCustomers) state.selectedEngagementCustomers = [];
            const isSelected = state.selectedEngagementCustomers.includes(String(c.id));
            const color = isSelected ? 'var(--primary)' : '#1e293b';
            const bg = isSelected ? 'rgba(90, 87, 230, 0.05)' : 'transparent';
            const brd = isSelected ? '1px solid rgba(90, 87, 230, 0.2)' : '1px solid transparent';
            
            return `
                <div onclick="toggleEngagementCustomer('${c.id}')" 
                     style="display: flex; align-items: center; gap: 12px; padding: 0.9rem 1.25rem; border-radius: 14px; cursor: pointer; transition: 0.2s; margin-bottom: 4px; background: ${bg}; border: ${brd};">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary); pointer-events: none; border-radius: 4px;">
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-size: 0.975rem; font-weight: 850; color: ${color}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">${c.name}</div>
                        <div style="font-size: 0.825rem; color: #64748b; font-weight: 700;">${formatPhone(c.whatsapp)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${isSelected ? '<i data-lucide="check" style="width:14px; height:14px; color: var(--primary);"></i>' : ''}
                        <i data-lucide="trash-2" onclick="event.stopPropagation(); deleteEngagementContact('${c.id}')" style="width:14px; height:14px; color: #ff6b52; cursor: pointer; transition: 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#ff6b52'"></i>
                    </div>
                </div>
            `;
        }).join('') || '<div style="padding: 3rem 1.5rem; text-align: center; font-size: 0.875rem; color: #94a3b8; font-weight: 700;">Nenhum cliente disponível para seleção</div>';
        
        if (window.lucide) lucide.createIcons();
    };

    window.toggleEngagementCustomer = (id) => {
        const s = String(id);
        if (state.selectedEngagementCustomers.includes(s)) {
            state.selectedEngagementCustomers = state.selectedEngagementCustomers.filter(x => x !== s);
        } else {
            state.selectedEngagementCustomers.push(s);
        }
        
        const count = state.selectedEngagementCustomers.length;
        const badge = document.getElementById('sel-count-badge');
        if (badge) {
            badge.textContent = `${count} ${count === 1 ? 'selecionado' : 'selecionados'}`;
            badge.style.background = count > 0 ? 'var(--primary)' : '#eef2ff';
            badge.style.color = count > 0 ? '#fff' : 'var(--primary)';
        }
        
        updateEngagementCustomerList();
        window.updateEngagementSummary();
    };

    window.toggleAllEngagement = (checked) => {
        if (checked) {
            state.selectedEngagementCustomers = state.customers.map(c => String(c.id));
        } else {
            state.selectedEngagementCustomers = [];
        }
        
        const count = state.selectedEngagementCustomers.length;
        const badge = document.getElementById('sel-count-badge');
        if (badge) {
            badge.textContent = `${count} ${count === 1 ? 'selecionado' : 'selecionados'}`;
            badge.style.background = count > 0 ? 'var(--primary)' : '#eef2ff';
            badge.style.color = count > 0 ? '#fff' : 'var(--primary)';
        }

        updateEngagementCustomerList();
        window.updateEngagementSummary();
    };

    window.saveManualContact = async () => {
        const nameInput = document.getElementById('manual-name');
        const phoneInput = document.getElementById('manual-phone');
        const name = nameInput ? nameInput.value.trim() : "";
        const phone = phoneInput ? phoneInput.value.replace(/\D/g, '') : "";
        
        if (!name || phone.length < 10) {
            return window.showToast('⚠️ Por favor, informe nome e um WhatsApp válido!');
        }
        
        try {
            const resp = await fetch('/api/admin/save-customer', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${state.token}` 
                },
                body: JSON.stringify({ name, whatsapp: phone })
            });

            const data = await resp.json();
            
            if (data.success) {
                window.showToast('✅ Contato cadastrado com sucesso!');
                if (nameInput) nameInput.value = '';
                if (phoneInput) phoneInput.value = '';
                await fetchData();
                renderEngagement();
            } else {
                throw new Error(data.error || 'Erro ao cadastrar contato.');
            }
        } catch (e) { 
            console.error("Erro no cadastro manual:", e);
            window.showToast('❌ Falha ao cadastrar: ' + e.message); 
        }
    };

    window.updateEngagementTemplatesList = () => {
        const templates = JSON.parse(localStorage.getItem('tocha_engagement_templates') || '[]');
        const listEl = document.getElementById('eng-templates-list');
        const titleEl = document.getElementById('eng-template-title');
        if (!listEl) return;

        if (titleEl) titleEl.textContent = `Modelos (${templates.length}/10)`;

        listEl.innerHTML = templates.map((t, i) => `
            <div style="padding: 1rem 1.25rem; border: 1.5px solid #f1f5f9; border-radius: 18px; cursor: pointer; transition: 0.3s; position: relative; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);" 
                 onclick="showEngagementTemplateModal(${i})"
                 onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateY(-2px)';" 
                 onmouseout="this.style.borderColor='#f1f5f9'; this.style.transform='translateY(0)';">
                <div style="font-size: 0.975rem; font-weight: 900; color: #1e293b; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="file-text" style="width:14px; height:14px; color: #f59e0b;"></i>
                    ${t.name}
                </div>
                <div style="font-size: 0.875rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; font-weight: 600; font-style: italic;">"${t.text}"</div>
                <div style="position: absolute; top: 0.7rem; right: 1rem; display: flex; align-items: center; background: #fff; padding-left: 10px;">
                    <button onclick="event.stopPropagation(); fillEngagementText(${i})" 
                            style="background: #6366f1; color: #fff; border: none; border-radius: 10px; padding: 0.55rem 1.1rem; font-size: 0.875rem; font-weight: 800; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);"
                            onmouseover="this.style.background='#4f46e5'; this.style.transform='translateY(-1px)';" 
                            onmouseout="this.style.background='#6366f1'; this.style.transform='translateY(0)';"
                            onmousedown="this.style.transform='scale(0.96)';"
                            onmouseup="this.style.transform='scale(1)';">
                        <i data-lucide="send" style="width: 14px; height: 14px;"></i>
                        Usar modelo
                    </button>
                </div>
            </div>
        `).join('') || `
            <div style="padding: 3.5rem 2rem; text-align: center; border: 2.5px dashed #f1f5f9; border-radius: 24px; background: #fbfbfb;">
                <div style="font-size: 0.975rem; color: #94a3b8; font-weight: 850; margin-bottom: 0.5rem;">Crie agilidade</div>
                <div style="font-size: 0.825rem; color: #cbd5e1; font-weight: 600;">Salve frases prontas para realizar disparos rápidos em segundos.</div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    };

    window.fillEngagementText = (index) => {
        const templates = JSON.parse(localStorage.getItem('tocha_engagement_templates') || '[]');
        const t = templates[index];
        if (t) {
            const msgBox = document.getElementById('eng-message-box');
            if (msgBox) {
                msgBox.value = t.text;
                msgBox.focus();
                window.updateEngagementSummary();
            }
            window.showToast(`✅ Modelo "${t.name}" aplicado!`);
        }
    };

    window.addEngagementTemplate = () => {
        const templates = JSON.parse(localStorage.getItem('tocha_engagement_templates') || '[]');
        if (templates.length >= 10) return window.showToast('⚠️ Limite de 10 modelos atingido!');
        window.showEngagementTemplateModal();
    };

    window.editEngagementTemplate = (index) => {
        window.showEngagementTemplateModal(index);
    };

    window.deleteEngagementTemplate = (index) => {
        window.showConfirm('Excluir Modelo', 'Deseja excluir permanentemente este modelo de mensagem?', () => {
            const templates = JSON.parse(localStorage.getItem('tocha_engagement_templates') || '[]');
            templates.splice(index, 1);
            localStorage.setItem('tocha_engagement_templates', JSON.stringify(templates));
            window.closeOrderModal();
            updateEngagementTemplatesList();
            showToast('Modelo excluído.');
        });
    };

    window.sendEngagementCampaign = async function() {
        try {
            const targets = state.selectedEngagementCustomers || [];
            if (targets.length === 0) {
                return window.showToast('⚠️ Por favor, selecione pelo menos um cliente.');
            }

            const msgBox = document.getElementById('eng-message-box');
            const messageText = msgBox ? msgBox.value.trim() : "";
            if (!messageText) {
                return window.showToast('✍️ Escreva a mensagem antes de realizar o disparo.');
            }

            const previewText = messageText.length > 70 ? messageText.substring(0, 70) + "..." : messageText;

            window.showConfirm('Confirmar Campanha', `Deseja enviar para <strong>${targets.length}</strong> clientes agora?`, async () => {
                const btn = document.getElementById('btn-send-camp');
                const originalHtml = btn ? btn.innerHTML : 'ENVIAR';

                try {
                    if (btn) {
                        btn.disabled = true;
                        btn.style.background = '#64748b';
                        btn.innerHTML = '<span class="spinner-small"></span> DISPARANDO...';
                    }

                    const recipientsList = targets.map(cid => {
                        const c = state.customers.find(x => String(x.id) === String(cid));
                        return { phone: c ? c.whatsapp : null, name: c ? c.name : 'Cliente' };
                    }).filter(r => r.phone);

                    if (recipientsList.length === 0) throw new Error("Nenhum telefone válido encontrado.");

                    const response = await fetch('/api/admin/send-bulk-message', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${state.token}`
                        },
                        body: JSON.stringify({ recipients: recipientsList, message: messageText })
                    });

                    if (!response.ok) throw new Error("Falha na comunicação com o bot.");
                    
                    const data = await response.json();
                    
                    if (data.fail === 0) {
                        window.showToast(`🚀 Sucesso! Campanha enviada para ${data.success} contatos.`);
                    } else {
                        window.showToast(`✅ Finalizado. Sucessos: ${data.success} | ❌ Falhas: ${data.fail}`);
                    }

                    state.selectedEngagementCustomers = [];
                    if (msgBox) msgBox.value = '';
                    renderEngagement();

                } catch (apiErr) {
                    console.error("Erro na campanha:", apiErr);
                    window.showToast('❌ Erro no envio: ' + apiErr.message);
                } finally {
                    if (btn) {
                        btn.disabled = false;
                        btn.style.background = '#10b981';
                        btn.innerHTML = originalHtml;
                        window.updateEngagementSummary();
                    }
                }
            });

        } catch (err) {
            console.error("Falha crítica no envio:", err);
            window.showToast('❌ Falha crítica: ' + err.message);
        }
    };

    // Inicialização da busca ao abrir a seção (para manter sincronia com os botões de nav)
    document.addEventListener('click', (e) => {
        const nav = e.target.closest('.nav-item');
        if (nav) {
            const s = nav.dataset.section;
            if (s === 'historico-pedidos') {
                state.histPage = 1;
                fetchHistoricoData();
            } else if (s === 'mensagens') {
                state.selectedEngagementCustomers = [];
            }
        }
    });
    window.renderMessageConfigs = async () => {
        adminMain.innerHTML = `
            <style>
                .msg-chip {
                    padding: 4px 12px;
                    background: rgba(124, 58, 237, 0.1);
                    color: #a78bfa;
                    border: 1px solid rgba(124, 58, 237, 0.2);
                    border-radius: 6px;
                    font-size: 0.925rem;
                    font-weight: 600;
                    cursor: default;
                }
                .config-card-premium textarea {
                    width: 100%;
                    min-height: 220px;
                    padding: 1.25rem;
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    background: var(--bg-secondary);
                    color: var(--text-main);
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-size: 0.975rem;
                    line-height: 1.6;
                    resize: vertical;
                    transition: all 0.2s;
                }
                .config-card-premium textarea:focus {
                    outline: none;
                    border-color: #7c3aed !important;
                    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
                    background: var(--card);
                }
                .btn-save-msg {
                    padding: 0.75rem 2rem;
                    border-radius: 10px;
                    background: #7c3aed;
                    color: white;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .btn-save-msg:hover {
                    box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.4);
                    transform: translateY(-1px);
                    background: #6d28d9;
                }
                .btn-save-msg:active {
                    transform: translateY(0);
                }
            </style>

            <div class="welcome-section" style="margin-bottom: 3.5rem; animation: fadeIn 0.4s ease;">
                <p style="color: var(--text-dim); font-size: 0.925rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">Configurações / Mensagens</p>
                <h2 style="font-size: 2.2rem; font-weight: 800; color: var(--text-main);">Configurações de Mensagem</h2>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 2.5rem; max-width: 900px; padding-bottom: 5rem;">
                
                <!-- Bloco: Email Confirmação -->
                <div class="config-card-premium" style="background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 2.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1.525rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">Email confirmação compra</h3>
                        <p style="font-size: 1.075rem; color: var(--text-muted); line-height: 1.6;">Mensagem enviada automaticamente para o cliente no e-mail cadastrado assim que o pagamento é confirmado.</p>
                    </div>
                    
                    <div style="margin-bottom: 1.75rem;">
                        <p style="font-size: 0.875rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;">Variáveis disponíveis:</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            <span class="msg-chip">{nome}</span>
                            <span class="msg-chip">{itens}</span>
                            <span class="msg-chip">{total}</span>
                            <span class="msg-chip">{pagamento}</span>
                        </div>
                    </div>

                    <textarea id="msg-email-confirm" placeholder="Escreva o template do e-mail..."></textarea>
                    
                    <div style="margin-top: 1.75rem; display: flex; justify-content: flex-end;">
                        <button class="btn-save-msg" onclick="saveMsgConfig('msg_email_confirm')">
                            Salvar Alterações
                        </button>
                    </div>
                </div>

                <!-- Bloco: WhatsApp Confirmação -->
                <div class="config-card-premium" style="background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 2.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1.525rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">WhatsApp confirmação compra</h3>
                        <p style="font-size: 1.075rem; color: var(--text-muted); line-height: 1.6;">Notificação instantânea enviada via WhatsApp para o cliente confirmando a compra e informando os próximos passos.</p>
                    </div>
                    
                    <div style="margin-bottom: 1.75rem;">
                        <p style="font-size: 0.875rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;">Variáveis disponíveis:</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            <span class="msg-chip">{nome}</span>
                            <span class="msg-chip">{itens}</span>
                            <span class="msg-chip">{total}</span>
                            <span class="msg-chip">{pagamento}</span>
                        </div>
                    </div>

                    <textarea id="msg-wa-confirm" placeholder="Escreva o template do WhatsApp..."></textarea>
                    
                    <div style="margin-top: 1.75rem; display: flex; justify-content: flex-end;">
                        <button class="btn-save-msg" onclick="saveMsgConfig('msg_wa_confirm')">
                            Salvar Alterações
                        </button>
                    </div>
                </div>

                <!-- Bloco: WhatsApp Carrinho Abandonado -->
                <div class="config-card-premium" style="background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 2.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1.525rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem;">WhatsApp carrinho abandonado</h3>
                        <p style="font-size: 1.075rem; color: var(--text-muted); line-height: 1.6;">Mensagem de recuperação enviada para carrinhos iniciados que não foram finalizados após 1 hora.</p>
                    </div>
                    
                    <div style="margin-bottom: 1.75rem;">
                        <p style="font-size: 0.875rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;">Variáveis disponíveis:</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            <span class="msg-chip">{nome}</span>
                            <span class="msg-chip">{itens}</span>
                            <span class="msg-chip">{link}</span>
                        </div>
                    </div>

                    <textarea id="msg-wa-abandoned" placeholder="Escreva o template do carrinho abandonado..."></textarea>
                    
                    <div style="margin-top: 1.75rem; display: flex; justify-content: flex-end;">
                        <button class="btn-save-msg" onclick="saveMsgConfig('msg_wa_abandoned')">
                            Salvar Alterações
                        </button>
                    </div>
                </div>

            </div>
        `;

        // Carrega os textos atuais
        try {
            const resp = await fetch('/api/admin/config', { headers: { 'Authorization': `Bearer ${state.token}` } });
            const data = await resp.json();
            const content = {};
            (data.content || []).forEach(c => content[c.key] = c.value);

            // Defaults if not set
            const defaults = {
                msg_email_confirm: `✅ Pedido confirmado — {nome}\n\n📍 Retirada\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n🕒 Quando\nSábado, a partir das 15h\n\n⚠️ Importante\nVocê receberá confirmação no WhatsApp quando estiver pronto.\nRetire somente após essa mensagem.\n\n🚚 Opções\nRetirada pessoal | Uber Flash | 99 Flash\n\n🧾 Pedido\n{itens}\n\nTotal: {total}\nPagamento: {pagamento}\n\nSe precisar, é só chamar!`,
                msg_wa_confirm: `✅ *Pedido confirmado — {nome}*\n\n📍 *Retirada*\nAv. Presidente Kennedy, 627 — Vila Jurandir\n(Em frente à Tetraforma)\n\n🕒 *Quando*\nSábado, a partir das 15h\n\n⚠️ *Importante*\nVocê receberá confirmação no WhatsApp quando estiver pronto.\nRetire somente após essa mensagem.\n\n🚚 *Opções*\nRetirada pessoal | Uber Flash | 99 Flash\n\n🧾 *Pedido*\n{itens}\n\n*Total:* {total}\n*Pagamento:* {pagamento}\n\nSe precisar, é só chamar!`,
                msg_wa_abandoned: `{nome}, tudo bem? 🥖\n\nVimos que você selecionou alguns produtos , bom gosto!\n\nGaranta essas delícias — finalize seu carrinho antes que esgotem!\n\n🛒\n{itens}\n\nQualquer dúvida, estamos por aqui!\n\n🔗 {link}`
            };

            document.getElementById('msg-email-confirm').value = content.msg_email_confirm || defaults.msg_email_confirm;
            document.getElementById('msg-wa-confirm').value = content.msg_wa_confirm || defaults.msg_wa_confirm;
            document.getElementById('msg-wa-abandoned').value = content.msg_wa_abandoned || defaults.msg_wa_abandoned;

        } catch (err) {
            console.error(err);
            showToast('Erro ao carregar configurações.');
        }
    };

    window.saveMsgConfig = async (key) => {
        const idMap = {
            'msg_email_confirm': 'msg-email-confirm',
            'msg_wa_confirm': 'msg-wa-confirm',
            'msg_wa_abandoned': 'msg-wa-abandoned'
        };
        const value = document.getElementById(idMap[key]).value;
        try {
            const resp = await fetch('/api/admin/save-content', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ key, value })
            });
            const data = await resp.json();
            if (data.success) {
                showToast('Configuração salva com sucesso!');
            } else {
                showToast(data.error || 'Erro ao salvar.');
            }
        } catch (err) {
            console.error(err);
            showToast('Erro na conexão.');
        }
    };

    window.renderCategories = async () => {
        adminMain.innerHTML = `
            <div class="welcome-section" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem;">
                <div>
                    <p style="color: var(--text-dim); font-size: 0.925rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">LOJA / CARDÁPIO</p>
                    <h2 style="font-size: 2.2rem; font-weight: 800; color: var(--text-main);">Gestão do Cardápio</h2>
                </div>
            </div>

            <div class="menu-mgmt-container">
                <!-- COLUNA ESQUERDA: CATEGORIAS -->
                <div class="categories-column">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 0 0.5rem;">
                        <h4 style="font-weight: 800; font-size: 1.025rem; color: var(--text-muted);">CATEGORIAS</h4>
                        <button class="action-btn" onclick="openCategoryModal()" title="Nova Categoria">
                            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                    
                    <div id="categories-sortable-list">
                        ${state.categories.length === 0 ? 
                            `<p style="text-align: center; color: var(--text-dim); padding: 2rem;">Vazio</p>` : 
                            state.categories.map((cat, index) => `
                                <div class="category-item-card slim ${state.selectedCategorySlug === cat.slug ? 'active' : ''}" 
                                     draggable="true" 
                                     data-id="${cat.id}" 
                                     data-slug="${cat.slug}"
                                     onclick="selectCategory('${cat.slug}')">
                                    <div class="category-drag-handle" onclick="event.stopPropagation()">
                                        <i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>
                                    </div>
                                    <div class="category-photo">
                                        <img src="${cat.image_url ? (cat.image_url.startsWith('http') ? cat.image_url : '/' + cat.image_url) : '/assets/placeholder.png'}" onerror="this.src='/assets/placeholder.png'">
                                    </div>
                                    <div class="category-info">
                                        <h3>${cat.title}</h3>
                                        <p>${cat.description || ''}</p>
                                        <span class="status-pill ${cat.is_active ? 'active' : 'inactive'}">${cat.is_active ? 'Ativa' : 'Inativa'}</span>
                                    </div>
                                    <div class="category-actions" onclick="event.stopPropagation()">
                                        <button class="action-btn" title="Configurações" onclick="openCategoryModal('${cat.id}')">
                                            <i data-lucide="settings"></i>
                                        </button>
                                        <button class="action-btn delete" title="Excluir" onclick="deleteCategory('${cat.id}')">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>

                <!-- PAINEL DIREITO: PRODUTOS -->
                <div class="products-panel" id="products-panel-right">
                    <!-- Conteúdo dinâmico via renderProductsView -->
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();
        setupCategoriesDND();
        
        // Se houver uma categoria selecionada, renderiza os produtos dela, senão mostra prompt
        if (state.selectedCategorySlug) {
            renderProductsView(state.selectedCategorySlug);
        } else if (state.categories.length > 0) {
            // Opcional: auto-selecionar a primeira
            // selectCategory(state.categories[0].slug);
            renderProductsView(null);
        } else {
            renderProductsView(null);
        }
    };

    window.selectCategory = (slug) => {
        state.selectedCategorySlug = slug;
        document.querySelectorAll('.category-item-card.slim').forEach(el => {
            el.classList.toggle('active', el.dataset.slug === slug);
        });
        renderProductsView(slug);
    };

    window.renderProductsView = (slug) => {
        const rightPanel = document.getElementById('products-panel-right');
        if (!slug) {
            rightPanel.innerHTML = `
                <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-dim); opacity: 0.6; text-align: center;">
                    <i data-lucide="mouse-pointer-2" style="width: 48px; height: 48px; margin-bottom: 1.5rem; stroke-width: 1px;"></i>
                    <h3 style="font-weight: 700;">Selecione uma categoria</h3>
                    <p style="font-size: 1.025rem; margin-top: 0.5rem;">Clique em uma categoria na esquerda para gerenciar seus produtos.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        const cat = state.categories.find(c => c.slug === slug);
        const products = (state.products || []).filter(p => p.category_slug === slug).sort((a,b) => (a.display_order || 0) - (b.display_order || 0));

        rightPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem;">
                <div>
                    <span style="font-size: 0.825rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 1px;">PRODUTOS DE:</span>
                    <h2 style="font-size: 1.8rem; font-weight: 900; color: var(--text-main); margin-top: 0.25rem;">${cat ? cat.title : 'Categoria'}</h2>
                </div>
                <button class="btn-dash-light" onclick="openProductModal(null, '${slug}')" style="background: var(--primary); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="plus-circle" style="width: 18px; height: 18px;"></i> Novo Produto
                </button>
            </div>

            <div id="products-list-sortable" class="products-list-nested" data-slug="${slug}">
                ${products.length === 0 ? 
                    `<div style="padding: 4rem 1rem; text-align: center; color: var(--text-dim);">
                        <p style="font-weight: 700;">Nenhum produto cadastrado nesta categoria.</p>
                        <p style="font-size: 0.975rem; margin-top: 0.4rem;">Clique no botão superior para adicionar o primeiro.</p>
                     </div>` : 
                    products.map(prod => `
                        <div class="product-item-card product-row" draggable="true" data-prod-id="${prod.id}">
                            <div class="product-drag-handle">
                                <i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>
                            </div>
                            <div class="product-photo-mini">
                                <img src="${prod.image_url ? (prod.image_url.startsWith('http') ? prod.image_url : '/' + prod.image_url) : '/assets/placeholder.png'}" onerror="this.src='/assets/placeholder.png'">
                            </div>
                            <div class="product-meta">
                                <h4>${prod.name}</h4>
                                <p style="max-width: 520px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${prod.description || 'Sem descrição.'}</p>
                            </div>
                            <div class="product-price-tag">R$ ${parseFloat(prod.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            <div class="product-status">
                                <span class="status-pill ${prod.is_active ? 'active' : 'inactive'}">${prod.is_active ? 'Ativo' : 'Inativo'}</span>
                            </div>
                            <div style="font-size: 0.875rem; font-weight: 600; min-width: 64px; text-align: right;">
                                <span class="prod-stock-badge" style="color: ${(prod.disponivel_agora ?? 0) === 0 ? '#ef4444' : (prod.disponivel_agora ?? 0) <= 2 ? '#f59e0b' : 'var(--text-muted)'}; font-weight: ${(prod.disponivel_agora ?? 0) <= 2 ? '800' : '600'}">
                                    ${(prod.disponivel_agora ?? 0) === 0 ? 'Esgotado' : `${prod.disponivel_agora ?? '?'} un.`}
                                </span>
                            </div>
                            <div class="product-actions" style="display: flex; gap: 0.5rem;">
                                <button class="action-btn" title="Editar" onclick="openProductModal('${prod.id}', '${slug}')"><i data-lucide="edit-2"></i></button>
                                <button class="action-btn delete" title="Excluir" onclick="deleteProduct('${prod.id}')"><i data-lucide="x"></i></button>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        `;

        if (window.lucide) lucide.createIcons();
        setupProductsDND();
    };

    window.openCategoryModal = (catId = null) => {
        const cat = catId ? state.categories.find(c => c.id == catId) : null;
        const modalBody = document.getElementById('modal-body-content');
        
        modalBody.innerHTML = `
            <div class="modal-category-form">
                <div style="margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.8rem; font-weight: 950; color: var(--text-main); margin-bottom: 0.5rem; letter-spacing: -0.5px;">
                        ${cat ? 'Editar Categoria' : 'Nova Categoria'}
                    </h2>
                    <p style="color: var(--text-dim); font-size: 1.125rem; font-weight: 600;">Defina como a categoria aparecerá para seus clientes.</p>
                </div>

                <div class="form-row">
                    <div class="form-col" style="flex: 2;">
                        <label>Título da Categoria</label>
                        <input type="text" id="cat-title" value="${cat?.title || ''}" placeholder="Ex: Pães de Fermentação Natural" oninput="generateCategorySlug(this.value)">
                    </div>
                    <div class="form-col">
                        <label>Identificador (Slug)</label>
                        <input type="text" id="cat-slug" value="${cat?.slug || ''}" placeholder="ex: paes-naturais">
                    </div>
                </div>

                <div class="form-col">
                    <label>Breve Descrição</label>
                    <textarea id="cat-description" rows="3" placeholder="Ex: Nossa seleção de pães rústicos feitos com levain de 5 anos.">${cat?.description || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-col">
                        <label>Foto de vitrine</label>
                        <div id="cat-photo-zone" class="photo-upload-zone ${cat?.image_url ? 'has-image' : ''}" onclick="document.getElementById('cat-photo-input').click()">
                            <img id="cat-photo-preview" src="${cat?.image_url ? (cat.image_url.startsWith('http') ? cat.image_url : '/' + cat.image_url) : ''}">
                            <div class="upload-placeholder">
                                <i data-lucide="image-plus" style="width: 38px; height: 38px; stroke-width: 1.5px;"></i>
                                <p style="font-weight: 800; font-size: 1.025rem;">Escolher Imagem</p>
                            </div>
                        </div>
                        <input type="file" id="cat-photo-input" style="display: none;" accept="image/*" onchange="handleAdminPhoto(this, 'cat-image-url', 'cat-photo-preview', 'cat-photo-zone', 'btn-save-category')">
                        <input type="hidden" id="cat-image-url" value="${cat?.image_url || ''}">
                    </div>
                    
                    <div class="form-col" style="justify-content: center; background: var(--bg-secondary); border-radius: 16px; padding: 1.5rem; border: 1px solid var(--border);">
                        <label class="toggle-switch">
                            <input type="checkbox" id="cat-active" ${cat ? (cat.is_active ? 'checked' : '') : 'checked'}>
                            <div class="toggle-box" style="margin-bottom: 0;"></div>
                            <span style="font-weight: 800; color: var(--text-main); font-size: 1.125rem;">Categoria Visível</span>
                        </label>
                        <p style="font-size: 0.925rem; color: var(--text-muted); margin-top: 0.75rem; font-weight: 600;">Status 'Inativa' oculta a categoria e todos seus produtos do site.</p>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 2rem;">
                    <button class="btn-dash-light" onclick="closeOrderModal()" style="flex: 1; padding: 1.1rem; font-weight: 800;">Cancelar</button>
                    <button class="btn-dash-light" id="btn-save-category" onclick="saveCategory('${catId || ''}')" style="flex: 2; background: var(--primary); color: #fff; border: none; padding: 1.1rem; font-weight: 950; font-size: 1.125rem; box-shadow: 0 10px 20px rgba(90, 87, 230, 0.25);">
                        Salvar Categoria
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();
        document.getElementById('order-modal-overlay').classList.add('active');
    };

    window.openProductModal = async (prodId = null, categorySlug) => {
        const prod = prodId ? state.products.find(p => p.id == prodId) : null;
        const modalBody = document.getElementById('modal-body-content');
        
        // Inicialização imediata (Abertura instantânea)
        let soldCount = 0;
        modalBody.dataset.soldCount = 0;

        modalBody.innerHTML = `
            <div class="modal-category-form">
                <div style="margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.8rem; font-weight: 950; color: var(--text-main); margin-bottom: 0.5rem; letter-spacing: -0.5px;">
                        ${prod ? 'Editar Produto' : 'Novo Produto'}
                    </h2>
                    <p style="color: var(--text-dim); font-size: 1.125rem; font-weight: 600;">Cadastre os detalhes do produto para venda.</p>
                </div>

                <div class="form-row">
                    <div class="form-col" style="flex: 2;">
                        <label>Nome do Produto</label>
                        <input type="text" id="prod-nome" value="${prod?.name || ''}" placeholder="Ex: Croissant de Manteiga">
                    </div>
                    <div class="form-col">
                        <label>Preço (R$)</label>
                        <input type="number" step="0.01" id="prod-price" value="${prod?.price || ''}" placeholder="0,00">
                    </div>
                </div>

                <div class="form-col">
                    <label>Descrição Complementar</label>
                    <textarea id="prod-description" rows="3" placeholder="Ex: Massa folhada artesanal com manteiga francesa, 24h de fermentação.">${prod?.description || ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-col">
                        <label>Foto do Produto</label>
                        <div id="prod-photo-zone" class="photo-upload-zone ${prod?.image_url ? 'has-image' : ''}" onclick="document.getElementById('prod-photo-input').click()">
                            <img id="prod-photo-preview" src="${prod?.image_url ? (prod.image_url.startsWith('http') ? prod.image_url : '/' + prod.image_url) : ''}">
                            <div class="upload-placeholder">
                                <i data-lucide="camera" style="width: 38px; height: 38px; stroke-width: 1.5px;"></i>
                                <p style="font-weight: 800; font-size: 1.025rem;">Escolher Foto</p>
                            </div>
                        </div>
                        <input type="file" id="prod-photo-input" style="display: none;" accept="image/*" onchange="handleAdminPhoto(this, 'prod-image-url', 'prod-photo-preview', 'prod-photo-zone', 'btn-save-product')">
                        <input type="hidden" id="prod-image-url" value="${prod?.image_url || ''}">
                    </div>
                    
                    <div class="form-col" style="background: var(--bg-secondary); border-radius: 16px; padding: 1.5rem; border: 1px solid var(--border); gap: 1rem;">
                        
                        <!-- ESTOQUE BASE -->
                        <div style="margin-bottom: 1.2rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 700; color: var(--text-main);">📦 Estoque Base (Fornada)</label>
                            <input type="number" id="prod-stock" value="${prod?.initial_stock ?? 0}" min="0" placeholder="Ex: 50" style="background: var(--card);" oninput="recalculateModalStock()">
                            <p style="font-size: 0.875rem; color: var(--text-dim); margin-top: 0.4rem;">Total produzido para venda nesta fornada.</p>
                        </div>

                        <!-- VENDAS E DISPONÍVEL -->
                        <div style="background: var(--bg); border-radius: 12px; padding: 1.25rem; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                <div>
                                    <div style="font-size: 0.775rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Disponível Agora</div>
                                    <div id="modal-stock-live" style="font-size: 1.8rem; font-weight: 950; color: var(--primary); font-family: 'Inter', sans-serif;">---</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="display: flex; align-items: center; gap: 6px; background: rgba(59, 130, 246, 0.08); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.1);">
                                        <div style="width: 6px; height: 6px; border-radius: 50%; background: #3b82f6;"></div>
                                        <span id="modal-sold-count-badge" style="font-size: 0.825rem; font-weight: 800; color: #3b82f6; text-transform: uppercase;">0 Vendidos</span>
                                    </div>
                                </div>
                            </div>
                            <div style="background: var(--bg-secondary); border-radius: 10px; height: 8px; overflow: hidden; margin-bottom: 0.75rem; border: 1px solid var(--border);">
                                <div id="modal-stock-progress" style="height: 100%; border-radius: 10px; background: var(--primary); width: 0%; transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s;"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <p id="modal-stock-hint" style="font-size: 0.825rem; color: var(--text-muted); font-weight: 600; margin: 0;">Calculado automaticamente com base na produção.</p>
                                <i data-lucide="info" style="width: 12px; height: 12px; color: var(--text-dim);"></i>
                            </div>
                        </div>

                        <label class="toggle-switch">
                            <input type="checkbox" id="prod-active" ${prod ? (prod.is_active ? 'checked' : '') : 'checked'}>
                            <div class="toggle-box" style="margin-bottom: 0;"></div>
                            <span style="font-weight: 800; color: var(--text-main); font-size: 1.125rem;">Produto Ativo</span>
                        </label>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 2rem;">
                    <button class="btn-dash-light" onclick="closeOrderModal()" style="flex: 1; padding: 1.1rem; font-weight: 800;">Cancelar</button>
                    <button class="btn-dash-light" id="btn-save-product" onclick="saveProduct('${prodId || ''}', '${categorySlug}')" style="flex: 2; background: var(--primary); color: #fff; border: none; padding: 1.1rem; font-weight: 950; font-size: 1.125rem; box-shadow: 0 10px 20px rgba(90, 87, 230, 0.25);">
                        Salvar Produto
                    </button>
                </div>
            </div>
        `;

        // Função de recalque interna
        window.recalculateModalStock = () => {
            const baseInput = document.getElementById('prod-stock');
            const liveEl = document.getElementById('modal-stock-live');
            const progressEl = document.getElementById('modal-stock-progress');
            const hintEl = document.getElementById('modal-stock-hint');
            const modalBody = document.getElementById('modal-body-content');
            
            if (!baseInput || !liveEl) return;
            
            const base = parseInt(baseInput.value) || 0;
            const sold = parseInt(modalBody.dataset.soldCount) || 0;
            
            let available = base - sold;
            if (available < 0) available = 0;
            
            liveEl.textContent = available;
            
            const pct = base > 0 ? (available / base) * 100 : 0;
            const color = available === 0 ? '#ef4444' : (available <= 2 ? '#f59e0b' : '#5a57e6');
            
            liveEl.style.color = color;
            if (progressEl) {
                progressEl.style.width = `${Math.min(100, pct)}%`;
                progressEl.style.background = color;
            }

            if (hintEl) {
                if (available === 0 && sold > 0) hintEl.textContent = '⛔ Esgotado pelo volume de vendas.';
                else if (available === 0 && base === 0) hintEl.textContent = '💡 Defina o estoque da fornada.';
                else hintEl.textContent = 'Saldo disponível para novas compras.';
            }
        };

        if (window.lucide) lucide.createIcons();
        document.getElementById('order-modal-overlay').classList.add('active');
        recalculateModalStock();

        // Busca dados pesados em segundo plano (Otimização de Performance)
        if (prodId) {
            fetch(`/api/admin/product-sold-count/${prodId}`, { headers: { 'Authorization': `Bearer ${state.token}` } })
                .then(r => r.json())
                .then(data => {
                    const sold = data.sold || 0;
                    modalBody.dataset.soldCount = sold;
                    
                    const soldBadge = document.getElementById('modal-sold-count-badge');
                    if (soldBadge) soldBadge.textContent = `${sold} Vendidos`;
                    
                    recalculateModalStock();
                })
                .catch(e => console.error('Erro ao buscar vendas:', e));
        }
    };

    window.handleAdminPhoto = async (input, urlHiddenId, previewImgId, zoneId, btnId) => {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        
        // Preview local
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById(previewImgId);
            preview.src = e.target.result;
            document.getElementById(zoneId).classList.add('has-image');
        };
        reader.readAsDataURL(file);

        // Upload real
        const formData = new FormData();
        formData.append('image', file);

        try {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-small"></span> Enviando...';
            }

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${state.token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById(urlHiddenId).value = data.url;
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            showToast('Erro ao enviar foto: ' + e.message);
        } finally {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Salvar Informações';
            }
        }
    };

    window.saveProduct = async (id = '', categorySlug) => {
        const baseStock = parseInt(document.getElementById('prod-stock').value) || 0;
        const soldCount = parseInt(document.getElementById('modal-body-content').dataset.soldCount) || 0;
        const oldProd = id ? state.products.find(p => p.id == id) : null;

        // Regra Central de Estoque: Disponível = Base - Vendidos
        let calculatedAvailable = baseStock - soldCount;
        if (calculatedAvailable < 0) calculatedAvailable = 0;

        const payload = {
            id: id || Math.random().toString(36).substr(2, 9),
            name: document.getElementById('prod-nome').value,
            category_slug: categorySlug,
            description: document.getElementById('prod-description').value,
            price: parseFloat(document.getElementById('prod-price').value),
            image_url: document.getElementById('prod-image-url').value,
            is_active: document.getElementById('prod-active').checked,
            initial_stock: baseStock,
            stock_quantity: calculatedAvailable,
            display_order: id ? parseInt(oldProd.display_order) : (state.products.filter(p => p.category_slug === categorySlug).length)
        };

        if (!payload.name || isNaN(payload.price)) {
            showToast('Nome e Preço são obrigatórios!');
            return;
        }

        try {
            const res = await fetch('/api/admin/save-product', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Produto salvo com sucesso!');
                closeOrderModal();
                // Recarrega configuração global
                const resp = await fetch('/api/admin/config', { headers: { 'Authorization': `Bearer ${state.token}` } });
                const config = await resp.json();
                state.categories = config.categorias;
                state.products = config.produtos;
                renderCategories();
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            showToast('Erro ao salvar produto: ' + e.message);
        }
    };

    window.deleteProduct = (id) => {
        const prod = state.products.find(p => p.id == id);
        if (!prod) return;
        
        showConfirm('Excluir Produto', `Tem certeza que deseja excluir "${prod.name}"?`, async () => {
            try {
                const res = await fetch('/api/admin/delete-item', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    },
                    body: JSON.stringify({ table: 'produtos', id })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Produto excluído!');
                    const resp = await fetch('/api/admin/config', { headers: { 'Authorization': `Bearer ${state.token}` } });
                    const config = await resp.json();
                    state.products = config.produtos;
                    renderCategories();
                } else {
                    throw new Error(data.error);
                }
            } catch (e) {
                showToast('Erro ao excluir: ' + e.message);
            }
        });
    };

    function setupProductsDND() {
        const container = document.getElementById('products-list-sortable');
        if (!container) return;

        let draggedProd = null;

        container.addEventListener('dragstart', (e) => {
            draggedProd = e.target.closest('.product-item-card');
            if (draggedProd) {
                draggedProd.classList.add('dragging');
                e.stopPropagation();
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        container.addEventListener('dragend', (e) => {
            if (draggedProd) {
                const slug = container.dataset.slug;
                draggedProd.classList.remove('dragging');
                saveNewProductOrder(slug);
            }
            draggedProd = null;
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const afterElement = getDragAfterElementNested(container, e.clientY);
            const draggable = document.querySelector('.product-item-card.dragging');
            if (draggable) {
                if (afterElement == null) {
                    container.appendChild(draggable);
                } else {
                    container.insertBefore(draggable, afterElement);
                }
            }
        });
    }

    function getDragAfterElementNested(container, y) {
        const draggableElements = [...container.querySelectorAll('.product-item-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    async function saveNewProductOrder(categorySlug) {
        const container = document.getElementById('products-list-sortable');
        if (!container) return;
        
        const items = [...container.querySelectorAll('.product-item-card')];
        const orders = items.map((item, idx) => ({
            id: item.dataset.prodId,
            display_order: idx
        }));

        try {
            const res = await fetch('/api/admin/update-products-order', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ orders })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            
            // Sincroniza estado local
            state.products = state.products.map(p => {
                const ord = orders.find(o => o.id == p.id);
                if (ord) return { ...p, display_order: ord.display_order };
                return p;
            });
            
            showToast('Ordem dos produtos salva!');
        } catch (e) {
            showToast('Erro ao salvar ordem: ' + e.message);
        }
    }

    window.generateCategorySlug = (text) => {
        const slugInput = document.getElementById('cat-slug');
        if (slugInput.dataset.manual === 'true') return;
        slugInput.value = text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };

    window.saveCategory = async (id = '') => {
        const payload = {
            id: id || Math.random().toString(36).substr(2, 9),
            title: document.getElementById('cat-title').value,
            slug: document.getElementById('cat-slug').value,
            description: document.getElementById('cat-description').value,
            image_url: document.getElementById('cat-image-url').value,
            is_active: document.getElementById('cat-active').checked,
            display_order: id ? parseInt(state.categories.find(c => c.id == id).display_order) : state.categories.length
        };

        if (!payload.title || !payload.slug) {
            showToast('Título e Slug são obrigatórios!');
            return;
        }

        try {
            const res = await fetch('/api/admin/save-category', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Categoria salva com sucesso!');
                closeOrderModal();
                const resp = await fetch('/api/admin/config', { headers: { 'Authorization': `Bearer ${state.token}` } });
                const config = await resp.json();
                state.categories = config.categorias;
                state.products = config.produtos;
                renderCategories();
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            showToast('Erro ao salvar: ' + e.message);
        }
    };

    window.deleteCategory = (id) => {
        const cat = state.categories.find(c => c.id == id);
        if (!cat) return;
        
        showConfirm('Confirmar Exclusão', `Tem certeza que deseja excluir a categoria "${cat.title}"? <br><br><small style="color:#ef4444; font-weight:700;">AVISO: Todos os produtos ligados a esta categoria deixarão de aparecer no site.</small>`, async () => {
            try {
                const res = await fetch('/api/admin/delete-item', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    },
                    body: JSON.stringify({ table: 'categorias', id })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Categoria excluída definitivamente!');
                    const resp = await fetch('/api/admin/config', { headers: { 'Authorization': `Bearer ${state.token}` } });
                    const config = await resp.json();
                    state.categories = config.categorias;
                    state.products = config.produtos;
                    renderCategories();
                } else {
                    throw new Error(data.error);
                }
            } catch (e) {
                showToast('Erro ao excluir: ' + e.message);
            }
        });
    };

    function setupCategoriesDND() {
        const list = document.getElementById('categories-sortable-list');
        if (!list || state.categories.length < 2) return;

        let draggedItem = null;

        list.addEventListener('dragstart', (e) => {
            draggedItem = e.target.closest('.category-item-card.slim');
            if (draggedItem) {
                draggedItem.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        list.addEventListener('dragend', (e) => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                saveNewCategoryOrder();
            }
            draggedItem = null;
        });

        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(list, e.clientX, e.clientY);
            const draggable = document.querySelector('.category-item-card.slim.dragging');
            if (draggable) {
                if (afterElement == null) {
                    list.appendChild(draggable);
                } else {
                    list.insertBefore(draggable, afterElement);
                }
            }
        });
    }

    function getDragAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.category-item-card.slim:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    async function saveNewCategoryOrder() {
        const items = [...document.querySelectorAll('.category-item-card.slim')];
        const orders = items.map((item, idx) => ({
            id: item.dataset.id,
            display_order: idx
        }));

        try {
            const res = await fetch('/api/admin/update-categories-order', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ orders })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            
            // Sincroniza estado local
            state.categories = state.categories.map(cat => {
                const ord = orders.find(o => o.id == cat.id);
                if (ord) return { ...cat, display_order: ord.display_order };
                return cat;
            }).sort((a,b) => a.display_order - b.display_order);
            
            showToast('Nova ordem salva com sucesso!');
        } catch (e) {
            showToast('Erro ao persistir ordem: ' + e.message);
        }
    }


// ─────────────────────────────────────────────────────────
// SSE REALTIME — Sincroniza estoque sem refresh no admin
// ─────────────────────────────────────────────────────────
function initAdminStockRealtime() {
    console.log('📡 [ADMIN REALTIME] Iniciando monitor de estoque...');
    try {
        const es = new EventSource('/api/stock-stream');

        es.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type !== 'stock_update') return;

            const { productId, newStock, updatedProduct } = data;
            console.log(`🔄 [ADMIN REALTIME] Produto ${productId} → estoque: ${newStock}`);

            // 1. Atualiza state local
            const prodIdx = state.products.findIndex(p => p.id === productId);
            if (prodIdx !== -1) {
                state.products[prodIdx].stock_quantity = newStock;
                if (updatedProduct) state.products[prodIdx] = { ...state.products[prodIdx], ...updatedProduct };
            }

            // 2. Atualiza o badge na linha do produto (se visível)
            const prodRow = document.querySelector(`.product-row[data-prod-id="${productId}"]`);
            if (prodRow) {
                const badge = prodRow.querySelector('.prod-stock-badge');
                if (badge) {
                    badge.textContent = newStock === 0 ? 'Esgotado' : `${newStock} un.`;
                    badge.style.color = newStock === 0 ? '#ef4444' : newStock <= 2 ? '#f59e0b' : 'var(--text-muted)';
                    badge.style.fontWeight = newStock <= 2 ? '800' : '600';
                }
            }

            // 3. Se o modal deste produto estiver aberto, sincroniza a contagem de vendas e recalcula
            const modalBody = document.getElementById('modal-body-content');
            const modalOverlay = document.getElementById('order-modal-overlay');
            if (modalBody && modalOverlay && modalOverlay.classList.contains('active')) {
                const saveBtn = document.getElementById('btn-save-product');
                // Verifica se o modal aberto é do produto que sofreu alteração
                if (saveBtn && saveBtn.getAttribute('onclick')?.includes(String(productId))) {
                    console.log('✨ [REALTIME] Atualizando modal do produto...');
                    
                    // Como não recebemos o soldCount direto no SSE (recebemos o estoque final), 
                    // podemos inferir o novo soldCount se soubermos o initial_stock atual no modal
                    const currentBaseInput = document.getElementById('prod-stock');
                    if (currentBaseInput) {
                        const base = parseInt(currentBaseInput.value) || 0;
                        const newSold = base - newStock;
                        modalBody.dataset.soldCount = Math.max(0, newSold);
                        if (typeof window.recalculateModalStock === 'function') {
                            window.recalculateModalStock();
                        }
                    }
                }
            }
        };

        es.onerror = function() { es.close(); setTimeout(initAdminStockRealtime, 5000); };
    } catch (err) {
        console.error('[ADMIN] Falha ao iniciar SSE:', err);
    }
}

// ─── INTELIGÊNCIA ────────────────────────────────────────────────────────────

function renderPainelPagamentos() {
    const adminMain = document.getElementById('admin-main');
    const mock = {
        total: 247, aprovados: 198, rejeitados: 31, pendentes: 12, estornados: 6,
        aprovadosValor: 18450.00, pendentesValor: 980.00, estornadosValor: 420.00,
        motivosRejeicao: [
            { motivo: 'Saldo insuficiente', qtd: 14, pct: 45 },
            { motivo: 'Cartão expirado',    qtd: 7,  pct: 23 },
            { motivo: 'Dados inválidos',    qtd: 5,  pct: 16 },
            { motivo: 'Limite excedido',    qtd: 3,  pct: 10 },
            { motivo: 'Outros',             qtd: 2,  pct: 6  },
        ]
    };
    const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';
    const fmtVal = v => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    adminMain.innerHTML = `
        <div style="padding:0 2.5rem;max-width:100%;">
            <div style="margin-bottom:2.5rem;">
                <p style="font-size:.875rem;color:var(--text-dim);margin-bottom:.4rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Inteligência</p>
                <h2 style="font-size:1.925rem;font-weight:800;color:var(--text-main);margin-bottom:.5rem;">Painel de Pagamentos</h2>
                <p style="font-size:1rem;color:var(--text-muted);font-weight:500;">Visão geral de aprovações, rejeições e estornos.</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-bottom:2rem;">
                <div style="background:var(--card);border:1px solid var(--border);border-left:3px solid #10b981;border-radius:16px;padding:1.5rem;">
                    <div style="font-size:.875rem;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.75rem;">Aprovados</div>
                    <div style="font-size:1.8rem;font-weight:900;color:var(--text-main);">${mock.aprovados}</div>
                    <div style="font-size:.875rem;color:var(--text-muted);margin-top:.25rem;">${pct(mock.aprovados, mock.total)}% do total — ${fmtVal(mock.aprovadosValor)}</div>
                </div>
                <div style="background:var(--card);border:1px solid var(--border);border-left:3px solid #f59e0b;border-radius:16px;padding:1.5rem;">
                    <div style="font-size:.875rem;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.75rem;">Pendentes</div>
                    <div style="font-size:1.8rem;font-weight:900;color:var(--text-main);">${mock.pendentes}</div>
                    <div style="font-size:.875rem;color:var(--text-muted);margin-top:.25rem;">${fmtVal(mock.pendentesValor)}</div>
                </div>
                <div style="background:var(--card);border:1px solid var(--border);border-left:3px solid #ef4444;border-radius:16px;padding:1.5rem;">
                    <div style="font-size:.875rem;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.75rem;">Rejeitados</div>
                    <div style="font-size:1.8rem;font-weight:900;color:var(--text-main);">${mock.rejeitados}</div>
                    <div style="font-size:.875rem;color:var(--text-muted);margin-top:.25rem;">${pct(mock.rejeitados, mock.total)}% do total</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem;margin-bottom:3rem;">
                <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;">
                    <div style="font-size:.875rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.75rem;">Total de transações</div>
                    <div style="font-size:1.8rem;font-weight:900;color:var(--text-main);">${mock.total}</div>
                </div>
                <div style="background:var(--card);border:1px solid var(--border);border-left:3px solid #8b5cf6;border-radius:16px;padding:1.5rem;">
                    <div style="font-size:.875rem;font-weight:700;color:#8b5cf6;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.75rem;">Estornados</div>
                    <div style="font-size:1.8rem;font-weight:900;color:var(--text-main);">${mock.estornados}</div>
                    <div style="font-size:.875rem;color:var(--text-muted);margin-top:.25rem;">${fmtVal(mock.estornadosValor)}</div>
                </div>
            </div>
            <div style="background:var(--card);border:1px solid var(--border);border-radius:24px;padding:2rem;margin-bottom:3rem;">
                <h3 style="font-size:.875rem;font-weight:900;color:var(--text-main);text-transform:uppercase;letter-spacing:1px;margin-bottom:1.5rem;">Motivos de Rejeição</h3>
                <div style="display:flex;flex-direction:column;gap:1rem;">
                    ${mock.motivosRejeicao.map(m => `
                        <div style="display:flex;align-items:center;gap:1rem;">
                            <div style="flex:1;min-width:0;">
                                <div style="display:flex;justify-content:space-between;margin-bottom:.35rem;">
                                    <span style="font-size:.925rem;font-weight:600;color:var(--text-main);">${m.motivo}</span>
                                    <span style="font-size:.925rem;font-weight:700;color:var(--text-muted);">${m.qtd} ocorrências</span>
                                </div>
                                <div style="height:6px;background:var(--border);border-radius:99px;overflow:hidden;">
                                    <div style="height:100%;width:${m.pct}%;background:#ef4444;border-radius:99px;"></div>
                                </div>
                            </div>
                            <div style="font-size:.875rem;font-weight:800;color:#ef4444;min-width:36px;text-align:right;">${m.pct}%</div>
                        </div>`).join('')}
                </div>
            </div>
        </div>`;
    if (window.lucide) lucide.createIcons();
}

function renderFunilVendas() {
    const adminMain = document.getElementById('admin-main');
    const mock = {
        visitantes: 1842, carrinhos: 423, checkouts: 285, pagamentos: 198,
        carrinhos_abandonados: 138, checkouts_abandonados: 87,
        carrinhos_recuperados: 21, checkouts_recuperados: 14,
        tempo_medio: '8m 32s',
        origens: [
            { metodo: 'PIX',               qtd: 134, pct: 68 },
            { metodo: 'Cartão de Crédito', qtd: 48,  pct: 24 },
            { metodo: 'Cartão de Débito',  qtd: 16,  pct: 8  },
        ]
    };
    const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';
    const funil = [
        { label: 'Visitantes',             val: mock.visitantes, icon: 'users',            cor: '#6366f1', width: 100 },
        { label: 'Carrinhos criados',      val: mock.carrinhos,  icon: 'shopping-cart',    cor: '#8b5cf6', width: 85  },
        { label: 'Checkouts iniciados',    val: mock.checkouts,  icon: 'clipboard-check',  cor: '#a78bfa', width: 70  },
        { label: 'Pagamentos concluídos',  val: mock.pagamentos, icon: 'check-circle',     cor: '#10b981', width: 55  },
    ];
    adminMain.innerHTML = `
        <div style="padding:0 2.5rem;max-width:100%;">
            <div style="margin-bottom:2.5rem;">
                <p style="font-size:.875rem;color:var(--text-dim);margin-bottom:.4rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Inteligência</p>
                <h2 style="font-size:1.925rem;font-weight:800;color:var(--text-main);margin-bottom:.5rem;">Funil de Vendas</h2>
                <p style="font-size:1rem;color:var(--text-muted);font-weight:500;">Onde os clientes entram — e onde saem.</p>
            </div>
            <div style="background:var(--card);border:1px solid var(--border);border-radius:24px;padding:2rem;margin-bottom:2.5rem;">
                <div style="display:flex;flex-direction:column;gap:.6rem;align-items:center;">
                    ${funil.map((step, i) => `
                        <div style="width:${step.width}%;background:${step.cor}18;border:1px solid ${step.cor}35;border-radius:12px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem;">
                            <div style="width:40px;height:40px;border-radius:10px;background:${step.cor}20;color:${step.cor};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <i data-lucide="${step.icon}" style="width:20px;height:20px;"></i>
                            </div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:.875rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;">${step.label}</div>
                                <div style="font-size:1.5rem;font-weight:900;color:var(--text-main);">${step.val.toLocaleString('pt-BR')}</div>
                            </div>
                            <div style="text-align:right;flex-shrink:0;">
                                <div style="font-size:1.1rem;font-weight:900;color:${step.cor};">${pct(step.val, mock.visitantes)}%</div>
                                <div style="font-size:.8rem;color:var(--text-muted);font-weight:600;">de conversão</div>
                            </div>
                        </div>
                        ${i < funil.length - 1 ? `<div style="color:var(--text-dim);font-size:1.2rem;line-height:1;">↓</div>` : ''}
                    `).join('')}
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2.5rem;">
                <div style="background:var(--card);border:1px solid var(--border);border-radius:24px;padding:2rem;">
                    <h3 style="font-size:.875rem;font-weight:900;color:var(--text-main);text-transform:uppercase;letter-spacing:1px;margin-bottom:1.5rem;">Abandono</h3>
                    <div style="display:flex;flex-direction:column;gap:1rem;">
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:#fef2f2;border-radius:12px;border:1px solid #fecaca;">
                            <div>
                                <div style="font-weight:700;color:#1e293b;">Carrinhos abandonados</div>
                                <div style="font-size:.8rem;color:#64748b;margin-top:2px;">${pct(mock.carrinhos_abandonados, mock.carrinhos)}% dos carrinhos</div>
                            </div>
                            <div style="font-size:1.5rem;font-weight:900;color:#ef4444;">${mock.carrinhos_abandonados}</div>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:#fef2f2;border-radius:12px;border:1px solid #fecaca;">
                            <div>
                                <div style="font-weight:700;color:#1e293b;">Checkouts abandonados</div>
                                <div style="font-size:.8rem;color:#64748b;margin-top:2px;">${pct(mock.checkouts_abandonados, mock.checkouts)}% dos checkouts</div>
                            </div>
                            <div style="font-size:1.5rem;font-weight:900;color:#ef4444;">${mock.checkouts_abandonados}</div>
                        </div>
                    </div>
                </div>
                <div style="background:var(--card);border:1px solid var(--border);border-radius:24px;padding:2rem;">
                    <h3 style="font-size:.875rem;font-weight:900;color:var(--text-main);text-transform:uppercase;letter-spacing:1px;margin-bottom:1.5rem;">Recuperação</h3>
                    <div style="display:flex;flex-direction:column;gap:1rem;">
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
                            <div>
                                <div style="font-weight:700;color:#1e293b;">Carrinhos recuperados</div>
                                <div style="font-size:.8rem;color:#64748b;margin-top:2px;">${pct(mock.carrinhos_recuperados, mock.carrinhos_abandonados)}% dos abandonados</div>
                            </div>
                            <div style="font-size:1.5rem;font-weight:900;color:#10b981;">${mock.carrinhos_recuperados}</div>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
                            <div>
                                <div style="font-weight:700;color:#1e293b;">Checkouts recuperados</div>
                                <div style="font-size:.8rem;color:#64748b;margin-top:2px;">${pct(mock.checkouts_recuperados, mock.checkouts_abandonados)}% dos abandonados</div>
                            </div>
                            <div style="font-size:1.5rem;font-weight:900;color:#10b981;">${mock.checkouts_recuperados}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;margin-bottom:3rem;">
                <div style="background:var(--card);border:1px solid var(--border);border-radius:24px;padding:2rem;">
                    <h3 style="font-size:.875rem;font-weight:900;color:var(--text-main);text-transform:uppercase;letter-spacing:1px;margin-bottom:1.5rem;">Origem do Pagamento</h3>
                    <div style="display:flex;flex-direction:column;gap:1rem;">
                        ${mock.origens.map(o => `
                            <div style="display:flex;align-items:center;gap:1rem;">
                                <div style="flex:1;min-width:0;">
                                    <div style="display:flex;justify-content:space-between;margin-bottom:.35rem;">
                                        <span style="font-size:.925rem;font-weight:600;color:var(--text-main);">${o.metodo}</span>
                                        <span style="font-size:.925rem;font-weight:700;color:var(--text-muted);">${o.qtd} pedidos</span>
                                    </div>
                                    <div style="height:6px;background:var(--border);border-radius:99px;overflow:hidden;">
                                        <div style="height:100%;width:${o.pct}%;background:var(--primary);border-radius:99px;"></div>
                                    </div>
                                </div>
                                <div style="font-size:.875rem;font-weight:800;color:var(--primary);min-width:36px;text-align:right;">${o.pct}%</div>
                            </div>`).join('')}
                    </div>
                </div>
                <div style="background:var(--card);border:1px solid var(--border);border-radius:24px;padding:2rem;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:.75rem;">
                    <div style="width:56px;height:56px;border-radius:16px;background:#ede9fe;color:#7c3aed;display:flex;align-items:center;justify-content:center;">
                        <i data-lucide="timer" style="width:28px;height:28px;"></i>
                    </div>
                    <div style="font-size:.875rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;">Tempo médio de conversão</div>
                    <div style="font-size:2rem;font-weight:900;color:var(--text-main);">${mock.tempo_medio}</div>
                    <div style="font-size:.8rem;color:var(--text-muted);">do carrinho ao pagamento</div>
                </div>
            </div>
        </div>`;
    if (window.lucide) lucide.createIcons();
}

function renderAlertas() {
    const adminMain = document.getElementById('admin-main');
    const alertas = [
        { nivel: 'critico',  titulo: 'Taxa de rejeição',         desc: '18% — acima do threshold de 10%',                   icon: 'x-circle',      cor: '#ef4444', bg: '#fef2f2', borda: '#fecaca' },
        { nivel: 'atencao',  titulo: 'Ticket médio',             desc: 'Queda de 12% na última semana',                     icon: 'trending-down', cor: '#f59e0b', bg: '#fffbeb', borda: '#fde68a' },
        { nivel: 'atencao',  titulo: 'Carrinhos abandonados',    desc: '32% de aumento nos últimos 3 dias',                  icon: 'shopping-cart', cor: '#f59e0b', bg: '#fffbeb', borda: '#fde68a' },
        { nivel: 'atencao',  titulo: 'Queda de visitas',         desc: '8% abaixo da média semanal esperada',               icon: 'users',         cor: '#f59e0b', bg: '#fffbeb', borda: '#fde68a' },
        { nivel: 'ok',       titulo: 'Taxa de aprovação',        desc: 'Acima de 80% — dentro do esperado',                 icon: 'check-circle',  cor: '#10b981', bg: '#f0fdf4', borda: '#bbf7d0' },
        { nivel: 'ok',       titulo: 'Taxa de conversão',        desc: 'Estável em 10.8% — dentro da meta',                 icon: 'activity',      cor: '#10b981', bg: '#f0fdf4', borda: '#bbf7d0' },
        { nivel: 'ok',       titulo: 'Perfil do comprador',      desc: 'Comportamento dentro do padrão histórico',           icon: 'user-check',    cor: '#10b981', bg: '#f0fdf4', borda: '#bbf7d0' },
    ];
    const criticos = alertas.filter(a => a.nivel === 'critico').length;
    const atencoes = alertas.filter(a => a.nivel === 'atencao').length;
    const oks      = alertas.filter(a => a.nivel === 'ok').length;
    const label    = { critico: 'Crítico', atencao: 'Atenção', ok: 'OK' };
    adminMain.innerHTML = `
        <div style="padding:0 2.5rem;max-width:100%;">
            <div style="margin-bottom:2.5rem;">
                <p style="font-size:.875rem;color:var(--text-dim);margin-bottom:.4rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Inteligência</p>
                <h2 style="font-size:1.925rem;font-weight:800;color:var(--text-main);margin-bottom:.5rem;">Alertas</h2>
                <p style="font-size:1rem;color:var(--text-muted);font-weight:500;">Indicadores que precisam da sua atenção.</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-bottom:3rem;">
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:16px;padding:1.5rem;text-align:center;">
                    <div style="font-size:2.5rem;font-weight:900;color:#ef4444;">${criticos}</div>
                    <div style="font-size:.875rem;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:.5px;margin-top:.25rem;">Críticos</div>
                </div>
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:1.5rem;text-align:center;">
                    <div style="font-size:2.5rem;font-weight:900;color:#f59e0b;">${atencoes}</div>
                    <div style="font-size:.875rem;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:.5px;margin-top:.25rem;">Atenção</div>
                </div>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:1.5rem;text-align:center;">
                    <div style="font-size:2.5rem;font-weight:900;color:#10b981;">${oks}</div>
                    <div style="font-size:.875rem;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:.5px;margin-top:.25rem;">OK</div>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:1rem;margin-bottom:3rem;">
                ${alertas.map(a => `
                    <div style="background:${a.bg};border:1px solid ${a.borda};border-radius:16px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1.25rem;">
                        <div style="width:44px;height:44px;border-radius:12px;background:${a.cor}20;color:${a.cor};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <i data-lucide="${a.icon}" style="width:22px;height:22px;"></i>
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:800;color:#1e293b;margin-bottom:.2rem;">${a.titulo}</div>
                            <div style="font-size:.9rem;color:#64748b;font-weight:500;">${a.desc}</div>
                        </div>
                        <div style="background:${a.cor};color:#fff;font-size:.75rem;font-weight:800;padding:.3rem .75rem;border-radius:99px;text-transform:uppercase;letter-spacing:.5px;flex-shrink:0;">
                            ${label[a.nivel]}
                        </div>
                    </div>`).join('')}
            </div>
        </div>`;
    if (window.lucide) lucide.createIcons();
}

function renderInsights() {
    const adminMain = document.getElementById('admin-main');
    const grupos = [
        {
            titulo: 'Pico de Visitas', icon: 'eye', cor: '#6366f1',
            itens: [
                'Sextas e sábados concentram 61% das visitas',
                'Horário de pico: 19h–21h (38% do tráfego diário)',
                'Segunda-feira tem queda média de 42% vs. fins de semana',
            ]
        },
        {
            titulo: 'Pico de Compras', icon: 'shopping-bag', cor: '#f59e0b',
            itens: [
                'Sábado é o dia com maior volume de pedidos (34%)',
                'Melhor horário para compras: 20h–22h',
                'Compras parceladas são mais frequentes às sextas',
            ]
        },
        {
            titulo: 'Conversão por Pagamento', icon: 'credit-card', cor: '#10b981',
            itens: [
                'PIX tem taxa de conclusão 23% maior que cartão',
                'Cartão de crédito gera tickets 18% maiores em média',
                'Débito tem menor taxa de abandono no checkout',
            ]
        },
        {
            titulo: 'Padrões de Compra', icon: 'lightbulb', cor: '#8b5cf6',
            itens: [
                '68% dos clientes repetem pedidos em 7–14 dias',
                'Clientes que compram no sábado têm LTV 31% maior',
                'Combos são adicionados ao carrinho em 44% dos pedidos',
            ]
        },
    ];
    adminMain.innerHTML = `
        <div style="padding:0 2.5rem;max-width:100%;">
            <div style="margin-bottom:2.5rem;">
                <p style="font-size:.875rem;color:var(--text-dim);margin-bottom:.4rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Inteligência</p>
                <h2 style="font-size:1.925rem;font-weight:800;color:var(--text-main);margin-bottom:.5rem;">Insights Automáticos</h2>
                <p style="font-size:1rem;color:var(--text-muted);font-weight:500;">Padrões identificados nos dados da sua padaria.</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem;margin-bottom:3rem;">
                ${grupos.map(g => `
                    <div style="background:var(--card);border:1px solid var(--border);border-radius:24px;padding:2rem;">
                        <div style="display:flex;align-items:center;gap:.875rem;margin-bottom:1.5rem;">
                            <div style="width:44px;height:44px;border-radius:12px;background:${g.cor}18;color:${g.cor};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <i data-lucide="${g.icon}" style="width:22px;height:22px;"></i>
                            </div>
                            <h3 style="font-size:1rem;font-weight:800;color:var(--text-main);margin:0;">${g.titulo}</h3>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:.75rem;">
                            ${g.itens.map(item => `
                                <div style="display:flex;align-items:flex-start;gap:.75rem;">
                                    <div style="width:6px;height:6px;border-radius:50%;background:${g.cor};margin-top:.45em;flex-shrink:0;"></div>
                                    <span style="font-size:.925rem;color:var(--text-muted);font-weight:500;line-height:1.5;">${item}</span>
                                </div>`).join('')}
                        </div>
                    </div>`).join('')}
            </div>
        </div>`;
    if (window.lucide) lucide.createIcons();
}

// ─────────────────────────────────────────────────────────────────────────────

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initAdminStockRealtime();
} else {
    document.addEventListener('DOMContentLoaded', initAdminStockRealtime);
}
