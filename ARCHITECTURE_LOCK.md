# 🛑 ÁREA PROTEGIDA E BLINDADA: DIRETRIZES DE ESTABILIDADE

Este documento foi criado seguindo orientações estritas para **BLINDAR** escopos e páginas que já atingiram maturidade e estabilidade, exigindo que permaneçam **100% INTACTOS**.

NENHUMA alteração estrutural, visual, de lógica, rotas, navegação ou tipográfica deve ser introduzida nas seções listadas a seguir sob pretexto de "melhoria" ou "padronização". Qualquer evolução no sistema deve acontecer em **NOVOS COMPONENTES** isolados, duplicando o necessário para evitar impacto colateral no legado.

## 📌 Escopo Congelado (Não Editar)

No Painel de Administração (`public/admin/admin.js` e `public/admin/index.html`), as seguintes seções e suas respectivas rotinas renderizadoras estão estritamente congeladas:

1. **Dashboard (Início)**
   - Funcionalidade central de métricas, gráficos e layout (Performance e Visão Geral).
   - Componentes chave: `renderDashboard()`, `renderPerformance()`.

2. **Pedidos (Gestão de Pedidos)**
   - O fluxo Kanban de chegada de pedidos, alteração de status e botões de ação nativos.
   - Componente chave: `renderOrders()`.

3. **Histórico de Pedidos**
   - Tabela histórico paginada, modais de visualização do pedido fechado e a mecânica do X para fechar modal.
   - Componente chave: `renderHistoricoPedidos()`.

4. **Loja (Drop-Down Navegação)**
   - As lógicas de expansão da navegação (`.sub-nav`) e layout base atrelados ao grupo "Loja". 

5. **Sobre a Loja**
   - Edição Flat do perfil da loja (`renderStoreInfo()`), incluindo campos de Nome, Telefone e endereços fixados. Integrado ao webhook de modificação instantânea com `saveStoreInfo()`.

6. **Configuração Home Page**
   - Configurações do banner, alteração do thumbnail flat (`handleHeroPhotoChange`) e a funcionalidade nativa de interpretar `*asteriscos*` nas quebras de texto descritivas (`renderConfigHome` e `saveConfigHome()`). Tudo congelado na matriz atual de layout flat e auto-salvamento.

## 🛡️ Regras de Isolamento

- **Sem refatoração Indireta:** Se você precisar usar um componente `metric-card` numa aba nova, NÃO ALTERE a classe `metric-card`. Crie `metric-card-v2` e coloque seu CSS isolado.
- **CSS intocável:** As tags inseridas dentro de `adminMain.innerHTML` em todas as rotinas congeladas usam estilos *inline*. NUNCA remova-os nem aplique CSS global que mude margens (`margin`), preenchimentos (`padding`), tamanho de fonte, família tipográfica (`Anton`, `Outfit`, `Inter`) em arquivos já implementados de forma coesa.
- **Não toque nas Rotas Atuais:** Se precisar de nova página, crie variação no `navTo()`, injetando num escopo `else if` limpo, no final da árvore. Exemplo: Se for aba XPTO, defina ela abaixo e construa tudo separadamente, mas jamais altere o comportamento das requisições REST da listagem acima para acomodar o fluxo de XPTO.

> Em suma: as requisições API de backend ligadas ao fluxo desses 6 módulos, suas respectivas renderizações no DOM e o design aprovado estão garantidos. Mexa apenas no que for categorizado como um MÓDULO NOVO.
