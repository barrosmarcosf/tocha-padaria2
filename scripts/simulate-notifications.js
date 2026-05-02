/**
 * simulate-notifications.js
 *
 * Simula o fluxo completo de notificações pós-pagamento e abandono de carrinho
 * usando dados de cliente real e as funções reais do sistema (sem mocks).
 *
 * Uso: node scripts/simulate-notifications.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { sendOrderEmails, sendOrderWhatsApp, sendAbandonmentRecovery } = require('../src/notification-service');
const { checkAbandonedCarts } = require('../src/workers/cart-abandonment');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const CUSTOMER = {
    name: 'Julia Correa',
    whatsapp: '21969460158',
    email: 'juliafruiz@hotmail.com'
};

const TEST_ITEM = { id: 'sd-01', name: 'Pão de Fermentação Natural (SIMULAÇÃO)', qty: 1, price: 15.00 };
const TEST_TOTAL = 15.00;

async function run() {
    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log('  SIMULAÇÃO DE NOTIFICAÇÕES — TOCHA PADARIA');
    console.log(`  Cliente: ${CUSTOMER.name} | ${CUSTOMER.email} | ${CUSTOMER.whatsapp}`);
    console.log('══════════════════════════════════════════════════════');
    console.log('');

    // ── FASE 1: CLIENTE ──────────────────────────────────────
    console.log('[1/5] Upsert do cliente...');
    const { data: cliente, error: clienteErr } = await supabase
        .from('clientes')
        .upsert(
            { name: CUSTOMER.name, email: CUSTOMER.email, whatsapp: CUSTOMER.whatsapp },
            { onConflict: 'email' }
        )
        .select()
        .single();

    if (clienteErr) {
        console.error('❌ Erro ao criar cliente:', clienteErr.message);
        process.exit(1);
    }
    console.log(`   ✅ Cliente: ${cliente.id}`);

    // ── FASE 2: PEDIDO PAGO ──────────────────────────────────
    console.log('[2/5] Criando pedido de teste...');
    const simSessionId = `sim_pay_${Date.now()}`;
    const orderItems = {
        actual_items: [TEST_ITEM],
        order_type: 'normal',
        batch_date: null,
        batch_label: 'Simulação',
        payment_method: 'Pix (Mercado Pago) — SIMULAÇÃO',
        cycle_type: 'fornada atual'
    };

    const { data: order, error: orderErr } = await supabase
        .from('pedidos')
        .insert({
            customer_id: cliente.id,
            stripe_session_id: simSessionId,
            status: 'paid',
            total_amount: TEST_TOTAL,
            items: JSON.stringify(orderItems)
        })
        .select()
        .single();

    if (orderErr) {
        console.error('❌ Erro ao criar pedido:', orderErr.message);
        process.exit(1);
    }
    console.log(`   ✅ Pedido criado: ${order.id}`);

    // ── FASE 3: NOTIFICAÇÕES DE PAGAMENTO ────────────────────
    console.log('[3/5] Disparando notificações de pagamento...');
    const fullOrder = { ...order, clientes: cliente };

    const [emailResult, waResult] = await Promise.allSettled([
        sendOrderEmails(supabase, fullOrder, cliente, 'Pix (Mercado Pago) — SIMULAÇÃO'),
        sendOrderWhatsApp(supabase, fullOrder, cliente, 'Pix (Mercado Pago) — SIMULAÇÃO')
    ]);

    if (waResult.status === 'fulfilled') {
        console.log('[WHATSAPP TRIGGER OK - PAYMENT]');
    } else {
        console.error('❌ [WHATSAPP TRIGGER FAIL - PAYMENT]', waResult.reason?.message ?? waResult.reason);
    }

    if (emailResult.status === 'fulfilled') {
        console.log('[EMAIL TRIGGER OK - PAYMENT]');
    } else {
        console.error('❌ [EMAIL TRIGGER FAIL - PAYMENT]', emailResult.reason?.message ?? emailResult.reason);
    }

    // ── FASE 4: CARRINHO ABANDONADO ──────────────────────────
    console.log('[4/5] Criando carrinho abandonado...');
    const recoveryToken = crypto.randomBytes(24).toString('hex');
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: cart, error: cartErr } = await supabase
        .from('carrinhos')
        .insert({
            session_id: `sim_session_${Date.now()}`,
            customer_data: CUSTOMER,
            items: JSON.stringify([TEST_ITEM]),
            total_amount: TEST_TOTAL,
            status: 'active',
            last_activity_at: twoHoursAgo,
            recovery_sent: false,
            recovery_token: recoveryToken
        })
        .select()
        .single();

    if (cartErr) {
        console.error('❌ Erro ao criar carrinho:', cartErr.message);
        process.exit(1);
    }
    console.log(`   ✅ Carrinho criado: ${cart.id} (last_activity: ${twoHoursAgo})`);

    // ── FASE 5: WORKER DE ABANDONO ───────────────────────────
    console.log('[5/5] Executando worker de abandono...');
    await checkAbandonedCarts(supabase);

    // Verifica se o worker processou o carrinho
    const { data: updatedCart } = await supabase
        .from('carrinhos')
        .select('recovery_sent')
        .eq('id', cart.id)
        .single();

    if (updatedCart?.recovery_sent) {
        // Worker disparou com sucesso dentro do horário comercial
        console.log('[WHATSAPP TRIGGER OK - ABANDONO]');
        console.log('[EMAIL TRIGGER OK - ABANDONO]');
    } else {
        // Fora do horário comercial (9h–21h) ou outro bloqueio — disparo direto
        console.log('   ⚠️  Worker não processou (fora do horário ou erro). Disparando sendAbandonmentRecovery diretamente...');
        const appUrl = process.env.BASE_URL || 'http://localhost:3333';
        const recoveryUrl = `${appUrl}/?token=${recoveryToken}`;

        const [abandonResult] = await Promise.allSettled([
            sendAbandonmentRecovery(supabase, CUSTOMER, [TEST_ITEM], recoveryUrl)
        ]);

        if (abandonResult.status === 'fulfilled') {
            console.log('[WHATSAPP TRIGGER OK - ABANDONO]');
            console.log('[EMAIL TRIGGER OK - ABANDONO]');
        } else {
            console.error('❌ [WHATSAPP TRIGGER FAIL - ABANDONO]', abandonResult.reason?.message ?? abandonResult.reason);
            console.error('❌ [EMAIL TRIGGER FAIL - ABANDONO]');
        }
    }

    // ── LIMPEZA ──────────────────────────────────────────────
    console.log('');
    console.log('[LIMPEZA] Removendo dados de simulação...');
    await supabase.from('carrinhos').delete().eq('id', cart.id);
    await supabase.from('pedidos').delete().eq('id', order.id);
    console.log('   ✅ Pedido e carrinho de teste removidos.');
    console.log('   ℹ️  Cliente mantido (upsert — pode existir em produção).');

    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log('  SIMULAÇÃO CONCLUÍDA');
    console.log('══════════════════════════════════════════════════════');
    console.log('');
    process.exit(0);
}

run().catch(err => {
    console.error('❌ ERRO FATAL:', err.message ?? err);
    process.exit(1);
});
