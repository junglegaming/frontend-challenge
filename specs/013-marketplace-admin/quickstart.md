# Quickstart: validar a administração do marketplace

Guia de validação (não de implementação; ver `tasks.md`). Contrato: `contracts/admin-marketplace-endpoints.md`; modelo:
`data-model.md`.

## 1. Checagens estáticas

```sh
pnpm typecheck && pnpm lint && pnpm build
node apps/web/scripts/check-production-bundle.mjs
```

## 2. E2E com mocks (sem serviço externo)

```sh
pnpm --dir apps/web exec playwright test e2e/admin-dashboard e2e/admin-orders/ e2e/admin-order/
pnpm --dir apps/web exec playwright test        # suíte completa: sem falhas novas
```

Esperado: administrador vê o link e o painel; colecionador e visitante não veem o link e são recusados; a lista percorre
todos os pedidos sem repetir e filtra por estado; o detalhe mostra os mesmos valores do recibo; clicar nos menus não
recarrega a página; o acesso do admin das moedas sobrevive à navegação pelo menu.

## 3. Manual no navegador (dev)

```sh
pnpm --dir apps/web dev
```

1. Entrar como `ana@nft.dev` / `Senha@123` (conta fictícia do mock, papel admin) ⇒ link "Administração" na navegação e no menu da conta.
2. Criar pedidos com outra conta (colecionador `bruno@nft.dev` / `Senha@123`), voltar como admin: o painel conta os pedidos por estado.
3. `/admin/orders`: filtrar, paginar, abrir um pedido e comparar com o recibo do comprador (`/orders/<id>` como o dono).
4. Com a barra de Rede aberta, clicar nos itens do menu: nenhuma recarga de documento.
5. Entrar em `/admin/coins/login`, navegar pelo menu até "Visão geral" e voltar a "Moedas": continua conectado.

## 4. Build de produção local

```sh
pnpm --dir apps/web exec playwright test -c playwright.production.config.ts
```

Esperado: sem mudança de comportamento; `/admin` redireciona visitante ao login.

## 5. Site publicado (depois do deploy autorizado)

Entrar como administrador do site de demonstração e percorrer o painel, os pedidos e o menu. Somente leitura.
