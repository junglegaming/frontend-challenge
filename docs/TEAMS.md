# Organização do código

O projeto separa **páginas** (o que o usuário vê, uma pasta por tela) de **domínios** (regras de negócio
compartilhadas entre telas). Cada time é dono de uma ou mais páginas e consome os domínios pela API pública.

```
src/
  app/        router, providers, layout raiz e rotas finas (src/app/routes)
  pages/      UMA PASTA POR PÁGINA do e-commerce
  domains/    regras de negócio (DDD): contratos, API, cache, eventos
  shared/     design system (shadcn/ui), Axios, Socket.IO, utilitários
  mocks/      MSW: banco simulado, fixtures, handlers, cenários, socket
e2e/          Playwright, uma pasta por página
```

## Páginas

| Pasta | Página | Rota | Domínios usados |
| --- | --- | --- | --- |
| `pages/home` | Início | `/` | catalog, favorites, cart |
| `pages/nft-detail` | Detalhes do NFT | `/nft/$nftId` | catalog, favorites, cart |
| `pages/cart` | Carrinho | `/cart` | cart, catalog |
| `pages/checkout` | Pagamento | `/checkout` | cart, wallets, orders, checkout, auth |
| `pages/order-confirmation` | Confirmação de pedido | `/orders/$orderId` | orders |
| `pages/login` | Login | `/login` | auth, cart |
| `pages/signup` | Cadastro | `/signup` | auth, cart |
| `pages/profile` | Perfil do colecionador | `/account/profile` | profile, auth |
| `pages/wallets` | Carteiras | `/account/wallets` | wallets |
| `pages/not-found` | 404 | qualquer rota inexistente | — |

Anatomia de uma página:

```
src/pages/<página>/
  <Página>Page.tsx   componente da página
  components/        componentes exclusivos desta página
  index.ts           exporta a página para a rota
  README.md          escopo, rota e domínios usados
```

## Domínios

| Domínio | Responsabilidade |
| --- | --- |
| `catalog` | NFTs, edições, busca/filtros, `nft.updated` |
| `favorites` | Favoritos por usuário (otimista + rollback) |
| `cart` | Carrinho, cupom, cotação, merge do visitante |
| `checkout` | Dados do colecionador, rede, idempotência |
| `orders` | Pedidos, `order.updated`, recibo |
| `auth` | Sessão, cadastro, login, expiração |
| `profile` | Perfil, avatar, senha |
| `wallets` | Carteiras e conexão simulada |

```
src/domains/<domínio>/
  model/       contratos (DTOs) e regras puras, sem React e sem Axios
  api/         funções Axios + queryOptions/queryKeys
  hooks/       queries, mutations e eventos de tempo real
  components/  componentes reutilizados por mais de uma página
  index.ts     API pública
```

## Regras de dependência (verificadas por `pnpm lint`)

```
app/routes  →  pages  →  domains  →  shared
```

1. Uma página **não importa outra página**. Componentes usados por duas páginas sobem para um domínio ou para `shared/ui`.
2. Páginas e rotas importam domínios apenas por `@/domains/<domínio>` (o `index.ts`), nunca por caminhos internos.
3. Rotas importam páginas apenas por `@/pages/<página>`.
4. Dentro da própria página ou domínio, use imports relativos (`./components/...`, `../model/...`).
5. `shared/` não importa `app/`, `pages/` nem `domains/`.
6. **Proibido `any`**: use `unknown` + narrowing, genéricos ou tipos dos contratos.
7. Componentes, hooks e o cliente Axios **não** contêm dados fictícios: toda simulação fica em `src/mocks`.
8. `src/shared/ui/*` são componentes do shadcn/ui (gerados pela CLI oficial, `pnpm dlx shadcn@latest add <componente>`).
   Eles são adaptados ao tema do projeto via `src/index.css`, não reescritos; `react/only-export-components`
   fica desligado só nessa pasta porque é o padrão do shadcn exportar `xxxVariants` junto do componente.
