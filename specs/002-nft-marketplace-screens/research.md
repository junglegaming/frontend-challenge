# Research: Telas do Marketplace de NFTs (Mobile + Desktop)

## D1 — Login e Cadastro como um único diálogo, montado por duas rotas

**Decisão**: `AuthDialog` é um único componente (tabs "Entrar" / "Criar conta") em
`domains/auth/components/AuthDialog.tsx`. As rotas `/login` e `/signup` (TEAMS.md) renderizam a
mesma `AuthDialogPage`, cada uma passando a aba inicial (`defaultTab="login" | "signup"`) e
preservando o `redirect` da query string. O diálogo é sempre exibido sobre a última rota não-auth
visitada (fundo semi-transparente com o catálogo/página anterior), igual aos designs.

**Razão**: os designs (`Login.png`, `Cadastro.png`) mostram o mesmo modal com troca de aba sobre o
fundo da Home; a tabela de rotas de `docs/TEAMS.md` já prevê `/login` e `/signup` como rotas
distintas. As duas exigências são conciliadas tratando o modal como o componente, e a rota apenas
como o ponto de entrada/aba inicial — sem violar o Princípio I (o componente mora no domínio `auth`,
não em duas páginas duplicadas).

**Alternativas consideradas**: duplicar o formulário em `pages/login` e `pages/signup`
separadamente — rejeitada por violar DRY e o Princípio I (lógica repetida entre páginas deve subir
para o domínio); usar apenas uma rota `/login?mode=signup` — rejeitada por não corresponder às rotas
já documentadas em `docs/TEAMS.md` e no README de cada página.

## D2 — Campos do formulário de Pagamento mapeados aos contratos existentes

**Decisão**: o formulário de checkout (`Pagamento.png`) é implementado contra os contratos já
existentes — não introduz campos novos no backend simulado:

| Campo visível no design | Campo do contrato | Observação |
|---|---|---|
| Nome de exibição | `CollectorDetails.fullName` | — |
| E-mail | `CollectorDetails.email` | — |
| Observação do colecionador (opcional) | `CollectorDetails.note` | — |
| Rede | `CreateOrderRequest.network` (`Network`) | select com `NETWORK_LABELS` |
| Endereço da carteira / Tipo de carteira / "Usar outra carteira?" | seleção de uma `Wallet` salva (lista `GET /wallets`, `WalletProvider`) ou criação inline via `WalletInput` → `CreateOrderRequest.walletId` | a lista de opções no rodapé do design (MetaMask/Coinbase/"conectar") é o seletor de `walletId` |
| Nome de usuário / Nome do perfil / Nome ENS | **sem contrato correspondente em `checkout`/`orders`** | tratado como leitura do perfil já salvo (`Profile.username`, `Profile.ensName`/`ensTld`) quando existir; não é enviado em `CreateOrderRequest` |
| Código de indicação | **sem contrato correspondente** | campo mantido apenas visualmente (não persistido) nesta iteração — ver Assunções do spec sobre escopo do backend |
| País (exigido por `CollectorDetails.country`, sem campo visível no design) | derivado de um valor padrão fixo (`"BR"`) quando não coletado na UI | evita expandir o formulário além do design de referência |

**Razão**: Princípio V proíbe dado fictício fora de `src/mocks`; como o backend simulado é
considerado completo para este escopo (spec, seção Assunções), campos do design sem contrato
correspondente não podem ser "inventados" como se persistissem — são omitidos do payload ou
preenchidos a partir de um domínio que já os possui (perfil).

**Alternativas consideradas**: estender `CollectorDetails`/`WalletInput` com os campos extras —
rejeitada por exigir mudança de mocks/backend fora do escopo desta feature (constituição: "fora de
escopo... gateways de pagamento"; e a spec assume o backend como estável); omitir os campos
visualmente — rejeitada por quebrar a fidelidade visual exigida pelo Princípio VI.

## D3 — Formulário de Carteiras mapeado a `WalletInput` + campos de Perfil

**Decisão**: o formulário de "Carteira principal/secundária" (`Carteiras.png`) grava um `WalletInput`
(`slot`, `label` ← "Apelido da carteira", `provider` ← "Tipo de carteira", `address`, `networks` ←
"Rede") por `POST/PUT /wallets`. "Nome de exibição", "Nome do perfil" e "Nome ENS" exibem (somente
leitura ou edição delegada) os campos já existentes em `Profile` (`name`, `username`,
`ensName`/`ensTld`) em vez de duplicá-los no domínio `wallets`. "Código de indicação" segue a mesma
decisão de D2 (apenas visual nesta iteração). "Igual à carteira principal" copia os valores do
`WalletInput` da carteira principal para o formulário da secundária antes de enviar
`slot: 'secondary'`.

**Razão**: evita duplicar estado entre `profile` e `wallets` (Princípio I — um domínio por
responsabilidade) e mantém o formulário fiel ao design sem expandir contratos fora do escopo.

## D4 — Chave de idempotência do checkout

**Decisão**: ao entrar em `/checkout` com uma cotação (`Quote.signature`) válida, o domínio
`checkout` gera (ou recupera) uma `idempotencyKey` (UUID v4) associada a essa `signature` e a
mantém em memória da mutation (TanStack Query `mutationKey`/estado do formulário) até a mutation
resolver com sucesso ou o carrinho mudar (nova `signature`). Retentativas após timeout/erro de rede
reenviam a mesma chave; o backend simulado (`orders` handlers) já é responsável por tratar
duplicatas pela chave.

**Razão**: Princípio III exige idempotência em operações de pedido; associar a chave à assinatura da
cotação evita reaproveitar uma chave antiga contra uma cotação diferente (edge case do spec: "retry
após timeout não deve duplicar o pedido").

**Alternativas consideradas**: gerar nova chave a cada clique em "Confirmar compra" — rejeitada, pois
permitiria duplicar o pedido em caso de duplo clique/retry; persistir a chave em `localStorage` —
rejeitada por sobreviver além do ciclo de vida da aba/sessão sem necessidade.

## D5 — Interação com atualização otimista exigida pelo Princípio III

**Decisão**: o stepper de quantidade de edição no Carrinho (`+`/`-` por linha) usa atualização
otimista: a UI recalcula a linha e os totais imediatamente, envia `PATCH` em segundo plano, e reverte
(rollback) o valor anterior se a mutação falhar (ex.: quantidade excede o estoque), mostrando o erro
inline.

**Razão**: cumpre a exigência explícita do Princípio III ("ao menos uma interação MUST usar
atualização otimista com rollback") no ponto de maior frequência de interação desta feature.

## D6 — Componentes shadcn/ui adicionais necessários

**Decisão**: instalar via `pnpm dlx shadcn@latest add <componente>` (nunca reescrever à mão, Regra 8
de `docs/TEAMS.md`):

- `sheet` — drawer de filtros/busca no mobile (Home) e, opcionalmente, o próprio `AuthDialog` em
  telas muito estreitas, se o `Dialog` atual não couber sem rolagem horizontal.
- `slider` — faixa de preço (Home).
- `radio-group` — seleção de carteira/rede no checkout, seleção de tipo de carteira.
- `textarea` — "Observação do colecionador".
- `checkbox` — "Igual à carteira principal", "Usar outra carteira?".

Todos adaptados ao tema existente (`src/index.css`, paleta/tipografia de 001); nenhum novo token é
criado.

## D7 — Guard de rota protegida com retorno pós-login

**Decisão**: rotas protegidas (`/checkout`, `/account/wallets`, `/orders/$orderId`) usam
`beforeLoad` do TanStack Router para checar a sessão (`domains/auth`); se ausente, redirecionam para
`/login?redirect=<rota solicitada>`. Após autenticação bem-sucedida, `AuthDialog` lê `redirect` da
query string e navega de volta.

**Razão**: atende FR-007/FR-012 do spec e ao padrão já usado pela query string do catálogo
(estado na URL, Princípio III).

## D8 — Assets visuais

**Decisão**: as imagens de NFT usadas pelas telas continuam vindo do pipeline já existente
(`src/mocks/fixtures/nfts.ts`, `scripts/generate-art.mjs`), não dos PNGs do desafio — os PNGs em
`Mobile/`/`Desktop/` servem apenas como referência de layout/conteúdo (textos, campos, estados),
conforme a seção de Assunções do spec. Nenhuma pré-condição bloqueante foi encontrada (sem
marcadores de merge pendentes, diferente do bloqueio registrado em `001-design-system-standards`).
