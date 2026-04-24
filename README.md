# Tocha Padaria - Sistema de Vendas v4.0

Sistema ultra-premium de e-commerce local com checkout via Stripe e automação total de WhatsApp.

## 🚀 Como Iniciar

### 1. Requisitos
- Node.js instalado.
- Celular com WhatsApp para o robô.

### 2. Configuração
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env` (use o `.env.example` como base).

### 3. Rodando o Servidor
Execute o comando:
```bash
node server.js
```
- **Login do Robô**: Na primeira vez, escaneie o QR Code que aparecerá no terminal com o seu WhatsApp (Aparelhos Conectados).

### 4. Recebendo Pagamentos (Local)
Para testar os pagamentos localmente, abra outro terminal e rode:
```bash
stripe listen --forward-to localhost:3333/api/webhook
```

## 🛠️ Estrutura do Projeto
- `server.js`: Servidor principal e processamento de pagamentos.
- `notification-service.js`: Cérebro do E-mail e do Tocha Bot (WhatsApp).
- `app.js`: Lógica do site e interface do usuário.
- `.wwebjs_auth/`: Pasta que salva a sua sessão do WhatsApp (não delete).

---
**Desenvolvido com ❤️ para Tocha Padaria.** 🥖🔥
