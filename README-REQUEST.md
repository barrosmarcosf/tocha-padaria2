# Guia da Função `requestInteligente`

Esta solução foi criada para lidar com erros HTTP 404 de forma automática, permitindo que sua aplicação tente URLs alternativas em caso de falha.

## 🛠️ Passo a Passo para Integrar

1.  **Crie o diretório de utilitários** (se não existir):
    `mkdir src/utils`

2.  **Adicione o código** da função no arquivo `src/utils/http-client.js` (como fornecido no projeto).

3.  **Importe e utilize** nos seus serviços (exemplos abaixo).

***

## ✅ 5 Exemplos Práticos

### 1️⃣ Requisição GET Simples com Fallback
Tente carregar uma configuração de dois endpoints diferentes.

```javascript
const { requestInteligente } = require('./src/utils/http-client');

async function getConfig() {
    const backupUrls = [
        'https://api.meusite.com/config-v2', // Tenta esta primeiro
        'https://api.meusite.com/config-v1'  // Fallback se a v2 retornar 404
    ];

    const { data } = await requestInteligente(backupUrls);
    console.log('Frequência:', data.update_interval);
}
```

### 2️⃣ Requisição POST com Corpo JSON
Enviando dados para uma API, com fallback em caso de endpoint de publicação indisponível.

```javascript
const { requestInteligente } = require('./src/utils/http-client');

async function enviarPedido(pedido) {
    const endpoints = [
        'https://checkout.padaria.com/api/orders',
        'https://backup.padaria.com/api/orders'
    ];

    const { data } = await requestInteligente(endpoints, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
    });

    console.log('Pedido confirmado com ID:', data.id);
}
```

### 3️⃣ Fallback entre Domínios Diferentes (Produção vs Homologação)
Útil para ambientes de teste que podem ou não ter os mesmos endpoints.

```javascript
const endpoints = [
    'https://producao.api.com/user/123',
    'https://staging.api.com/user/123'
];

try {
    const { response, data } = await requestInteligente(endpoints);
    console.log(`Dados carregados de: ${endpoints[endpoints.indexOf(response.url)]}`);
} catch (e) {
    console.error('Nenhum ambiente possui este usuário.');
}
```

### 4️⃣ Uso com Headers Customizados (Autenticação)
Mantendo os headers iguais para todas as tentativas.

```javascript
const { data } = await requestInteligente(['url-a', 'url-b'], {
    headers: {
        'Authorization': 'Bearer TOKEN_AQUI',
        'X-Custom-Header': 'Valor'
    }
});
```

### 5️⃣ Tratamento de Erro Final
Como lidar se absolutamente todas as tentativas falharem com 404.

```javascript
try {
    await requestInteligente(['404-1', '404-2']);
} catch (error) {
    if (error.message.includes('Falha total')) {
        // Lógica específica para quando nada foi encontrado
        console.log('Redirecionando usuário para página de erro amigável...');
    }
}
```

***

## 🚀 Como Executar o Teste Prático
Para ver o "mágica" acontecendo agora mesmo, execute:

```bash
node tests/test-request.js
```

Você verá no console as tentativas falhas sendo ignoradas e a requisição de sucesso sendo processada automaticamente!
