# AGENTS.md — NFT Marketplace

Desafio frontend de um marketplace de NFTs (React + TypeScript). Este arquivo é a
referência rápida para sessões de agente; detalhes estão nos docs indicados ao final.

## Comandos

> Válidos após o scaffolding (fase 1). Gerenciador: **pnpm**.

| Comando                              | O que faz                                                         |
| ------------------------------------ | ----------------------------------------------------------------- |
| `pnpm dev`                           | dev server com mocks MSW ativos                                   |
| `pnpm build` / `pnpm preview`        | build de produção / preview local                                 |
| `pnpm typecheck`                     | `tsc --noEmit`                                                    |
| `pnpm lint` / `pnpm lint:fix`        | ESLint + Prettier                                                 |
| `pnpm test:contract`                 | Vitest — handlers MSW validados contra os schemas zod             |
| `pnpm test:e2e` / `pnpm test:e2e:ui` | Playwright (Chromium desktop 1440 + mobile 390)                   |
| `pnpm lighthouse`                    | auditoria Lighthouse (3 medições/página/perfil)                   |
| `pnpm fig:extract`                   | exporta frames/estilos/ícones do Figma → `docs/figma/`, `public/` |
| `pnpm format`                        | formata arquivos com prettier                                     |

**Antes de concluir qualquer tarefa:** rodar `pnpm typecheck` e `pnpm lint`.
Depois de tocar em testes/fluxos: `pnpm test:e2e` nos specs afetados.

## Regra de prioridade máxima — layout somente estrutural

**Esta regra é de extrema importância e prevalece sobre orientações de estilo nos
demais documentos e skills do projeto. Só deve ser ignorada a pedido explícito do
usuário, no escopo solicitado.**

- Todo layout novo ou alterado deve implementar apenas estilos estruturais, como
  `position`, `display`, `flex`, `grid`, alinhamento e organização dos elementos.
- Não adicionar estilos visuais: `padding`, `margin`, `gap` e outros espaçamentos,
  `cores`, `fundos`, `tipografia`, `bordas decorativas`, `raios`, `sombras` ou animações
  decorativas. Uma referência visual ou do Figma, por si só, não autoriza esses
  estilos.
- **Sempre procurar componentes existentes na codebase antes de implementar
  qualquer componente ou layout.** Reutilizar os componentes adequados e preservar
  seus estilos existentes; não é necessário removê-los para cumprir esta regra.
- Preservar os estilos já existentes que garantem acessibilidade, incluindo foco
  visível, e manter os requisitos semânticos e de interação.

## Regras do projeto

1. **Stack obrigatória (não substituir):** Vite, React, TypeScript (strict),
   TanStack Router (file-based), TanStack Query, Axios, Tailwind CSS v4, shadcn/ui,
   MSW, Socket.IO (`socket.io-client`), Playwright.
2. **Camada de rede:** toda chamada REST passa por `src/lib/http` (Axios) e todo evento
   em tempo real por `src/lib/socket`. Mocks existem apenas em `src/mocks/` — nunca
   resposta fictícia, `fetch` direto ou branch de negócio dentro de componente/hook.
3. **Dinheiro:** valores ETH são **string decimal** e só são calculados em
   `src/lib/money.ts` (decimal.js). Proibido `number`/`parseFloat` em valores monetários.
4. **Contratos:** os shapes de API estão em `docs/api/`; tipos do cliente derivam de
   zod (`z.infer`). Mudança de contrato = alterar o doc **e** o schema junto.
5. **Rotas privadas** (`checkout`, `orders/:id`, `profile`, `wallets`) são protegidas
   por `beforeLoad` com redirect `?redirect=` — não duplicar guard em componente.
6. **Query keys** sempre pela factory em `src/lib/query/keys.ts`, incluindo `userId`
   (`"anon"` quando visitante). Mutations seguem a tabela de invalidação do
   `ARCHITECTURE.md` §3.3; otimismo segue o molde cancel→snapshot→apply→rollback.
7. **Eventos socket:** aplicar só se `version > última conhecida`; nunca efeito direto
   na UI sem passar pelo cliente em `lib/socket` (critério eliminatório do desafio).
8. **Estados de dados:** toda tela que consome dados precisa de loading, vazio,
   erro (retry) e sucesso. Reutilizar os componentes de estado existentes — ver
   padrões em `docs/ESTILOS.md` §5, respeitando a regra de layout somente estrutural.
9. **Acessibilidade:** foco visível sempre, labels/erros associados (`aria-describedby`),
   feedback de mutations/anúncios `aria-live`, suporte a `prefers-reduced-motion`.
10. **Testes:** cada spec parte de estado isolado (`POST /api/_mock/reset` + cenário via
    `addInitScript`); nunca depender da ordem de execução entre specs.

11. **Estilização:** o único arquivo CSS do projeto é `src/styles/global.css`.
    Use Tailwind inline em `className` apenas para estilos permitidos pela regra
    de layout somente estrutural. Não criar CSS por componente ou feature;
    utilitários personalizados somente com reutilização concreta.

12. **Classes canônicas do Tailwind:** sempre verificar os diagnósticos informativos
    e warnings `tailwindcss(suggestCanonicalClasses)` ao criar ou alterar estilos.
    Substituir classes arbitrárias pelas classes canônicas sugeridas quando forem
    equivalentes no tema configurado e permitidas pela regra de layout somente
    estrutural. Manter valores arbitrários somente quando
    não houver equivalente canônico. Essa verificação complementa o lint; não
    presumir que o ESLint verifica esses diagnósticos do Tailwind IntelliSense.

13. **Componentes reutilizáveis:** antes de criar um componente, procurar sempre
    uma implementação adequada na codebase e também na biblioteca do shadcn/ui.
    Priorizar a reutilização; se faltar uma implementação local, avaliar o
    componente do shadcn/ui antes de criar uma solução própria. A consulta ou
    adoção do shadcn/ui não dispensa a regra de layout somente estrutural; a
    preservação de estilos se aplica aos componentes já existentes na codebase.
    Criar componentes compartilhados somente com reutilização concreta, com API
    composável, acessível e responsabilidade bem definida.

14. **Compound Pattern:** preferir componentes reutilizáveis compostos por partes
    combináveis, como `Root`, `Trigger`, `Content` e `Item`, seguindo os padrões do
    Radix UI e do shadcn/ui. Compartilhar estado via contexto quando necessário,
    mantendo liberdade de composição e evitando componentes monolíticos com muitas
    props para controlar a estrutura. Usar uma API simples quando a composição em
    partes não trouxer benefício concreto.

## Decisões já tomadas (não rediscutir sem motivo)

- Estrutura **feature-first** + rotas file-based — árvore em `docs/ESTRUTURA.md`.
- Sessão: token opaco em `localStorage gm_session`, 2h, sem refresh silencioso.
- Pedido: chave de idempotência persistida (`gm_pending_order`); confirmação só com
  `status === "confirmed"` vindo da simulação.
- Cenários de mock selecionáveis (env/URL/switcher) — catálogo em `docs/MOCKS.md`.

## Onde ler antes de mexer em algo

**Em caso de dúvidas, consultar primeiro o `README.md`**, que apresenta a solução
e sua execução. Para o enunciado, os critérios e as entregas do desafio, consultar
`docs/DESAFIO.md`; depois, os documentos específicos abaixo.
Antes de perguntar ao usuário, procurar a resposta nessas referências. Se a dúvida
persistir, indicar o que foi consultado e qual informação continua faltando; não
presumir que o usuário conhece detalhes que o enunciado não esclarece.

| Assunto                                      | Arquivo                                 |
| -------------------------------------------- | --------------------------------------- |
| Estrutura de pastas, rotas, scripts, fases   | `docs/ESTRUTURA.md`                     |
| Cores, tipografia, componentes reutilizáveis | `docs/ESTILOS.md`                       |
| Contratos REST (endpoints, erros, modelos)   | `docs/api/README.md` (+ resource files) |
| Sessão, cache, tempo real, dinheiro, erros   | `ARCHITECTURE.md`                       |
| Cenários MSW, Socket.IO no mock, Playwright  | `docs/MOCKS.md`                         |
| Enunciado do desafio (critérios, entregas)   | `docs/DESAFIO.md`                       |
