'use strict';

/**
 * Dedução atômica de estoque via stored procedure processar_venda_completa.
 *
 * A procedure valida e bloqueia (FOR UPDATE) TODOS os itens do pedido dentro de
 * uma única transação PostgreSQL. Se qualquer item falhar por estoque insuficiente
 * ou produto não mapeado na fornada, NADA é deduzido — rollback automático.
 *
 * Requer a migration: migrations/20260519_processar_venda_completa.sql
 *
 * Se a função ainda não existir no banco, lança erro com code='RPC_NOT_FOUND'
 * para que o chamador possa identificar e usar o fallback de loop temporário.
 */
async function deductStockAtomico(supabase, orderId) {
    const { data, error } = await supabase.rpc('processar_venda_completa', {
        p_order_id: orderId
    });

    if (error) {
        const isNotFound =
            error.message?.includes('Could not find the function') ||
            error.message?.includes('does not exist') ||
            error.code === 'PGRST202';
        if (isNotFound) {
            const err = new Error('processar_venda_completa não encontrada — execute a migration SQL');
            err.code = 'RPC_NOT_FOUND';
            throw err;
        }
        throw new Error(`Erro na RPC de estoque: ${error.message}`);
    }

    if (data?.status === 'error') {
        const parts = [
            data.error,
            data.product_id ? `produto=${data.product_id}` : null,
            data.available != null ? `disponivel=${data.available} solicitado=${data.requested}` : null,
            data.batch_date ? `fornada=${data.batch_date}` : null,
        ].filter(Boolean);
        throw new Error(`Validação de estoque: ${parts.join(' | ')}`);
    }

    return data; // { status: 'ok', deducted: [{id, qty}, ...], note? }
}

module.exports = { deductStockAtomico };
