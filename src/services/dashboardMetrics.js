/**
 * dashboardMetrics.js
 * 
 * Serviço de métricas centralizado com normalização rigorosa de fuso horário (America/Sao_Paulo).
 */

const MARGIN_COST = 0.40;
const PAID_STATUSES = new Set([
    'concluido', 'concluído', 'paid', 'pago', 'finalizado',
    'success', 'succeeded', 'completed', 'entregue', 'delivered', 'aceito', 'preparo', 'retirada'
]);

// Offset de Brasília em milissegundos (UTC-3)
const BR_OFFSET_MS = -3 * 60 * 60 * 1000;

/**
 * Utilitário para obter um objeto Date e extrair componentes em Brasília,
 * independente do fuso horário do servidor.
 */
function getBRDate(absoluteDate) {
    const brTime = absoluteDate.getTime() + BR_OFFSET_MS;
    const d = new Date(brTime);
    return {
        hours: d.getUTCHours(),
        day: d.getUTCDate(),
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
        timestamp: brTime
    };
}

/**
 * Calcula o intervalo de datas baseado no fuso horário de Brasília.
 */
function getDateRange(period, from, to, tzOffset = 180) {
    const now = new Date();
    const br = getBRDate(now);
    
    // Criar início do dia atual em Brasília
    const startOfBrToday = new Date(Date.UTC(br.year, br.month - 1, br.day, 0, 0, 0, 0) - BR_OFFSET_MS);
    
    let start, end;

    switch (period) {
        case 'yesterday':
            start = new Date(startOfBrToday.getTime() - 24 * 60 * 60 * 1000);
            end = new Date(startOfBrToday.getTime() - 1);
            break;
        case '7d':
            start = new Date(startOfBrToday.getTime() - 7 * 24 * 60 * 60 * 1000);
            end = new Date(now.getTime());
            break;
        case '15d':
            start = new Date(startOfBrToday.getTime() - 15 * 24 * 60 * 60 * 1000);
            end = new Date(now.getTime());
            break;
        case '30d':
            start = new Date(startOfBrToday.getTime() - 30 * 24 * 60 * 60 * 1000);
            end = new Date(now.getTime());
            break;
        case 'month':
            start = new Date(Date.UTC(br.year, br.month - 1, 1, 0, 0, 0, 0) - BR_OFFSET_MS);
            end = new Date(Date.UTC(br.year, br.month, 0, 23, 59, 59, 999) - BR_OFFSET_MS);
            break;
        case 'custom':
            start = new Date(from + 'T00:00:00Z');
            start = new Date(start.getTime() - BR_OFFSET_MS); // Ajusta para que 00:00 do input seja 00:00 BR
            end = new Date(to + 'T23:59:59Z');
            end = new Date(end.getTime() - BR_OFFSET_MS);
            break;
        default: // today
            start = startOfBrToday;
            end = new Date(startOfBrToday.getTime() + 24 * 60 * 60 * 1000 - 1);
            break;
    }

    // Cálculo de período anterior para variação
    const diff = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - diff - 1000);
    const prevEnd = new Date(start.getTime() - 1000);

    return { start, end, prevStart, prevEnd };
}

async function fetchPaidOrders(supabase, start, end) {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*, clientes(name)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

    if (error) throw error;
    return (data || []).filter(o => PAID_STATUSES.has((o.status || '').toLowerCase().trim()));
}

async function buildCostMap(supabase) {
    const { data: produtos } = await supabase.from('produtos').select('name, price, cost');
    const map = {};
    (produtos || []).forEach(p => {
        map[p.name] = (p.cost && p.cost > 0) ? Number(p.cost) : Number(p.price || 0) * MARGIN_COST;
    });
    return map;
}

function parseItems(items) {
    if (!items) return [];
    let p = typeof items === 'string' ? JSON.parse(items) : items;
    if (p && p.actual_items) return p.actual_items;
    return Array.isArray(p) ? p : [];
}

function calcAggregates(orders, costMap) {
    let faturamento = 0;
    let custo = 0;
    orders.forEach(o => {
        faturamento += Number(o.total_amount || 0);
        parseItems(o.items).forEach(item => {
            const qty = Number(item.qty || 1);
            const unitCost = costMap[item.name] ?? (Number(item.price || 0) * MARGIN_COST);
            custo += unitCost * qty;
        });
    });
    return { faturamento, pedidos: orders.length, ticketMedio: orders.length > 0 ? faturamento / orders.length : 0, lucro: faturamento - custo };
}

function buildTimeSeries(orders, costMap, start, end, period) {
    // Força modo diário se o período for explicitamente longo
    const isHourly = (period === 'today' || period === 'yesterday') ? true : 
                     (['7d', '15d', '30d', 'month'].includes(period)) ? false : 
                     ((end.getTime() - start.getTime()) / 3600000) <= 26;
    
    const buckets = new Map();

    if (isHourly) {
        for (let h = 0; h < 24; h++) {
            buckets.set(`${h.toString().padStart(2, '0')}h`, { faturamento: 0, pedidos: 0, custo: 0 });
        }
    } else {
        let cursor = new Date(start.getTime());
        while (cursor <= end) {
            const br = getBRDate(cursor);
            const key = `${br.day.toString().padStart(2, '0')}/${br.month.toString().padStart(2, '0')}`;
            if (!buckets.has(key)) buckets.set(key, { faturamento: 0, pedidos: 0, custo: 0 });
            cursor.setTime(cursor.getTime() + 24 * 3600000);
        }
    }

    orders.forEach(o => {
        const br = getBRDate(new Date(o.created_at));
        const key = isHourly ? `${br.hours.toString().padStart(2, '0')}h` : `${br.day.toString().padStart(2, '0')}/${br.month.toString().padStart(2, '0')}`;
        
        if (buckets.has(key)) {
            const b = buckets.get(key);
            b.faturamento += Number(o.total_amount || 0);
            b.pedidos += 1;
            parseItems(o.items).forEach(item => {
                const unitCost = costMap[item.name] ?? (Number(item.price || 0) * MARGIN_COST);
                b.custo += unitCost * Number(item.qty || 1);
            });
        }
    });

    return Array.from(buckets.entries()).map(([key, b]) => ({
        data: key,
        faturamento: b.faturamento,
        pedidos: b.pedidos,
        ticketMedio: b.pedidos > 0 ? b.faturamento / b.pedidos : 0,
        lucro: b.faturamento - b.custo
    }));
}

async function getDashboardMetrics(supabase, { period = 'today', from, to, tzOffset = 180 } = {}) {
    const { start, end, prevStart, prevEnd } = getDateRange(period, from, to, tzOffset);
    const [currentOrders, previousOrders, costMap] = await Promise.all([
        fetchPaidOrders(supabase, start, end),
        fetchPaidOrders(supabase, prevStart, prevEnd),
        buildCostMap(supabase)
    ]);

    const current = calcAggregates(currentOrders, costMap);
    const previous = calcAggregates(previousOrders, costMap);
    const pct = (curr, prev) => (!prev) ? 0 : ((curr - prev) / prev) * 100;

    return {
        faturamento: current.faturamento,
        pedidos: current.pedidos,
        ticketMedio: current.ticketMedio,
        lucro: current.lucro,
        variacao: {
            faturamento: pct(current.faturamento, previous.faturamento),
            pedidos: pct(current.pedidos, previous.pedidos),
            ticketMedio: pct(current.ticketMedio, previous.ticketMedio),
            lucro: pct(current.lucro, previous.lucro)
        },
        serieTemporal: buildTimeSeries(currentOrders, costMap, start, end, period)
    };
}

module.exports = { getDashboardMetrics, getDateRange, fetchPaidOrders, buildCostMap, PAID_STATUSES, calcAggregates, parseItems, buildTimeSeries, getBRDate };
