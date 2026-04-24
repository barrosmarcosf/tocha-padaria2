/**
 * Função de requisição inteligente que suporta fallback de URLs em caso de erro 404.
 * 
 * @param {string|string[]} urls - Uma única URL ou array de URLs para tentar em sequência.
 * @param {Object} options - Opções de configuração para o fetch (method, headers, body, etc).
 * @returns {Promise<{response: Response, data: any}>} - Retorna o objeto de resposta e os dados convertidos.
 * @throws {Error} - Se todas as tentativas falharem ou houver erro de rede.
 */
async function requestInteligente(urls, options = {}) {
    const urlList = Array.isArray(urls) ? urls : [urls];
    let lastError = null;
    let lastResponse = null;

    console.log(`\n🚀 Iniciando requisição inteligente (${options.method || 'GET'})...`);

    for (let i = 0; i < urlList.length; i++) {
        const currentUrl = urlList[i];
        const attempt = i + 1;

        try {
            console.log(`\n[Tentativa ${attempt}/${urlList.length}] Requisitando: ${currentUrl}`);
            
            const response = await fetch(currentUrl, options);
            
            if (response.ok) {
                console.log(`✅ Sucesso! Status: ${response.status}`);
                
                // Tenta extrair dados JSON ou Texto
                const contentType = response.headers.get('content-type');
                let data = null;
                
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }

                return { response, data };
            }

            if (response.status === 404) {
                console.warn(`⚠️  Aviso: URL retornou 404 (Não Encontrada).`);
                lastResponse = response;
                if (i < urlList.length - 1) {
                    console.log(`⏭️  Tentando próxima URL da lista...`);
                    continue;
                }
            } else {
                // Outros erros (500, 403, etc) que não são 404
                console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
                const errorBody = await response.text();
                throw new Error(`Erro HTTP ${response.status}: ${errorBody}`);
            }

        } catch (error) {
            lastError = error;
            console.error(`❌ Falha na tentativa ${attempt}: ${error.message}`);
            
            // Se for erro de rede (não HTTP) e houver mais URLs, continua
            if (i < urlList.length - 1) {
                console.log(`⏭️  Tentando próxima URL devido a erro de rede...`);
                continue;
            }
        }
    }

    console.error(`\n🛑 Todas as tentativas falharam.`);
    
    if (lastResponse && lastResponse.status === 404) {
        throw new Error(`Falha total: Todas as URLs retornaram 404.`);
    }

    throw lastError || new Error('Falha desconhecida na requisição inteligente.');
}

module.exports = { requestInteligente };
