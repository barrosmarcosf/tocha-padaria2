# 🛑 ZONA DE PROTEÇÃO CONTRA REGRESSÃO (ÁREA BLINDADA)

Este documento dita as GRADES DE PROTEÇÃO ABSOLUTA de arquivos, sub-módulos e fluxos já aprovados do projeto corporativo.
A quebra de qualquer ordem descrita abaixo configurará regressão crítica do sistema e é **estritamente proibida**.

As seguintes páginas de Painel Admin estão **100% DECLARADAS FINALIZADAS E INTOCÁVEIS:**
- **Início** (Dashboard Visual / Performance)
- **Pedidos** (Quadro Kanban KanbanBoard)
- **Histórico de Pedidos** (Paginação Histórica e Modais Detalhados)
- **Loja** (Navegação Menu Oculto/Sidebar Dropdown)
- **Sobre a Loja** (Customização de Links, Configurações de Estabelecimento)
- **Configuração Home Page** (Banners, Textos Dinâmicos Hero, Imagem Destaque)

---

## 1. MAPEAMENTO DO ESCOPO PROTEGIDO

### Arquivos Fortemente Acoplados as Páginas Protegidas
* `public/admin/admin.js` (Funções: `renderDashboard`, `renderPerformance`, `renderOrders`, `renderHistoricoPedidos`, `renderStoreInfo`, `renderConfigHome`, `renderProfile`, e lógica de Roteamento Base `navTo`)
* `public/admin/index.html` (Painel master `sidebar`, estrutura nativa `#admin-main` e navegações nativas).
* `public/admin/admin.css` (Tais como `.metric-card`, `.status-*`, sistema modal `historico-modal`, variáveis de tema).
* `src/routes/admin.js` (Endpoints de leitura/escrita relativas às páginas como `/update-profile`, `/orders`, `/dashboard`, `/metrics`, `/save-content`).
* `public/app.js` (Lógica pública dependente de `site_content` alimentado via admin config - Hero title, banner, whatsapp updater).
* `public/index.html` e `public/nossa-historia.html` (Alvos das atualizações da API do Backoffice - Retângulos e Tags).

### Componentes / Hooks Compartilhados 
- Módulo `window.navTo()` de roteamento DOM.
- Funcionalidade Modal nativa via `.active` em `admin.css`.
- Função `showToast()` de alerta nativo.
- Função `fetchData()` que injeta dados correntes no `.state`.
- Componentes visuais como `renderMetricCard`, Dropdowns do `ChartJS`, Gráficos Apex/Chart base.

---

## 2. REGRAS DE CONGELAMENTO (STRICT MODE OBRIGATÓRIO)

- **Layout e Estrutura:** Não reposicionar divs, não trocar de grid para flex, não encadear novos `wrappers` sobre os existentes.
- **Estilos Globais e Tipografia:** As famílias (ex. `Anton`, `Outfit`, `Inter`) e pesos continuam intocáveis. Espaçamentos base não devem receber overrides (`!important`).
- **Estados Visuais Puros:** Cores de card, botões ("Atualizar Home Page", "Salvar", dropdowns azuis do kanban), continuam como estão hoje.
- **Não Renomear/Mover Arquivos:** Rotas de API e chaves de JSON persistidas em bancos são de legado intocável.

---

## 3. NOVA ARQUITETURA PARA IMPLEMENTAÇÕES FUTURAS

Toda implementação adicional no backoffice ou site DEVE criar sua própria teia de isolamento:
* **Novas Páginas:** Desenvolvidas num final de `else if` no `renderSection` dentro do `admin.js`, com sua própria função (`ex: renderFinancas()`) e tags inline com CSS isolado para não sujar o global.
* **Componentes Derivados:** Se uma aba precisar de um _cartão_ (Card) similar aos de Visão Geral (`metric-card`), o novo escopo criará sua própria div (ex: `class="financas-metric-card"`) com propriedades separadas na estilização.
* **Mantenha os Módulos Cegos:** Os Módulos Congelados **NÃO DEVEM** saber que novos módulos foram criados. Nenhuma `import` ou lógica compartilhada deles deverão ser apontadas/acopladas a novas mecânicas.

---

## 4. BLOQUEIO DE IMPACTO INDIRETO (CUIDADO REDOBRADO)

É **bloqueado o uso ou mapeamento de**:
- Novas regras `CSS globais` genéricas sem classes (`*`, `div`, `p`, `h1`) dentro dos novos escopos visuais (`admin.css`). Tudo novo precisa ter classe nomeada ou isolada pelo ID do target container.
- Providers Globais que afetem o tráfego dos métodos primários de `orders` ou `.state`. 
- Mudança na Responsividade Global do Painel que empurre os módulos da `Sidebar` existentes fora de ordem ou corte visualizações limpas.

---

## 5. CHECKLIST OBRIGATÓRIO ANTI-REGRESSÃO 

**Antes** e **Depois** da entrega de **QUALQUER MUDANÇA FUTURA**, eu deverei utilizar os parâmetros e verificações astrais deste quadro obrigatório:

- [ ] A Sidebar continua mantendo exatas proporções com o Sub-Menu 'Loja' perfeitamente idêntico.
- [ ] Renderizações originais (`renderOrders()`, `renderDashboard()`, `renderConfigHome()`) abriram normalmente?
- [ ] Nenhuma Quebra de Cores Global – Botões existentes mantém seus degradês e paletas?
- [ ] Fontes Renderizadas Perfeitamente sem overrides inesperados.
- [ ] Consoles de Navegador Zerados nas Vistas Originais (Sem erros `SyntaxError` de novas atualizações corrompendo legado).
- [ ] Responsividade Segura nos Celulares para os Módulos Velhos.
- [ ] As interações de banco (`saveConfigHome()`, arrastar Kanban) reagem sem recarregar e ativam loaders na exata forma nativa.

> Toda implementação futura iniciará ciente destas validações estritas, marcando o ciclo zero-regressão à risca.
