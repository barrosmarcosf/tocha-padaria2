const { requestInteligente } = require('../src/utils/http-client');

// Mock globale do fetch para teste sem internet
global.fetch = async (url) => {
    console.log(`[MOCK] Recebido: ${url}`);
    
    if (url === 'https://fail-404.com') {
        return {
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Not Found'
        };
    }
    
    if (url === 'https://success-200.com') {
        return {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: {
                get: (name) => name === 'content-type' ? 'application/json' : null
            },
            json: async () => ({ id: 1, message: 'Sucesso Mockado' })
        };
    }

    throw new Error('Erro de Conexão');
};

async function runMockTest() {
    console.log('--- TESTE MOCK: Verificando lógica de fallback ---');

    const urls = [
        'https://fail-404.com',     // 404 -> deve pular
        'https://network-error.com', // Erro de rede -> deve pular
        'https://success-200.com'    // 200 -> deve retornar
    ];

    try {
        const { data } = await requestInteligente(urls);
        console.log('\n✅ TESTE MOCK FINALIZADO');
        console.log('Mensagem:', data.message);
    } catch (error) {
        console.error('\n❌ TESTE MOCK FALHOU', error);
    }
}

runMockTest();
