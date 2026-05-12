'use strict';

// Mapeamento de códigos de rejeição do Mercado Pago
const MP_REJECTION_MAP = {
    cc_rejected_insufficient_amount:      { category: 'saldo_insuficiente',   label: 'Saldo insuficiente' },
    cc_rejected_bad_filled_card_number:   { category: 'dados_invalidos',       label: 'Número do cartão inválido' },
    cc_rejected_bad_filled_date:          { category: 'cartao_expirado',       label: 'Cartão expirado' },
    cc_rejected_bad_filled_other:         { category: 'dados_invalidos',       label: 'Dados inválidos' },
    cc_rejected_bad_filled_security_code: { category: 'cvv_invalido',          label: 'CVV inválido' },
    cc_rejected_blacklist:                { category: 'antifraude',            label: 'Bloqueado por antifraude' },
    cc_rejected_call_for_authorize:       { category: 'emissor_recusou',       label: 'Emissor recusou' },
    cc_rejected_card_disabled:            { category: 'cartao_bloqueado',      label: 'Cartão bloqueado' },
    cc_rejected_card_error:               { category: 'processamento_falhou',  label: 'Erro no processamento' },
    cc_rejected_duplicated_payment:       { category: 'duplicado',             label: 'Pagamento duplicado' },
    cc_rejected_high_risk:                { category: 'antifraude',            label: 'Bloqueado por antifraude' },
    cc_rejected_invalid_installments:     { category: 'parcelamento_invalido', label: 'Parcelamento inválido' },
    cc_rejected_max_attempts:             { category: 'limite_tentativas',     label: 'Muitas tentativas' },
    cc_rejected_other_reason:             { category: 'outros',                label: 'Recusado (outro motivo)' },
    pending_contingency:                  { category: 'processamento_falhou',  label: 'Falha no processamento' },
    pending_review_manual:                { category: 'antifraude',            label: 'Em revisão antifraude' },
    // PIX
    expired:                              { category: 'pix_expirado',          label: 'PIX expirado' },
    pix_timeout:                          { category: 'pix_expirado',          label: 'PIX expirado (timeout)' },
    cancelled:                            { category: 'pix_cancelado',         label: 'PIX cancelado' },
    rejected:                             { category: 'outros',                label: 'Recusado' },
};

// Mapeamento de códigos de rejeição do Stripe
const STRIPE_REJECTION_MAP = {
    insufficient_funds:       { category: 'saldo_insuficiente',   label: 'Saldo insuficiente' },
    card_declined:            { category: 'emissor_recusou',       label: 'Cartão recusado pelo emissor' },
    expired_card:             { category: 'cartao_expirado',       label: 'Cartão expirado' },
    incorrect_cvc:            { category: 'cvv_invalido',          label: 'CVV inválido' },
    incorrect_number:         { category: 'dados_invalidos',       label: 'Número do cartão inválido' },
    invalid_cvc:              { category: 'cvv_invalido',          label: 'CVV inválido' },
    invalid_expiry_month:     { category: 'cartao_expirado',       label: 'Data de validade inválida' },
    invalid_expiry_year:      { category: 'cartao_expirado',       label: 'Data de validade inválida' },
    invalid_number:           { category: 'dados_invalidos',       label: 'Número do cartão inválido' },
    card_velocity_exceeded:   { category: 'limite_excedido',       label: 'Limite de transações excedido' },
    do_not_honor:             { category: 'emissor_recusou',       label: 'Emissor recusou' },
    fraudulent:               { category: 'antifraude',            label: 'Bloqueado por antifraude' },
    generic_decline:          { category: 'emissor_recusou',       label: 'Recusado pelo emissor' },
    lost_card:                { category: 'antifraude',            label: 'Cartão bloqueado (perda/roubo)' },
    stolen_card:              { category: 'antifraude',            label: 'Cartão bloqueado (perda/roubo)' },
    pickup_card:              { category: 'antifraude',            label: 'Cartão retido' },
    // sessão/PIX
    session_expired:          { category: 'pix_expirado',          label: 'Sessão expirada (PIX/Cartão)' },
    payment_intent_failed:    { category: 'processamento_falhou',  label: 'Falha no processamento' },
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
    return { category: 'outros', label: 'Recusado (outro motivo)', raw_code: rawCode || 'unknown' };
}

// Labels legíveis para exibição no admin
const CATEGORY_LABELS = {
    saldo_insuficiente:   'Saldo insuficiente',
    dados_invalidos:      'Dados inválidos',
    cartao_expirado:      'Cartão expirado',
    cvv_invalido:         'CVV inválido',
    antifraude:           'Bloqueado por antifraude',
    emissor_recusou:      'Emissor recusou',
    cartao_bloqueado:     'Cartão bloqueado',
    processamento_falhou: 'Falha no processamento',
    duplicado:            'Pagamento duplicado',
    parcelamento_invalido:'Parcelamento inválido',
    limite_tentativas:    'Muitas tentativas',
    limite_excedido:      'Limite excedido',
    pix_expirado:         'PIX expirado',
    pix_cancelado:        'PIX cancelado',
    outros:               'Outros',
};

function getCategoryLabel(category) {
    return CATEGORY_LABELS[category] || category || 'Desconhecido';
}

module.exports = { normalizePaymentFailure, getCategoryLabel, CATEGORY_LABELS };
