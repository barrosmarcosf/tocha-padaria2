/**
 * Antigravity High-Resilience HTTP Client (Evolved)
 * Centraliza e protege todas as chamadas de IA do projeto.
 */

require('dotenv').config();

const ALLOWED_MODELS = [
    'antigravity-gemini-3-pro',
    'antigravity-gemini-3-flash'
];

const PRIMARY_MODEL = process.env.ANTIGRAVITY_MODEL_PRIMARY || 'antigravity-gemini-3-pro';
const FALLBACK_MODEL = process.env.ANTIGRAVITY_MODEL_FALLBACK || 'antigravity-gemini-3-flash';
const API_URL = process.env.ANTIGRAVITY_API_URL || 'https://api.cloudaicompanion.com/v1/generate';

// Circuit Breaker State
let failureCount = 0;
let lastFailureTime = 0;
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN = 30000; // 30 segundos

/**
 * Valida o modelo solicitado contra a allowlist.
 */
function validateModel(modelName) {
    if (ALLOWED_MODELS.includes(modelName)) {
        return modelName;
    }
    console.warn(`[Antigravity] Modelo solicitado '${modelName}' não permitido. Usando: ${PRIMARY_MODEL}`);
    return PRIMARY_MODEL;
}

/**
 * Normaliza o payload para o formato esperado pela IA.
 * Suporta o formato padrão (input) e o formato alternativo (messages).
 */
function normalizePayload(payload, model, useMessages = false) {
    const input = payload.input || payload.prompt || payload.message || "";
    
    if (useMessages) {
        return {
            model: model,
            messages: [{ role: "user", content: input }]
        };
    }

    return {
        model: model,
        input: input,
        stream: !!payload.stream
    };
}

/**
 * Classifica o erro para tomada de decisão (Fallback vs Abort).
 */
function classifyError(status, data) {
    const errorStr = JSON.stringify(data).toLowerCase();

    if (status === 404) {
        // Se houver "model" no erro ou padrões típicos de recurso não encontrado
        if (errorStr.includes("model") || errorStr.includes("not found") || errorStr.includes("not_found") || errorStr.includes("entity")) {
            return 'MODEL_NOT_FOUND';
        }
        // Fallback seguro: Em caso de 404 sem corpo informativo, tratamos como problema de endpoint
        return 'ENDPOINT_NOT_FOUND';
    }

    if (status === 400) return 'INVALID_PAYLOAD';
    if (status === 408 || status === 504) return 'TIMEOUT';
    if (status === 429) return 'RATE_LIMIT';
    
    return 'NETWORK_OR_SERVER_ERROR';
}

/**
 * Executa chamada ao Antigravity com resiliência total.
 * Utiliza o ANTIGRAVITY_API_URL como endpoint exclusivo.
 */
async function callAntigravity(payload = {}, options = {}) {
    // 1. Circuit Breaker Check
    const now = Date.now();
    if (failureCount >= BREAKER_THRESHOLD && (now - lastFailureTime < BREAKER_COOLDOWN)) {
        console.error(`[Antigravity] Circuit Breaker ATIVO. Bloqueando chamada por segurança.`);
        return { success: false, message: "Serviço de IA temporariamente indisponível", error_code: "AI_UNAVAILABLE" };
    }

    // Lista de endpoints para fallback (Prioridade: Env > Generate > Chat)
    const endpoints = [
        process.env.ANTIGRAVITY_API_URL || API_URL,
        'https://api.cloudaicompanion.com/v1/generate',
        'https://api.cloudaicompanion.com/v1/chat/completions'
    ];

    const requestedModel = payload.model || PRIMARY_MODEL;
    const finalModel = validateModel(requestedModel);
    const traceId = options.traceId || `ag-${Math.random().toString(36).substr(2, 9)}`;

    const executeRequest = async (currentModel, targetUrl, isFallback = false, useMessages = false) => {
        const body = normalizePayload(payload, currentModel, useMessages);
        
        console.log(JSON.stringify({
            layer: "antigravity-client",
            requestedModel,
            finalModel: currentModel,
            endpoint: targetUrl,
            format: useMessages ? "messages" : "default",
            traceId,
            fallbackTriggered: isFallback,
            status: "REQUESTING"
        }));

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Cloudaicompanion-Trace-Id': traceId,
                    ...options.headers
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const errorType = classifyError(response.status, data);
                return { success: false, errorType, status: response.status, data };
            }

            // Sucesso!
            failureCount = 0;
            return { success: true, data };

        } catch (error) {
            if (error.name === 'AbortError') return { success: false, errorType: 'TIMEOUT' };
            return { success: false, errorType: 'NETWORK', error: error.message };
        }
    };

    // --- LOGICA DE TENTATIVAS (Endpoints + Fallback Model) ---
    let result;
    
    // Tenta cada endpoint com o modelo primário
    for (const url of endpoints) {
        result = await executeRequest(finalModel, url);
        if (result.success) break;
        
        // Se o erro NÃO for 404, não adianta trocar de endpoint
        if (result.errorType !== 'ENDPOINT_NOT_FOUND' && result.errorType !== 'MODEL_NOT_FOUND') break;
        console.warn(`[Antigravity] Erro 404 no endpoint: ${url}. Tentando próximo...`);
    }

    // Se falhou em todos os endpoints, analisa o tipo de falha
    if (!result.success) {
        failureCount++;
        lastFailureTime = Date.now();

        // Se o payload foi rejeitado, tenta o formato alternativo (messages) no endpoint estável de Chat
        if (result.errorType === 'INVALID_PAYLOAD') {
            console.warn(`[Antigravity] Erro de Payload. Tentando formato alternativo (Chat Completions)...`);
            result = await executeRequest(finalModel, endpoints[2], false, true);
        }

        // Se ainda falhar (ou se for erro de modelo/endpoint), tenta Fallback de Modelo
        if (!result.success && (result.errorType === 'MODEL_NOT_FOUND' || result.errorType === 'ENDPOINT_NOT_FOUND' || result.errorType === 'INVALID_PAYLOAD')) {
            console.warn(`[Antigravity] Fallback de modelo acionado para: ${FALLBACK_MODEL}`);
            result = await executeRequest(FALLBACK_MODEL, endpoints[1], true);
        } 
        else if (!result.success && (result.errorType === 'TIMEOUT' || result.errorType === 'NETWORK')) {
            console.warn(`[Antigravity] Retry leve para: ${result.errorType}`);
            result = await executeRequest(finalModel, endpoints[0]);
        }
    }

    // Resultado Final
    if (result.success) return result.data;

    // Proteção de Produção: Resposta controlada se tudo falhar
    console.error(`[Antigravity] FALHA DEFINITIVA APÓS TENTATIVAS:`, {
        traceId,
        errorType: result.errorType,
        status: result.status
    });

    return {
        success: false,
        message: "Serviço de IA temporariamente indisponível, tente novamente.",
        error_code: "AI_UNAVAILABLE"
    };
}

module.exports = {
    callAntigravity,
    validateModel
};

