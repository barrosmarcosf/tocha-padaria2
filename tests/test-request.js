const { requestInteligente } = require('../src/utils/http-client');

/**
 * Script de teste para a função requestInteligente.
 * Demonstra a tentativa falha (404) e a recuperação automática na próxima URL.
 */
async function runTest() {
    console.log('--- TESTE: requestInteligente com fallback de URLs ---');

    const urls = [
        'https://jsonplaceholder.typicode.com/invalid-path-12345', // Retorna 404
        'https://httpstat.us/404',                                 // Retorna 404
        'https://jsonplaceholder.typicode.com/posts/1'          // Retorna 200 (Sucesso)
    ];

    try {
        const { response, data } = await requestInteligente(urls, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('\n✅ TESTE FINALIZADO COM SUCESSO');
        console.log('Status Final:', response.status);
        console.log('Dados Recebidos (ID):', data.id);
        console.log('Título:', data.title);
        
    } catch (error) {
        console.error('\n❌ TESTE FALHOU');
        console.error('Erro Final:', error.message);
    }
}

// Executar o teste
runTest();
