'use strict';

// Mapeamento de códigos de rejeição do Mercado Pago
const MP_REJECTION_MAP = {
    // ── Cartão de Crédito ─────────────────────────────────────────────────────
    cc_rejected_insufficient_amount:      { category: 'saldo_insuficiente',        label: 'Saldo insuficiente' },
    cc_rejected_bad_filled_card_number:   { category: 'dados_invalidos',            label: 'Número do cartão inválido' },
    cc_rejected_bad_filled_date:          { category: 'cartao_expirado',            label: 'Cartão expirado' },
    cc_rejected_bad_filled_other:         { category: 'dados_invalidos',            label: 'Dados inválidos' },
    cc_rejected_bad_filled_security_code: { category: 'cvv_invalido',               label: 'CVV inválido' },
    cc_rejected_blacklist:                { category: 'antifraude',                 label: 'Suspeita de fraude' },
    cc_rejected_call_for_authorize:       { category: 'emissor_recusou',            label: 'Emissor recusou' },
    cc_rejected_card_disabled:            { category: 'cartao_bloqueado',           label: 'Cartão bloqueado' },
    cc_rejected_card_error:               { category: 'processamento_falhou',       label: 'Erro no processamento' },
    cc_rejected_duplicated_payment:       { category: 'duplicado',                  label: 'Pagamento duplicado' },
    cc_rejected_high_risk:                { category: 'antifraude',                 label: 'Suspeita de fraude' },
    cc_rejected_invalid_installments:     { category: 'parcelamento_invalido',      label: 'Parcelamento inválido' },
    cc_rejected_max_attempts:             { category: 'limite_tentativas',          label: 'Muitas tentativas' },
    cc_rejected_other_reason:             { category: 'outros',                     label: 'Outros' },
    cc_rejected_not_authenticated:        { category: 'autenticacao_falhou',        label: 'Autenticação falhou' },
    cc_rejected_limit_exceeded:           { category: 'limite_excedido',            label: 'Limite excedido' },
    cc_rejected_not_allowed:              { category: 'transacao_nao_permitida',    label: 'Transação não permitida' },
    cc_rejected_issuer_not_available:     { category: 'emissor_indisponivel',       label: 'Emissor indisponível' },
    pending_contingency:                  { category: 'processamento_falhou',       label: 'Falha no processamento' },
    pending_review_manual:                { category: 'antifraude',                 label: 'Suspeita de fraude' },

    // ── Débito (códigos sem prefixo cc_, usados pelo MP para debit_card) ──────
    insufficient_amount:                  { category: 'saldo_insuficiente',         label: 'Saldo insuficiente' },
    card_disabled:                        { category: 'cartao_bloqueado',           label: 'Cartão bloqueado' },
    invalid_data:                         { category: 'dados_invalidos',            label: 'Dados inválidos' },
    not_allowed:                          { category: 'transacao_nao_permitida',    label: 'Transação não permitida' },
    daily_limit_exceeded:                 { category: 'limite_diario_excedido',     label: 'Limite diário excedido' },
    invalid_pin:                          { category: 'pin_incorreto',              label: 'PIN incorreto' },
    issuer_not_available:                 { category: 'banco_indisponivel',         label: 'Banco indisponível' },
    bank_offline:                         { category: 'banco_fora_do_ar',           label: 'Banco fora do ar' },

    // ── PIX ──────────────────────────────────────────────────────────────────
    expired:                              { category: 'qr_code_expirado',           label: 'QR Code expirado' },
    pix_timeout:                          { category: 'tempo_expirado',             label: 'Tempo expirado (timeout)' },
    timeout:                              { category: 'tempo_expirado',             label: 'Tempo expirado (timeout)' },
    pix_key_not_found:                    { category: 'chave_pix_invalida',         label: 'Chave Pix inválida' },
    invalid_pix_key:                      { category: 'chave_pix_invalida',         label: 'Chave Pix inválida' },
    receiver_account_error:               { category: 'conta_recebedor_invalida',   label: 'Conta do recebedor inativa' },
    pix_not_authorized:                   { category: 'transacao_nao_permitida',    label: 'Transação não permitida' },
    pix_limit_exceeded:                   { category: 'limite_pix_excedido',        label: 'Limite PIX excedido' },
    qr_expired:                           { category: 'qr_code_expirado',           label: 'QR Code expirado' },
    provider_error:                       { category: 'erro_provedor',              label: 'Erro na API do provedor' },
    cancelled:                            { category: 'pix_cancelado',              label: 'PIX cancelado' },
    rejected:                             { category: 'outros',                     label: 'Outros' },
};

// Mapeamento de códigos de rejeição do Stripe
const STRIPE_REJECTION_MAP = {
    insufficient_funds:              { category: 'saldo_insuficiente',        label: 'Saldo insuficiente' },
    card_declined:                   { category: 'emissor_recusou',            label: 'Cartão recusado pelo emissor' },
    expired_card:                    { category: 'cartao_expirado',            label: 'Cartão expirado' },
    incorrect_cvc:                   { category: 'cvv_invalido',               label: 'CVV inválido' },
    incorrect_number:                { category: 'dados_invalidos',            label: 'Número do cartão inválido' },
    invalid_cvc:                     { category: 'cvv_invalido',               label: 'CVV inválido' },
    invalid_expiry_month:            { category: 'cartao_expirado',            label: 'Data de validade inválida' },
    invalid_expiry_year:             { category: 'cartao_expirado',            label: 'Data de validade inválida' },
    invalid_number:                  { category: 'dados_invalidos',            label: 'Número do cartão inválido' },
    card_velocity_exceeded:          { category: 'limite_excedido',            label: 'Limite excedido' },
    do_not_honor:                    { category: 'transacao_nao_permitida',    label: 'Transação não permitida' },
    not_permitted:                   { category: 'transacao_nao_permitida',    label: 'Transação não permitida' },
    transaction_not_allowed:         { category: 'transacao_nao_permitida',    label: 'Transação não permitida' },
    fraudulent:                      { category: 'antifraude',                 label: 'Suspeita de fraude' },
    generic_decline:                 { category: 'emissor_recusou',            label: 'Recusado pelo emissor' },
    lost_card:                       { category: 'antifraude',                 label: 'Suspeita de fraude' },
    stolen_card:                     { category: 'antifraude',                 label: 'Suspeita de fraude' },
    pickup_card:                     { category: 'antifraude',                 label: 'Suspeita de fraude' },
    authentication_required:         { category: 'autenticacao_falhou',        label: 'Autenticação falhou' },
    card_not_supported:              { category: 'bandeira_nao_suportada',     label: 'Bandeira não suportada' },
    currency_not_supported:          { category: 'bandeira_nao_suportada',     label: 'Bandeira não suportada' },
    service_unavailable:             { category: 'banco_indisponivel',         label: 'Banco indisponível' },
    try_again_later:                 { category: 'tempo_expirado',             label: 'Tempo expirado (timeout)' },
    bank_account_restricted:         { category: 'limite_excedido',            label: 'Limite excedido' },
    pin_try_exceeded:                { category: 'pin_incorreto',              label: 'PIN incorreto' },
    withdrawal_count_limit_exceeded: { category: 'limite_diario_excedido',     label: 'Limite diário excedido' },
    issuer_not_available:            { category: 'banco_indisponivel',         label: 'Banco indisponível' },
    // sessão/PIX
    session_expired:                 { category: 'processamento_falhou',       label: 'Falha no processamento' },
    payment_intent_failed:           { category: 'processamento_falhou',       label: 'Falha no processamento' },
};

/**
 * Normaliza códigos de falha das operadoras para categorias unificadas.
 * @param {'mercadopago'|'stripe'} provider
 * @param {string} rawCode - código retornado pela operadora (status_detail, decline_code, etc)
 * @returns {{ category: string, label: string, raw_code: string }}
 */
function normalizePaymentFailure(provider, rawCode) {
    const map = provider === 'stripe' ? STRIPE_REJECTION_MAP : MP_REJECTION_MAP;
    const code = (rawCode || '').toLowerCase();
    const match = map[code];
    if (match) return { ...match, raw_code: rawCode || 'unknown' };
    return { category: 'outros', label: 'Outros', raw_code: rawCode || 'unknown' };
}

// Labels canônicos por categoria
const CATEGORY_LABELS = {
    // Cartão (crédito e débito)
    saldo_insuficiente:        'Saldo insuficiente',
    dados_invalidos:           'Dados inválidos',
    cartao_expirado:           'Cartão expirado',
    cvv_invalido:              'CVV inválido',
    cartao_bloqueado:          'Cartão bloqueado',
    limite_excedido:           'Limite excedido',
    limite_diario_excedido:    'Limite diário excedido',
    pin_incorreto:             'PIN incorreto',
    transacao_nao_permitida:   'Transação não permitida',
    emissor_indisponivel:      'Emissor indisponível',
    banco_indisponivel:        'Banco indisponível',
    banco_fora_do_ar:          'Banco fora do ar',
    antifraude:                'Suspeita de fraude',
    emissor_recusou:           'Recusado pelo banco',
    autenticacao_falhou:       'Autenticação falhou',
    // PIX
    chave_pix_invalida:        'Chave Pix inválida',
    conta_recebedor_invalida:  'Conta do recebedor inativa',
    tempo_expirado:            'Tempo expirado (timeout)',
    limite_pix_excedido:       'Limite PIX excedido',
    qr_code_expirado:          'QR Code expirado',
    erro_provedor:             'Erro na API do provedor',
    pix_cancelado:             'PIX cancelado',
    // Genérico
    processamento_falhou:      'Falha no processamento',
    duplicado:                 'Pagamento duplicado',
    parcelamento_invalido:     'Parcelamento inválido',
    limite_tentativas:         'Muitas tentativas',
    bandeira_nao_suportada:    'Bandeira não suportada',
    outros:                    'Outros',
};

function getCategoryLabel(category) {
    return CATEGORY_LABELS[category] || category || 'Outros';
}

// Motivos canônicos por método — exibidos SEMPRE, mesmo com count = 0
const METHOD_REASONS = {
    card_credit: [
        { code: 'saldo_insuficiente',      label: 'Saldo insuficiente' },
        { code: 'limite_excedido',          label: 'Limite excedido' },
        { code: 'cartao_expirado',          label: 'Cartão expirado' },
        { code: 'dados_invalidos',          label: 'Dados inválidos' },
        { code: 'cartao_bloqueado',         label: 'Cartão bloqueado' },
        { code: 'antifraude',               label: 'Suspeita de fraude' },
        { code: 'transacao_nao_permitida',  label: 'Transação não permitida' },
        { code: 'emissor_indisponivel',     label: 'Emissor indisponível' },
        { code: 'outros',                   label: 'Outros' },
    ],
    card_debit: [
        { code: 'saldo_insuficiente',       label: 'Saldo insuficiente' },
        { code: 'cartao_bloqueado',         label: 'Cartão bloqueado' },
        { code: 'dados_invalidos',          label: 'Dados inválidos' },
        { code: 'transacao_nao_permitida',  label: 'Transação não permitida' },
        { code: 'limite_diario_excedido',   label: 'Limite diário excedido' },
        { code: 'pin_incorreto',            label: 'PIN incorreto' },
        { code: 'banco_indisponivel',       label: 'Banco indisponível' },
        { code: 'outros',                   label: 'Outros' },
    ],
    pix: [
        { code: 'saldo_insuficiente',       label: 'Saldo insuficiente' },
        { code: 'chave_pix_invalida',       label: 'Chave PIX inválida' },
        { code: 'conta_recebedor_invalida', label: 'Conta do recebedor inativa' },
        { code: 'tempo_expirado',           label: 'Tempo expirado (timeout)' },
        { code: 'limite_pix_excedido',      label: 'Limite PIX excedido' },
        { code: 'banco_fora_do_ar',         label: 'Banco fora do ar' },
        { code: 'qr_code_expirado',         label: 'QR Code expirado' },
        { code: 'erro_provedor',            label: 'Erro na API do provedor' },
        { code: 'outros',                   label: 'Outros' },
    ],
};

/**
 * Agrega um countMap por método no array canônico completo.
 * Todos os motivos aparecem, mesmo com count = 0.
 * Motivos fora do canônico são absorvidos em 'outros' com log.
 * @param {Object<string,number>} countMap  - { reason_code: count }
 * @param {'card_credit'|'card_debit'|'pix'} method
 * @returns {{ total: number, reasons: Array<{code,label,count,pct}> }}
 */
function buildMethodReasons(countMap, method) {
    const canonical = METHOD_REASONS[method] || [];
    const canonicalCodes = new Set(canonical.map(r => r.code));
    const total = Object.values(countMap).reduce((s, n) => s + n, 0);

    let othersExtra = 0;
    for (const [code, count] of Object.entries(countMap)) {
        if (!canonicalCodes.has(code) && code !== 'outros') {
            console.warn('UNMAPPED_REJECTION', { status_detail: code, payment_method_id: method, count });
            othersExtra += count;
        }
    }

    const reasons = canonical.map(r => {
        const count = r.code === 'outros'
            ? (countMap['outros'] || 0) + othersExtra
            : (countMap[r.code] || 0);
        return {
            code:  r.code,
            label: r.label,
            count,
            pct: total > 0 ? Math.round((count / total) * 100) : 0,
        };
    });

    reasons.sort((a, b) => {
        if (a.code === 'outros') return 1;
        if (b.code === 'outros') return -1;
        return b.count - a.count;
    });

    return { total, reasons };
}

module.exports = { normalizePaymentFailure, getCategoryLabel, CATEGORY_LABELS, METHOD_REASONS, buildMethodReasons };
