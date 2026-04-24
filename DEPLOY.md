# Guia de Deploy 🚀: Tocha Padaria

Este guia orienta o deploy do sistema de checkout e o robô de WhatsApp em produção.

## 📋 Requisitos para Produção
1.  **Node.js v18+**
2.  **Conta Stripe** (Modo Live/Produção)
3.  **Projeto Supabase** (Tabelas `pedidos` e `carrinhos` criadas)
4.  **Conta Nodemailer** (ou Gmail com senha de app)
5.  **WhatsApp ativo** para o Bot.

---

## 🛠️ Configuração de Ambiente (.env)
No seu servidor (Railway, Render, DigitalOcean), configure as seguintes variáveis:

```ini
# CORE
PORT=3333
BASE_URL=https://seudominio.com

# STRIPE
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# SUPABASE
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...

# NOTIFICAÇÕES & IA
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
OWNER_WHATSAPP=5521966278965
USE_AI_NOTIFICATIONS=true
ABANDON_DELAY_MINUTES=45
```

---

## 🏗️ Passos para o Deploy

### 1. Preparação do Servidor
Se estiver usando um VPS (Ubuntu/Linux), instale as dependências para o `whatsapp-web.js`:
```bash
sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libasound2
```

### 2. Instalação e Build
```bash
npm install
mkdir -p logs
```

### 3. Autenticação do Bot
Na primeira execução, o bot pedirá para escanear o QR Code no terminal. **IMPORTANTE:**
*   Se estiver usando Docker ou um serviço sem terminal persistente, use o script `npm run clean:auth` se encontrar erros de sessão.
*   Certifique-se de que a pasta `.wwebjs_auth` seja persistida se estiver usando containers.

---

## ⚙️ Manutenção de Produção

### Limpeza de Sessões
Se o WhatsApp Bot parar de responder ou der erro de "Headless", limpe a sessão:
```bash
npm run clean:auth
```

### Comandos de Log
Para monitorar a saúde do sistema em tempo real:
```bash
# Ver as últimas mensagens e erros do bot
tail -f logs/whatsapp.log 
```

---

**🥖 Boas Vendas e Fornadas! 🔥**
