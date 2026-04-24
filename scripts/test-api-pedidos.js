const axios = require('axios');
require('dotenv').config();

async function check() {
    try {
        const login = await axios.post('http://localhost:3333/api/admin/login', {
            email: 'barros.marcosf@gmail.com',
            password: 'Romeus12*'
        });
        const token = login.data.token;
        console.log('✅ LOGIN SUCCESS');

        const pedidos = await axios.get('http://localhost:3333/api/admin/pedidos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`📦 RECEIVED ${pedidos.data.length} ORDERS`);
        
        const today = new Date().toISOString().split('T')[0];
        const ordersToday = pedidos.data.filter(p => p.created_at.startsWith(today));
        
        console.log(`\n--- ORDERS TODAY (${today}) ---`);
        ordersToday.forEach(p => {
            console.log(`ID: ${p.id.slice(0,8)} | Status: [${p.status}] | Client: ${p.customer_name || p.clientes?.name}`);
        });

        const statusCounts = {};
        pedidos.data.forEach(p => statusCounts[p.status] = (statusCounts[p.status] || 0) + 1);
        console.log('\n--- GLOBAL STATUS COUNTS ---');
        console.log(statusCounts);

    } catch (e) {
        console.error('❌ ERROR:', e.response?.data || e.message);
    }
}
check();
