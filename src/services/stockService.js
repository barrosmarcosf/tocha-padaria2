
// Cache de pedidos pending compartilhado entre chamadas na mesma requisição de checkout.
// Evita N queries duplicadas quando o carrinho tem vários itens da mesma fornada.
// TTL de 10s — janela curta para manter consistência sem latência extra.
let _pendingCache = null;
let _pendingCacheAt = 0;
const _PENDING_CACHE_TTL = 10_000;

async function _loadPendingOrders(supabase) {
    const now = Date.now();
    if (_pendingCache && (now - _pendingCacheAt) < _PENDING_CACHE_TTL) return _pendingCache;
    const cutoff = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
        .from('pedidos')
        .select('items')
        .in('status', ['pending', 'payment_failed'])
        .gte('created_at', cutoff);
    _pendingCache = data || [];
    _pendingCacheAt = now;
    return _pendingCache;
}

function _sumPendingQty(pendingOrders, productId, batchDate) {
    let total = 0;
    for (const o of pendingOrders) {
        try {
            const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || {});
            if (items.batch_date !== batchDate) continue;
            for (const item of (items.actual_items || [])) {
                if (String(item.id) === String(productId)) total += parseInt(item.qty) || 0;
            }
        } catch (_) {}
    }
    return total;
}

/**
 * Lógica Unificada de Estoque (Fonte Única de Verdade)
 * Esta função deve ser a única responsável por determinar quanto de um produto pode ser vendido agora.
 *
 * C4 mitigation: subtrai quantidades de pedidos pending/payment_failed recentes (últimas 2h)
 * para a mesma fornada. Cria "reserva suave" que previne dupla venda em pagamentos simultâneos.
 * A dedução final ainda é atômica via deductStockAtomico RPC (última linha de defesa).
 */
async function getUnifiedAvailableStock(supabase, productId) {
    try {
        // 1. Obtém a fornada atual configurada no site
        const { data: configRow } = await supabase.from('site_content').select('value').eq('key', 'opening_hours').maybeSingle();
        const config = configRow?.value || {};
        const currentBakeDate = config.currentBatch?.bakeDate;

        // 2. Busca o produto para ter o estoque global (fallback)
        const { data: p, error: pError } = await supabase.from('produtos').select('name, stock_quantity').eq('id', productId).maybeSingle();

        if (pError) console.error("❌ [StockService] Erro DB Produtos:", pError);
        if (!p) {
            console.warn(JSON.stringify({ tag: 'PRODUCT_NOT_FOUND', productId }));
            return null;
        }

        if (currentBakeDate) {
            // 3. Tenta buscar estoque específico da fornada
            const { data: fornada } = await supabase.from('fornadas').select('id').eq('bake_date', currentBakeDate).maybeSingle();
            if (fornada) {
                const { data: bStock } = await supabase.from('produto_estoque_fornada')
                    .select('estoque_disponivel')
                    .eq('produto_id', productId)
                    .eq('fornada_id', fornada.id)
                    .maybeSingle();

                if (bStock && bStock.estoque_disponivel != null) {
                    const raw = Number(bStock.estoque_disponivel);

                    // C4 — subtrai reservas em voo (pedidos pending na mesma fornada)
                    try {
                        const pending = await _loadPendingOrders(supabase);
                        const reserved = _sumPendingQty(pending, productId, currentBakeDate);
                        const adjusted = Math.max(0, raw - reserved);
                        if (reserved > 0) {
                            console.log(JSON.stringify({ tag: 'STOCK_ADJUSTED', productId, raw, reserved, adjusted, timestamp: new Date().toISOString() }));
                        }
                        return adjusted;
                    } catch (pendingErr) {
                        const { systemAlert } = require('../utils/systemAlert');
                        systemAlert('STOCK_PENDING_QUERY_FAIL', { productId, error: pendingErr.message });
                        return raw;
                    }
                }
            }
        }

        // null = produto sem estoque configurado → sem bloqueio no checkout
        return p.stock_quantity != null ? Number(p.stock_quantity) : null;
    } catch (e) {
        console.error(JSON.stringify({ tag: 'STOCK_SERVICE_ERROR', productId, error: e.message, timestamp: new Date().toISOString() }));
        return 0;
    }
}

/**
 * Retorna a lista de produtos com estoque unificado (usado pelas APIs /config)
 */
async function getUnifiedProductList(supabase, produtosRaw) {
    try {
        const { data: configRow } = await supabase.from('site_content').select('value').eq('key', 'opening_hours').maybeSingle();
        const config = configRow?.value || {};
        const currentBakeDate = config.currentBatch?.bakeDate;

        let batchStocks = [];
        if (currentBakeDate) {
            const { data: fornada } = await supabase.from('fornadas').select('id').eq('bake_date', currentBakeDate).maybeSingle();
            if (fornada) {
                const { data } = await supabase.from('produto_estoque_fornada').select('*').eq('fornada_id', fornada.id);
                batchStocks = data || [];
            }
        }

        return (produtosRaw || []).map(p => {
            const bStock = batchStocks.find(s => s.produto_id === p.id);
            const disponivel = bStock ? (Number(bStock.estoque_disponivel) || 0) : (Number(p.stock_quantity) || 0);
            const base = bStock ? (Number(bStock.estoque_base) || 0) : (Number(p.stock_quantity) || 0);

            return {
                ...p,
                disponivel_agora: disponivel,
                stock_quantity: disponivel, // Legado para compatibilidade imediata
                initial_stock: base
            };
        });
    } catch (e) {
        console.error("[StockUtil] Erro ao listar produtos unificados:", e.message);
        return produtosRaw;
    }
}

module.exports = { getUnifiedAvailableStock, getUnifiedProductList };
