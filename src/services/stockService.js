
/**
 * Lógica Unificada de Estoque (Fonte Única de Verdade)
 * Esta função deve ser a única responsável por determinar quanto de um produto pode ser vendido agora.
 */
async function getUnifiedAvailableStock(supabase, productId) {
    try {
        // 1. Obtém a fornada atual configurada no site
        const { data: configRow } = await supabase.from('site_content').select('value').eq('key', 'opening_hours').maybeSingle();
        const config = configRow?.value || {};
        const currentBakeDate = config.currentBatch?.bakeDate;

        // 2. Busca o produto para ter o estoque global (fallback)
        const { data: p } = await supabase.from('produtos').select('stock_quantity, initial_stock').eq('id', productId).single();
        if (!p) return 0;

        const globalStock = p.stock_quantity || 0;

        if (currentBakeDate) {
            // 3. Tenta buscar estoque específico da fornada
            const { data: fornada } = await supabase.from('fornadas').select('id').eq('bake_date', currentBakeDate).maybeSingle();
            if (fornada) {
                const { data: bStock } = await supabase.from('produto_estoque_fornada')
                    .select('estoque_disponivel')
                    .eq('produto_id', productId)
                    .eq('fornada_id', fornada.id)
                    .maybeSingle();
                
                // Se existe registro na fornada, ele é a prioridade absoluta
                if (bStock) return Number(bStock.estoque_disponivel) || 0;
            }
        }

        // 4. Se não há fornada ou não há registro nela, o global é o que conta
        return Number(globalStock) || 0;
    } catch (e) {
        console.error(`[StockUtil] Erro ao buscar estoque unificado para ${productId}:`, e.message);
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
            const base = bStock ? (Number(bStock.estoque_base) || 0) : (Number(p.initial_stock) || 0);

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
