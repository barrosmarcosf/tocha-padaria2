const express = require('express');
const router = express.Router();
const { adminAuth, authorize, bcrypt, jwt, JWT_SECRET, SESSION_VERSION, secLog } = require('../middleware/auth');
const { generateCsrfToken, csrfProtection } = require('../middleware/csrf');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDashboardMetrics, getDateRange, fetchPaidOrders, buildCostMap, calcAggregates, getBRDate, buildTimeSeries } = require('../services/dashboardMetrics');

const { sendWhatsAppMessage } = require('../notification-service');
const { getUnifiedProductList } = require('../services/stockService');

// Rate limiting simples em memória para o login (máx 10 tentativas / 15 min por IP)
const loginAttempts = new Map();
function rateLimitLogin(req, res, next) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
    const now = Date.now();
    const window = 15 * 60 * 1000;
    const max = 10;
    const rec = loginAttempts.get(ip);
    if (!rec || now - rec.first > window) {
        loginAttempts.set(ip, { count: 1, first: now });
        return next();
    }
    if (rec.count >= max) {
        return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' });
    }
    rec.count++;
    next();
}
setInterval(() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    loginAttempts.forEach((rec, ip) => { if (rec.first < cutoff) loginAttempts.delete(ip); });
}, 10 * 60 * 1000);

module.exports = function (supabase) {

    // Proteção CSRF em todas as rotas POST/PUT/DELETE (exceto /login)
    router.use(csrfProtection(JWT_SECRET));

    // Retorna token CSRF para a sessão atual
    router.get('/csrf-token', (req, res) => {
        const token = generateCsrfToken(req.session_id, JWT_SECRET);
        res.json({ token });
    });

    // Rota de Login
    router.post('/login', rateLimitLogin, async (req, res) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
        const ts = new Date().toISOString();
        try {
            const { email, password } = req.body;

            const { data: user, error } = await supabase.from('usuarios').select('*').eq('email', email).maybeSingle();
            if (error) console.error(">>> [AUTH] Supabase error:", error);

            let authenticated = false;
            let userData = null;

            if (user) {
                const validPass = await bcrypt.compare(password, user.senha);
                if (validPass) {
                    authenticated = true;
                    userData = { id: user.id, nome: user.nome, email: user.email, role: user.role };
                }
            }

            // Fallback para credenciais do .env
            if (!authenticated && email === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
                authenticated = true;
                userData = { id: 0, nome: 'Administrador', email: process.env.ADMIN_USER, role: 'admin' };
            }

            if (!authenticated) {
                console.warn(`[SECURITY] ${ts} | LOGIN_FALHA | IP: ${ip} | Email: ${email}`);
                return res.status(401).json({ error: 'Credenciais inválidas!' });
            }

            if (user && user.id) {
                await supabase.from('usuarios').update({ ultimo_login: new Date().toISOString() }).eq('id', user.id);
            }

            const token = jwt.sign({ ...userData, sv: SESSION_VERSION }, JWT_SECRET, { expiresIn: '8h' });
            console.log(`[SECURITY] ${ts} | LOGIN_SUCESSO | IP: ${ip} | Email: ${email}`);
            res.json({ success: true, token, user: userData });

        } catch (e) {
            console.error("Erro no login:", e);
            res.status(500).json({ error: "Erro interno no servidor." });
        }
    });

    // Rota para verificar status do Bot
    router.get('/bot-status', adminAuth, async (req, res) => {
        const { botStatus } = require('../notification-service');
        res.json({ ready: botStatus === 'READY', status: botStatus });
    });

    // Rota para reiniciar o Bot
    router.post('/restart-bot', adminAuth, async (req, res) => {
        const { restartBot } = require('../notification-service');
        const result = await restartBot();
        if (result.success) res.json(result);
        else res.status(500).json(result);
    });

    // Rota para envio em massa
    router.post('/send-bulk-message', adminAuth, async (req, res) => {
        try {
            const { recipients, message } = req.body; // recipients: [{phone, name}]
            
            if (!recipients || !Array.isArray(recipients)) throw new Error("Lista de destinatários inválida.");
            
            const results = { success: 0, fail: 0, errors: [] };
            
            // Processa em sequência com pequeno delay para evitar detecção de bot/flood
            for (const person of recipients) {
                try {
                    const personalized = message.replace(/{nome}/g, person.name || 'Cliente');
                    await sendWhatsAppMessage(person.phone, personalized);
                    results.success++;
                    
                    // Delay aleatório entre 2 e 5 segundos
                    const delay = Math.floor(Math.random() * 3000) + 2000;
                    await new Promise(r => setTimeout(r, delay));
                } catch (err) {
                    results.fail++;
                    results.errors.push({ phone: person.phone, name: person.name, error: err.message });
                }
            }
            
            res.json(results);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
    const PAID_STATUSES = ['paid', 'pago', 'concluido', 'concluído', 'finalizado', 'success', 'succeeded', 'completed', 'finalizado', 'entregue', 'delivered'];

    // Formatadores manuais seguros contra locale do SO
    const fmtDay = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const fmtHour = (d) => `${d.getHours().toString().padStart(2, '0')}h`;

    const getPaymentCategory = (method) => {
        const m = (method || '').toLowerCase().trim();
        if (m === 'pix' || m.includes('pix')) return 'pix';
        if (m.includes('credito') || m.includes('crédito') || m.includes('credit') || m.includes('card') || m.includes('cartao_credito') || m.includes('visa') || m.includes('master') || m.includes('amex') || m.includes('elo') || m.includes('hipercard') || m.includes('card_credit') || m.includes('stripe')) return 'credito';
        if (m.includes('debito') || m.includes('débito') || m.includes('debit') || m.includes('cartao_debito') || m.includes('card_debit')) return 'debito';
        return 'outros';
    };

    // GET /stats - KPIs principais com variação
    router.get('/stats', adminAuth, async (req, res) => {
        try {
            const { period = 'today', from, to, tzOffset = 180 } = req.query;
            const metrics = await getDashboardMetrics(supabase, { period, from, to, tzOffset: Number(tzOffset) });
            res.json({
                ...metrics,
                revenue: metrics.faturamento,
                totalRevenue: metrics.faturamento,
                ordersCount: metrics.pedidos,
                totalOrders: metrics.pedidos,
                averageTicket: metrics.ticketMedio,
                avgTicket: metrics.ticketMedio,
                profit: metrics.lucro,
                revenueVar: metrics.variacao.faturamento,
                ordersVar: metrics.variacao.pedidos,
                ticketVar: metrics.variacao.ticketMedio,
                profitVar: metrics.variacao.lucro
            });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // GET /chart-data - dados para o gráfico principal (não acumulado)
    router.get('/chart-data', adminAuth, async (req, res) => {
        try {
            const { period = 'today', from, to, tzOffset = 180 } = req.query;
            const metrics = await getDashboardMetrics(supabase, { period, from, to, tzOffset: Number(tzOffset) });
            res.json({
                labels: metrics.serieTemporal.map(s => s.data),
                revenue: metrics.serieTemporal.map(s => s.faturamento),
                orders: metrics.serieTemporal.map(s => s.pedidos),
                averages: metrics.serieTemporal.map(s => s.ticketMedio),
                profit: metrics.serieTemporal.map(s => s.lucro)
            });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // GET /historical-monthly-metrics - Dados agregados mês a mês (12 meses)
    router.get('/historical-monthly-metrics', adminAuth, async (req, res) => {
        try {
            const { buildCostMap, fetchPaidOrders, calcAggregates, getBRDate } = require('../services/dashboardMetrics');
            
            // Período: Últimos 12 meses (do primeiro dia de 11 meses atrás até hoje)
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            const [paid, costMap] = await Promise.all([
                fetchPaidOrders(supabase, start, end),
                buildCostMap(supabase)
            ]);

            const monthlyData = {};
            // Inicializa todos os 12 meses para evitar buracos no gráfico
            const monthsNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            for (let i = 0; i < 12; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
                const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                monthlyData[key] = { 
                    revenue: 0, 
                    orders: 0, 
                    profit: 0, 
                    label: `${monthsNames[d.getMonth()]}/${d.getFullYear()}`,
                    idx: i 
                };
            }

            paid.forEach(o => {
                const br = getBRDate(new Date(o.created_at));
                const key = `${br.year}-${br.month.toString().padStart(2, '0')}`;
                if (monthlyData[key]) {
                    const stats = calcAggregates([o], costMap);
                    monthlyData[key].revenue += stats.faturamento;
                    monthlyData[key].orders += stats.pedidos;
                    monthlyData[key].profit += stats.lucro;
                }
            });

            // Converte para array ordenado cronologicamente
            const series = Object.keys(monthlyData).sort().map(k => ({
                key: k,
                ...monthlyData[k]
            }));

            // Calcula variações vs mês anterior
            series.forEach((m, i) => {
                if (i === 0) {
                    m.revenueVar = 0; m.ordersVar = 0; m.profitVar = 0;
                } else {
                    const prev = series[i-1];
                    const pct = (c, p) => p === 0 ? 0 : ((c - p) / p) * 100;
                    m.revenueVar = pct(m.revenue, prev.revenue);
                    m.ordersVar = pct(m.orders, prev.orders);
                    m.profitVar = pct(m.profit, prev.profit);
                }
            });

            res.json(series);
        } catch (e) { 
            console.error("Erro em historical-monthly-metrics:", e);
            res.status(500).json({ error: e.message }); 
        }
    });

    router.get('/cumulative-chart', adminAuth, async (req, res) => {
        try {
            const { period = 'today', from, to, tzOffset = 180, metric = 'revenue' } = req.query;
            const { start, end, prevStart, prevEnd } = getDateRange(period, from, to, Number(tzOffset));
            
            const costMap = await buildCostMap(supabase);
            
            const fetchAccSeries = async (s, e) => {
                const orders = await fetchPaidOrders(supabase, s, e);
                const serie = buildTimeSeries(orders, costMap, s, e, Number(tzOffset));
                
                let acc = 0;
                const values = [];
                const br = getBRDate(new Date());
                const currentHour = br.hours;
                const currentDay = br.day;

                const isHourly = ['today', 'yesterday'].includes(period);

                serie.forEach(item => {
                    const labelStr = item.data.replace('h', '');
                    const labelNum = parseInt(labelStr);
                    
                    let isFuture = false;
                    // Se o período é hoje, ocultar horas futuras
                    if (period === 'today') {
                        if (isHourly && labelNum > currentHour) isFuture = true;
                        if (!isHourly && labelNum > currentDay) isFuture = true;
                    }

                    if (isFuture) {
                        values.push(null);
                    } else {
                        // Mapear métrica
                        let val = 0;
                        if (metric === 'revenue' || metric === 'averages') val = item.faturamento;
                        else if (metric === 'orders') val = item.pedidos;
                        else if (metric === 'lucro') val = item.lucro;
                        
                        acc += val;
                        values.push(acc);
                    }
                });

                return { labels: serie.map(i => i.data), values };
            };

            const [current, previous] = await Promise.all([
                fetchAccSeries(start, end),
                fetchAccSeries(prevStart, prevEnd)
            ]);

            res.json({ labels: current.labels, current: current.values, previous: previous.values });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.get('/detailed-analytics', adminAuth, async (req, res) => {
        try {
            const { period = 'today', from, to, tzOffset = 0 } = req.query;
            const { start, end } = getDateRange(period, from, to, Number(tzOffset));
            const PAID_AND_FINISHED = ['paid', 'pago', 'concluido', 'concluído', 'finalizado', 'entregue', 'delivered', 'aceito', 'preparo', 'retirada'];

            // Busca dados em paralelo para performance máxima
            const [paid, { data: produtos }, { data: categorias }, costMap, { data: configRow }] = await Promise.all([
                fetchPaidOrders(supabase, start, end),
                supabase.from('produtos').select('name, category_slug'),
                supabase.from('categorias').select('slug, name'),
                buildCostMap(supabase),
                supabase.from('site_content').select('value').eq('key', 'opening_hours').maybeSingle()
            ]);

            const config = configRow?.value || {};
            const currentBakeDate = config.currentBatch?.bakeDate;
            const nextBakeDate = config.nextBatch?.bakeDate;

            const MARGIN_COST = 0.40; // custo padrão se não houver no mapa
            const catMap = {}; (categorias || []).forEach(c => catMap[c.slug] = c.name);
            const prodCatMap = {}; (produtos || []).forEach(p => prodCatMap[p.name] = catMap[p.category_slug] || 'Padaria');
            
            const prodCounts = {};
            const optCounts = {};
            const paymentBreakdown = { 
                credito: {count:0, revenue:0}, 
                debito: {count:0, revenue:0}, 
                pix: {count:0, revenue:0}, 
                outros: {count:0, revenue:0} 
            };
            const hourly = Array(24).fill(0);
            const dailyBreakdown = {}; // Novo objeto para o calendário
            let revenue = 0;

            paid.forEach(o => {
                const totalAmount = Number(o.total_amount || 0); 
                revenue += totalAmount;
                
                // Identificadores de data precisos para o calendário (Brasília UTC-3)
                const dtBR = new Date(new Date(o.created_at).getTime() - (3 * 60 * 60 * 1000));
                const dayKey = dtBR.getUTCDate();
                const monthKey = dtBR.getUTCMonth();
                const yearKey = dtBR.getUTCFullYear();
                const calendarKey = `${yearKey}-${monthKey + 1}-${dayKey}`;

                if (!dailyBreakdown[calendarKey]) {
                    dailyBreakdown[calendarKey] = { revenue: 0, orders: 0, day: dayKey, orderList: [] };
                }
                dailyBreakdown[calendarKey].revenue += totalAmount;
                dailyBreakdown[calendarKey].orders += 1;

                // Parse robusto dos itens para processamento de metadados e produtos
                let orderItems = o.items;
                if (typeof orderItems === 'string') {
                    try { orderItems = JSON.parse(orderItems); } catch(e) { orderItems = []; }
                }

                // Identificação da Fornada para Planejamento de Produção (Lógica de Extração Profunda)
                let orderBakeDate = null;
                if (orderItems) {
                    // 1. Tenta raiz do objeto (formato novo)
                    orderBakeDate = orderItems.batch_date || orderItems.fornada_date;
                    
                    // 2. Tenta dentro do array se for formato legado ou contiver actual_items
                    const itemsArr = Array.isArray(orderItems) ? orderItems : (orderItems.actual_items || []);
                    if (!orderBakeDate && itemsArr.length > 0) {
                        orderBakeDate = itemsArr[0].batch_date || itemsArr[0].fornada_date || itemsArr[0].pickup_date;
                    }
                }

                // 3. Fallback para colunas diretas do banco (colunas auxiliares)
                if (!orderBakeDate) {
                    orderBakeDate = o.scheduled_at || o.fornada_date || o.production_date;
                }

                // Limpeza final para garantir formato YYYY-MM-DD para o frontend
                if (orderBakeDate && typeof orderBakeDate === 'string') {
                    orderBakeDate = orderBakeDate.split('T')[0];
                }

                dailyBreakdown[calendarKey].orderList.push({
                    customer: o.customer_name || o.clientes?.name || 'Cliente',
                    orderNumber: o.id?.toString().slice(-5) || '0000', // Pega os últimos 5 dígitos para manter o padrão #XXXXX
                    value: totalAmount,
                    time: dtBR.getUTCHours().toString().padStart(2, '0') + ':' + dtBR.getUTCMinutes().toString().padStart(2, '0'),
                    bakeDate: orderBakeDate
                });

                // Suporte ao novo formato de metadados embutidos nos itens para economizar colunas no DB
                const paymentMethodFromItems = orderItems?.payment_method;
                const finalItems = Array.isArray(orderItems) ? orderItems : (orderItems?.actual_items || []);

                // Processamento de Canais de Pagamento
                let finalCat = 'outros';
                let rawMethod = (o.payment_method || o.metodo_pagamento || paymentMethodFromItems || '').toLowerCase();
                
                if (rawMethod.includes('pix')) {
                    finalCat = 'pix';
                } else if (rawMethod.includes('credito') || rawMethod.includes('credit') || rawMethod.includes('card') || rawMethod.includes('stripe')) {
                    finalCat = 'credito';
                } else if (rawMethod.includes('debito') || rawMethod.includes('debit')) {
                    finalCat = 'debito';
                } else if (o.stripe_session_id || o.session_id) {
                    finalCat = 'credito'; // Fallback absoluto para Stripe
                }

                if (paymentBreakdown[finalCat]) {
                    paymentBreakdown[finalCat].revenue += totalAmount;
                    paymentBreakdown[finalCat].count += 1;
                } else {
                    paymentBreakdown.outros.revenue += totalAmount;
                    paymentBreakdown.outros.count += 1;
                }
                
                // Processamento de Itens do Pedido
                if (Array.isArray(finalItems)) {
                    finalItems.forEach(item => {
                        if (!item.name) return;
                        
                        const q = Number(item.qty) || Number(item.quantity) || 1;
                        const price = Number(item.price || 0);
                        const unitCost = costMap[item.name] ?? (price * MARGIN_COST);
                        const gross = price * q;
                        const net = (price - unitCost) * q;

                        if (!prodCounts[item.name]) {
                            prodCounts[item.name] = { 
                                name: item.name, 
                                category: prodCatMap[item.name] || item.category || 'Padaria',
                                qty: 0, 
                                qtyAtual: 0,
                                qtyProxima: 0,
                                revenue: 0, 
                                profit: 0 
                            };
                        }
                        
                        prodCounts[item.name].qty += q;
                        prodCounts[item.name].revenue += gross;
                        prodCounts[item.name].profit += net;

                        // Incremento segregado por fornada
                        if (orderBakeDate === currentBakeDate) {
                            prodCounts[item.name].qtyAtual += q;
                        } else if (orderBakeDate === nextBakeDate) {
                            prodCounts[item.name].qtyProxima += q;
                        } else {
                            // Se não bater com nenhuma das janelas configuradas (pedidos antigos no histórico),
                            // assume-se como 'Atual' se for dentro do período do filtro, ou podemos deixar em 0
                            // Para o resumo de produção, geralmente interessam os pedidos ativos.
                            prodCounts[item.name].qtyAtual += q;
                        }

                        // Adicionais / Opcionais
                        (item.addons || []).forEach(opt => {
                            if (!opt.name) return;
                            const optQ = q; // Adicional segue a quantidade do item pai
                            const optPrice = Number(opt.price || 0);
                            const optCost = optPrice * MARGIN_COST; // Opcionais seguem margem padrão
                            
                            if (!optCounts[opt.name]) {
                                optCounts[opt.name] = { 
                                    name: opt.name, 
                                    qty: 0, 
                                    revenue: 0, 
                                    profit: 0,
                                    group: 'Opcionais' 
                                };
                            }
                            optCounts[opt.name].qty += optQ; 
                            optCounts[opt.name].revenue += (optPrice * optQ);
                            optCounts[opt.name].profit += (optPrice - optCost) * optQ;
                        });
                    });
                }
                // Extração precisa da hora em Brasília (UTC-3) determinística
                const hr = dtBR.getUTCHours();
                if (hr >= 0 && hr < 24) hourly[hr]++;
            });

            // Ordenação por quantidade vendida (Top 100)
            const itemRanking = Object.values(prodCounts)
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 100);

            const optRanking = Object.values(optCounts)
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 100);

            res.json({
                VERSION: 'FIX_V7_CALENDAR_DATA',
                metrics: { revenue, ticket: paid.length > 0 ? revenue / paid.length : 0, totalOrders: paid.length },
                summaries: { topProduct: itemRanking[0]?.name || 'Sem informação', bestPeriod: `${hourly.indexOf(Math.max(...hourly))}h` },
                itemPerformance: { products: itemRanking, optionals: optRanking },
                production: { currentBakeDate, nextBakeDate },
                hourly, 
                dailyBreakdown,
                paymentBreakdown,
                debug_audit: res.debug_orders || []
            });
        } catch (e) {
            console.error("[DetailedAnalytics] Error:", e);
            res.status(500).json({ error: e.message });
        }
    });

    router.get('/config', adminAuth, async (req, res) => {
        try {
            const { data: categorias } = await supabase.from('categorias').select('*').order('display_order', { ascending: true });
            const { data: produtosRaw } = await supabase.from('produtos').select('*').order('display_order', { ascending: true });
            const { data: content } = await supabase.from('site_content').select('*');

            const siteContent = {};
            (content || []).forEach(c => siteContent[c.key] = c.value);

            // APLICA LÓGICA UNIFICADA DE ESTOQUE (FONTE ÚNICA DE VERDADE)
            const produtos = await getUnifiedProductList(supabase, produtosRaw);

            res.json({ categorias, produtos, siteContent });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/save-category', adminAuth, async (req, res) => {
        try {
            const { error } = await supabase.from('categorias').upsert([req.body], { onConflict: 'slug' });
            if (error) throw error;
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/update-categories-order', adminAuth, async (req, res) => {
        try {
            const { orders } = req.body; // Array de { id, display_order }
            if (!orders || !Array.isArray(orders)) throw new Error("Dados inválidos.");
            
            // Faz o update individual para cada item para evitar violação de NOT NULL em campos como 'slug'
            for (const item of orders) {
                const { error } = await supabase
                    .from('categorias')
                    .update({ display_order: item.display_order })
                    .eq('id', item.id);
                
                if (error) throw error;
            }

            res.json({ success: true });
        } catch (e) { 
            console.error("Erro ao atualizar ordem das categorias:", e.message);
            res.status(500).json({ error: e.message }); 
        }
    });
    router.post('/update-products-order', adminAuth, async (req, res) => {
        try {
            const { orders } = req.body; // Array de { id, display_order }
            if (!orders || !Array.isArray(orders)) throw new Error("Dados inválidos.");
            
            for (const item of orders) {
                const { error } = await supabase
                    .from('produtos')
                    .update({ display_order: item.display_order })
                    .eq('id', item.id);
                
                if (error) throw error;
            }

            res.json({ success: true });
        } catch (e) { 
            console.error("Erro ao atualizar ordem dos produtos:", e.message);
            res.status(500).json({ error: e.message }); 
        }
    });

    router.get('/product-sold-count/:id', adminAuth, async (req, res) => {
        try {
            const productId = req.params.id;
            
            // 1. Pega data da fornada atual
            const { data: configRow } = await supabase.from('site_content').select('value').eq('key', 'opening_hours').maybeSingle();
            const config = configRow?.value || {};
            const currentBakeDate = config.currentBatch?.bakeDate;
            
            if (!currentBakeDate) return res.json({ sold: 0 });

            // 2. Tenta buscar da tabela de ciclos (Nova modelagem)
            const { data: fornada } = await supabase.from('fornadas').select('id').eq('bake_date', currentBakeDate).maybeSingle();
            if (fornada) {
                const { data: cycle } = await supabase.from('produto_estoque_fornada')
                    .select('vendas_confirmadas')
                    .eq('produto_id', productId)
                    .eq('fornada_id', fornada.id)
                    .maybeSingle();
                
                if (cycle) return res.json({ sold: cycle.vendas_confirmadas || 0 });
            }

            // 3. Fallback: Busca pedidos pagos se a tabela de ciclos não estiver populada
            const PAID_AND_FINISHED = ['paid', 'pago', 'concluido', 'concluído', 'finalizado', 'entregue', 'delivered', 'aceito', 'preparo', 'retirada'];
            const { data: orders, error } = await supabase
                .from('pedidos')
                .select('items')
                .in('status', PAID_AND_FINISHED);

            if (error) throw error;

            let totalSold = 0;
            orders.forEach(o => {
                let items = o.items;
                if (typeof items === 'string') { try { items = JSON.parse(items); } catch(e) { return; } }
                if ((items?.batch_date || items?.fornada_date) === currentBakeDate) {
                    const actualItems = Array.isArray(items) ? items : (items.actual_items || []);
                    actualItems.forEach(item => {
                        if (String(item.id) === String(productId)) totalSold += (Number(item.qty) || 1);
                    });
                }
            });

            res.json({ sold: totalSold });
        } catch (e) {
            console.error("Erro ao buscar contagem de vendas:", e.message);
            res.status(500).json({ error: e.message });
        }
    });

    router.post('/save-product', adminAuth, async (req, res) => {
        try {
            const DESIRED_COLS = ['id', 'category_slug', 'name', 'description', 'price', 'image_url', 'is_active', 'is_grouped', 'variants', 'display_order', 'stock_quantity', 'initial_stock'];
            const payload = {};
            for (const col of DESIRED_COLS) {
                if (req.body[col] !== undefined) payload[col] = req.body[col];
            }

            if (payload.id) payload.id = String(payload.id);

            // 1. Salva dados básicos do produto
            // Tenta upsert completo. Se falhar (ex: coluna initial_stock não existe), tenta sem ela.
            const { error: upsertError } = await supabase.from('produtos').upsert([payload]);
            if (upsertError) {
                console.warn("⚠️ Upsert completo falhou (provavelmente falta de coluna). Tentando fallback...");
                delete payload.initial_stock;
                const { error: fallbackError } = await supabase.from('produtos').upsert([payload]);
                if (fallbackError) throw fallbackError;
            }

            // 2. LÓGICA DE ESTOQUE POR FORNADA DEFINITIVA
            const initial_stock = req.body.initial_stock;
            if (initial_stock !== undefined) {
                 // Identifica fornada atual
                 const { data: configRow } = await supabase.from('site_content').select('value').eq('key', 'opening_hours').maybeSingle();
                 const config = configRow?.value || {};
                 const currentBakeDate = config.currentBatch?.bakeDate;
                 const currentLabel = config.currentBatch?.bakeDate ? `Fornada ${config.currentBatch.bakeDate}` : 'Fornada Atual';

                 if (currentBakeDate) {
                     // 2.1 Garante que a fornada existe na tabela 'fornadas'
                     const { data: fornada, error: fErr } = await supabase
                         .from('fornadas')
                         .upsert([{ bake_date: currentBakeDate, label: currentLabel }], { onConflict: 'bake_date' })
                         .select()
                         .single();
                     
                     if (fErr) {
                         console.warn("⚠️ Falha ao garantir fornada no DB:", fErr.message);
                     } else {
                         // 2.2 Calcula vendas já realizadas para este produto NESTA fornada específica
                         const { data: orders } = await supabase.from('pedidos').select('items').neq('status', 'pending');
                         let sold = 0;
                         orders?.forEach(o => {
                             let items = o.items;
                             if (typeof items === 'string') try { items = JSON.parse(items); } catch(e) { return; }
                             if ((items?.batch_date || items?.fornada_date) === currentBakeDate) {
                                 const arr = Array.isArray(items) ? items : (items.actual_items || []);
                                 arr.forEach(i => { if (String(i.id) === payload.id) sold += (Number(i.qty) || 1); });
                             }
                         });

                         const available = Math.max(0, parseInt(initial_stock) - sold);

                         // 2.3 Persiste o estoque do ciclo
                         const { error: cycleErr } = await supabase.from('produto_estoque_fornada').upsert([{
                             produto_id: payload.id,
                             fornada_id: fornada.id,
                             estoque_base: parseInt(initial_stock),
                             estoque_disponivel: available,
                             vendas_confirmadas: sold
                         }], { onConflict: 'produto_id, fornada_id' });

                         if (cycleErr) console.warn("⚠️ Falha ao salvar em produto_estoque_fornada:", cycleErr.message);
                         else console.log(`✅ [ESTOQUE] Ciclo ${currentBakeDate} salvo p/ ${payload.name}: Base=${initial_stock}, Disp=${available}`);
                     }
                 }
            }

            res.json({ success: true });
        } catch (e) { 
            console.error("❌ Erro ao salvar produto:", e.message);
            res.status(500).json({ error: e.message }); 
        }
    });

    router.post('/save-content', adminAuth, async (req, res) => {
        try {
            const { key, value } = req.body;
            const { error } = await supabase.from('site_content').upsert([{ key, value, updated_at: new Date().toISOString() }]);
            if (error) throw error;
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    const ALLOWED_TABLES = ['categorias', 'produtos', 'site_content', 'grupos_opcionais', 'opcionais', 'clientes'];
    router.post('/delete-item', adminAuth, async (req, res) => {
        try {
            const { table, id } = req.body;
            if (!ALLOWED_TABLES.includes(table)) return res.status(403).json({ error: `Operação não permitida na tabela '${table}'.` });
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.get('/pedidos/historico', adminAuth, async (req, res) => {
        try {
            const { start, end, includeRejected, page = 1, limit = 50 } = req.query;
            let query = supabase.from('pedidos').select('*, clientes(*)', { count: 'exact' });

            if (start) query = query.gte('created_at', start);
            if (end) query = query.lte('created_at', end);

            const PAID_AND_FINISHED = ['paid', 'pago', 'concluido', 'concluído', 'finalizado', 'entregue', 'delivered', 'aceito', 'preparo', 'retirada'];

            if (includeRejected !== 'true') {
                query = query.in('status', PAID_AND_FINISHED);
            } else {
                query = query.neq('status', 'pending');
            }

            const from = (Number(page) - 1) * Number(limit);
            const to = from + Number(limit) - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Estatísticas do período
            let statsQuery = supabase.from('pedidos').select('total_amount, status, items');
            if (start) statsQuery = statsQuery.gte('created_at', start);
            if (end) statsQuery = statsQuery.lte('created_at', end);
            const { data: allPeriod } = await statsQuery.neq('status', 'pending');
            
            const stats = {
                totalRevenue: 0,
                totalOrders: 0,
                avgTicket: 0,
                taxTotal: 0,
                discountTotal: 0,
                profit: 0
            };

            if (allPeriod) {
                const effective = allPeriod.filter(o => PAID_AND_FINISHED.includes((o.status || '').toLowerCase()));
                const costMap = await buildCostMap(supabase);
                const aggregated = calcAggregates(effective, costMap);
                
                stats.totalRevenue = aggregated.faturamento;
                stats.totalOrders = aggregated.pedidos;
                stats.avgTicket = aggregated.ticketMedio;
                stats.profit = aggregated.lucro;
                
                // Mantenha retrocompatibilidade para discountTotal no front, mas setamos como zero
                stats.discountTotal = 0;
            }

            res.json({ orders: data, count, stats, page: Number(page), limit: Number(limit) });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.get('/pedidos', adminAuth, async (req, res) => {
        try {
            const tzOffset = req.query.tzOffset || 0;
            const offsetMs = Number(tzOffset) * 60 * 1000;
            const now = new Date();
            const localNow = new Date(now.getTime() - offsetMs);
            const opStart = new Date(localNow);
            if (localNow.getHours() < 5) opStart.setDate(localNow.getDate() - 1);
            opStart.setHours(5, 0, 0, 0);
            
            const utcOpStart = new Date(opStart.getTime() + offsetMs).toISOString();

            const { data, error } = await supabase
                .from('pedidos')
                .select('*, clientes(*)')
                .gte('created_at', utcOpStart)
                .order('created_at', { ascending: false });
            if (error) throw error;
            res.json(data);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.get('/pre-orders', adminAuth, async (req, res) => {
        try {
            // Busca pedidos que possuam order_type igual a 'pre_venda' no JSON de items.
            // Para garantir precisão, buscamos os pedidos recentes (últimos 30 dias) e filtramos.
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { data, error } = await supabase
                .from('pedidos')
                .select('*, clientes(*)')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            const preOrders = (data || []).filter(o => {
                let items = o.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch { return false; }
                }
                return items?.order_type === 'pre_venda';
            });

            res.json(preOrders);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/update-order-status', adminAuth, async (req, res) => {
        try {
            const { id, status } = req.body;
            const { error } = await supabase.from('pedidos').update({ status }).eq('id', id);
            if (error) throw error;
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // --- NOVA ROTA: VIRADA DE CICLO MANUAL ---
    router.post('/force-cycle-turnover', adminAuth, async (req, res) => {
        try {
            const { getUnifiedStoreStatus } = require('../services/storeStatusService');
            
            // 1. Busca config atual
            const { data } = await supabase.from('site_content').select('value').eq('key', 'opening_hours').maybeSingle();
            if (!data) throw new Error("Configuração de ciclos não encontrada.");
            
            let config = data.value;
            const nextBakeDate = config.nextBatch?.bakeDate;
            
            if (!nextBakeDate) throw new Error("Próxima fornada não configurada.");

            // 2. Promoção Forçada (Ciclo 2 vira Ciclo 1)
            const oldNextBatch = { ...config.nextBatch };
            config.currentBatch = oldNextBatch;
            
            // Recalcula novo Ciclo 2 (Ciclo 1 + 7 dias)
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

            config.nextBatch = {
                bakeDate: shift7Days(config.currentBatch.bakeDate),
                start: shift7Days(config.currentBatch.start),
                end: shift7Days(config.currentBatch.end)
            };

            // 3. Salva no banco
            await supabase.from('site_content').upsert([{ 
                key: 'opening_hours', 
                value: config, 
                updated_at: new Date().toISOString() 
            }]);

            // 4. Mudar status dos pedidos que agora pertencem à Fornada Atual
            // Buscamos pedidos com status 'paid' que tenham a batch_date igual à nova bakeDate
            const { data: pedidosToUpdate } = await supabase
                .from('pedidos')
                .select('id, items')
                .eq('status', 'paid');
            
            const targets = (pedidosToUpdate || []).filter(o => {
                let items = o.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch { return false; }
                }
                return items?.batch_date === nextBakeDate;
            });

            if (targets.length > 0) {
                const ids = targets.map(t => t.id);
                await supabase.from('pedidos').update({ status: 'aceito' }).in('id', ids);
            }

            res.json({ success: true, message: `Ciclo virado com sucesso. ${targets.length} pedidos movidos para produção.` });

        } catch (e) {
            console.error("Erro na virada de ciclo:", e);
            res.status(500).json({ error: e.message });
        }
    });

    router.get('/users', adminAuth, authorize(['admin']), async (req, res) => {
        try {
            const { data, error } = await supabase.from('usuarios').select('id, nome, email, role, ultimo_login, criado_em');
            if (error) throw error;
            res.json(data);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.get('/customers', adminAuth, async (req, res) => {
        try {
            // 1. Busca todos os clientes
            const { data: customers, error: custErr } = await supabase.from('clientes').select('*').order('name', { ascending: true });
            if (custErr) throw custErr;

            // 2. Busca resumo de TODOS os pedidos pagos/concluídos para estatísticas globais do CRM
            // Usamos apenas as colunas necessárias para performance
            const { data: orderStats, error: statErr } = await supabase
                .from('pedidos')
                .select('customer_id, created_at, total_amount')
                .in('status', ['paid', 'pago', 'concluido', 'concluído', 'finalizado', 'entregue', 'delivered', 'aceito', 'preparo', 'retirada'])
                .order('created_at', { ascending: false });
            
            if (statErr) throw statErr;

            // 3. Agrega os dados por cliente
            const statsMap = {};
            (orderStats || []).forEach(o => {
                if (!statsMap[o.customer_id]) {
                    statsMap[o.customer_id] = { count: 0, last: o.created_at, total: 0 };
                }
                statsMap[o.customer_id].count++;
                statsMap[o.customer_id].total += (o.total_amount || 0);
            });

            // 4. Combina os dados
            const enriched = customers.map(c => ({
                ...c,
                crm_count: statsMap[c.id]?.count || 0,
                crm_last: statsMap[c.id]?.last || null,
                crm_total: statsMap[c.id]?.total || 0
            }));

            res.json(enriched);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/save-customer', adminAuth, async (req, res) => {
        try {
            const { name, whatsapp, email } = req.body;
            const phone = String(whatsapp || '').replace(/\D/g, '');
            
            if (!phone) throw new Error("WhatsApp é obrigatório.");

            // 1. Verificar se o cliente já existe pelo WhatsApp (Deduplicação Manual)
            // Evita o erro de "no unique constraint for ON CONFLICT"
            const { data: existing } = await supabase
                .from('clientes')
                .select('id')
                .eq('whatsapp', phone)
                .maybeSingle();

            if (existing) {
                // Atualiza contato existente
                const { error: updErr } = await supabase
                    .from('clientes')
                    .update({ 
                        name, 
                        // Se o e-mail não foi informado mas o banco exige, mantemos o placeholder
                        email: email || `${phone}@manual.tocha` 
                    })
                    .eq('id', existing.id);
                if (updErr) throw updErr;
            } else {
                // Cria novo contato
                const { error: insErr } = await supabase
                    .from('clientes')
                    .insert([{
                        name,
                        whatsapp: phone,
                        email: email || `${phone}@manual.tocha`
                    }]);
                if (insErr) throw insErr;
            }

            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.get('/customer-details/:id', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { data: customer, error: custErr } = await supabase.from('clientes').select('*').eq('id', id).single();
            if (custErr || !customer) return res.status(404).json({ error: 'Cliente não encontrado.' });
            
            const { data: rawOrders, error: ordErr } = await supabase.from('pedidos').select('*').eq('customer_id', id).neq('status', 'pending').order('created_at', { ascending: false });
            if (ordErr) throw ordErr;
            
            // Garantir que items venha de forma consistente
            const orders = (rawOrders || []).map(o => {
                let parsedItems = [];
                try {
                    parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
                    if (!Array.isArray(parsedItems)) parsedItems = Object.values(parsedItems);
                } catch (e) { parsedItems = []; }
                return { ...o, items: parsedItems };
            });
            
            const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            res.json({ customer, orders, summary: { totalSpent, totalOrders: orders.length, lastOrderDate: orders.length > 0 ? (orders[0].created_at || null) : null } });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/save-user', adminAuth, authorize(['admin']), async (req, res) => {
        try {
            const { id, nome, email, password, role } = req.body;
            const userData = { nome, email, role };
            if (password) userData.senha = await bcrypt.hash(password, await bcrypt.genSalt(10));
            const { error } = await supabase.from('usuarios').upsert([id ? { id, ...userData } : userData]);
            if (error) throw error;
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(__dirname, '..', '..', 'public', 'assets', 'uploads');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    });
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const upload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: (_req, file, cb) => {
            if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
            else cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WEBP ou GIF.'));
        }
    });

    router.post('/upload', adminAuth, upload.single('image'), (req, res) => {
        try {
            if (!req.file) throw new Error("Falha no upload.");
            res.json({ success: true, url: `assets/uploads/${req.file.filename}` });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.get('/opcionais-config', adminAuth, async (req, res) => {
        try {
            const { data: grupos } = await supabase.from('grupos_opcionais').select('*, opcionais(*)').order('display_order', { ascending: true });
            res.json(grupos);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/save-grupo-opcional', adminAuth, async (req, res) => {
        try {
            const { error } = await supabase.from('grupos_opcionais').upsert([req.body]);
            if (error) throw error;
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/save-opcional', adminAuth, async (req, res) => {
        try {
            const { error } = await supabase.from('opcionais').upsert([req.body]);
            if (error) throw error;
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    const { getUnifiedStoreStatus } = require('../services/storeStatusService');
    
    // ROTA DE DIAGNÓSTICO (Etapa 4 e 5 do Roteiro)
    router.get('/test-connectivity', adminAuth, async (req, res) => {
        const { sendOrderEmails, sendOrderWhatsApp } = require('../notification-service');
        
        const dummyOrder = { id: 'TESTE-ID', total_amount: 10.0, items: JSON.stringify([{name: 'Pão de Teste', qty: 1, price: 5.0}]) };
        const dummyCustomer = { name: 'Audit Test', email: 'tocha.padariapagamentos@gmail.com', whatsapp: '21966205608' }; // Usando e-mail da loja para teste seguro
        
        console.log("\n🧪 --- INICIANDO TESTE DE CONECTIVIDADE ---");
        
        try {
            await Promise.allSettled([
                sendOrderEmails(dummyOrder, dummyCustomer, 'Pix (Teste)'),
                sendOrderWhatsApp(dummyOrder, dummyCustomer, 'Pix (Teste)')
            ]);
            res.json({ success: true, message: "Logs de teste gerados no console do sistema." });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    router.get('/store-status', async (req, res) => {
        try {
            const status = await getUnifiedStoreStatus(supabase);
            // open é verdadeiro se estiver aberta agora OU se aceitar próxima fornada. 
            // Para o public front-end e navbar.
            res.json({ 
                open: status.isOpen, 
                delivery: false, // fallback
                statusMode: status.statusMode,
                orderType: status.orderType,
                message: status.message,
                allowNextBatch: status.allowNextBatch,
                nextBatchDate: status.nextBatchDate,
                nextBatchLabel: status.nextBatchLabel
            });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/toggle-store', adminAuth, async (req, res) => {
        try {
            const { open, delivery } = req.body; // Vem do botão superior do painel
            
            // Vamos preservar o objeto atual e apenas alterar o "manualBlock" de acordo com o botão.
            const { data } = await supabase.from('site_content').select('value').eq('key', 'opening_hours').maybeSingle();
            let config = data?.value || { mode: 'custom', schedules: [] };
            
            // O botão do admin envia open: true para "abrir", open: false para "fechar" (forçado).
            config.manualBlock = !open;
            
            const { error } = await supabase.from('site_content').upsert([{ key: 'opening_hours', value: config, updated_at: new Date().toISOString() }]);
            if (error) throw error;
            
            const status = await getUnifiedStoreStatus(supabase);
            
            res.json({ success: true, open: status.isOpen, statusMode: status.statusMode, message: status.message, allowNextBatch: status.allowNextBatch });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    router.post('/update-profile', adminAuth, async (req, res) => {
        try {
            const { nome, email, senha, telefone } = req.body;
            const updates = { nome, email, telefone };
            if (senha && senha.trim() !== '' && senha !== '********') updates.senha = await bcrypt.hash(senha, 10);
            const { error } = await supabase.from('usuarios').update(updates).eq('id', req.user.id);
            if (error) throw error;
            res.json({ success: true, message: 'Perfil atualizado com sucesso!' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    const VALID_COUPONS = { 'TOCHA10': { type: 'percent', value: 10, label: '10% de desconto' }, 'BEM-VINDO': { type: 'percent', value: 15, label: '15% de desconto' }, 'FORNADA5': { type: 'fixed', value: 5, label: 'R$ 5,00 de desconto' } };
    router.post('/validate-coupon', async (req, res) => {
        const coupon = VALID_COUPONS[(req.body.code || '').trim().toUpperCase()];
        res.json(coupon ? { valid: true, ...coupon } : { valid: false });
    });

    const { sendOrderEmails, sendOrderWhatsApp } = require('../notification-service');
    router.get('/test-notifications', adminAuth, async (req, res) => {
        try {
            const { data: lastOrder, error: orderErr } = await supabase.from('pedidos').select('*, clientes(*)').order('created_at', { ascending: false }).limit(1).single();
            if (orderErr || !lastOrder) return res.status(404).json({ error: "Pedido não encontrado." });
            const customer = { ...lastOrder.clientes, name: lastOrder.clientes?.name || 'Cliente Teste', whatsapp: lastOrder.clientes?.whatsapp || process.env.OWNER_WHATSAPP, email: lastOrder.clientes?.email || process.env.SMTP_USER };
            const results = await Promise.allSettled([ sendOrderEmails(lastOrder, customer, 'Teste'), sendOrderWhatsApp(lastOrder, customer, 'Teste') ]);
            res.json({ success: true, summary: results.map((r, i) => ({ type: i === 0 ? "E-MAIL" : "WHATSAPP", status: r.status })), order_id: lastOrder.id });
        } catch (error) { res.status(500).json({ error: error.message }); }
    });

    return router;
};
