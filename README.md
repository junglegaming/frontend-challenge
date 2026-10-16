# KURIO — NFT Marketplace

Implementação do desafio em React 19 + TypeScript, com Vite, TanStack Router/Query, Axios, Tailwind CSS 4, componentes shadcn/ui (Radix + CVA), MSW e Socket.IO. A experiência inteira é demonstrativa: nenhuma conexão com blockchain, extensão de carteira, pagamento ou credencial real.

### Homologação

Acesse a versão publicada do KURIO para testar a aplicação diretamente pelo navegador, sem precisar instalar dependências:

**[Acessar KURIO — Ambiente de Homologação](https://kurio-frontend-desafio.vercel.app/)**

O ambiente utiliza dados simulados com MSW. Não é necessário conectar uma carteira real nem realizar pagamentos.

## Executar

Requer Node.js 22.19 ou superior e npm. Em um checkout limpo:

```sh
npm ci
npx playwright install chromium
npm run dev -- --port 5180
```

Abra http://127.0.0.1:5180. Os mocks são ativados por padrão inclusive no build. `.env.example` documenta `VITE_ENABLE_MOCKS`; defina `false` apenas se fornecer um backend com os mesmos contratos.

| Comando                                     | Finalidade                                    |
| ------------------------------------------- | --------------------------------------------- |
| `npm run dev`                               | Vite com mocks                                |
| `npm run build`                             | TypeScript e build otimizado                  |
| `npm run preview -- --port 5181`            | Servir o build                                |
| `npm run typecheck`                         | Verificação de tipos                          |
| `npm run lint`                              | ESLint e regras de hooks                      |
| `npm test`                                  | Testes de precisão monetária                  |
| `npm run test:e2e`                          | Chromium desktop 1440 e mobile 390            |
| `npm run test:visual`                       | Comparação com baselines versionadas          |
| `npm run test:visual -- --update-snapshots` | Aprovar novas baselines após revisão          |
| `npm run audit`                             | 3 Lighthouse por página/perfil (12 execuções) |

O Playwright inicia o servidor na porta 5180 ou reutiliza um existente. Para Lighthouse, execute o build e o preview na porta 5181 em outro terminal. `AUDIT_URL` permite mudar a origem. Os relatórios HTML/JSON e medianas ficam em `reports/lighthouse`. A configuração reproduzível está em `scripts/audit.mjs`.

## Contas e cenários

| Conta fictícia   | Senha       |
| ---------------- | ----------- |
| `ana@kurio.demo` | `Kurio123!` |
| `leo@kurio.demo` | `Kurio123!` |

O cadastro também funciona. Use apenas dados fictícios. As senhas são convertidas em hash SHA-256 no banco simulado; isso não é um mecanismo de autenticação de produção.

No rodapé, abra **Cenários de demonstração**. **Aplicar cenário** preserva os dados; **Reset completo** restaura catálogo, contas, sessão, carrinhos, favoritos, carteiras, pedidos e tentativas. Cupom válido: `KURIO10` (10%). `EXPIRED` simula cupom expirado; outros códigos são inválidos.

| Cenário              | Reprodução                                                          |
| -------------------- | ------------------------------------------------------------------- |
| `standard`           | Fluxos de sucesso                                                   |
| `empty`              | Catálogo vazio                                                      |
| `slow`               | Latência fixa de 2200 ms; skeletons                                 |
| `out-of-order`       | Busca de 1 caractere leva 1500 ms; demais, 100 ms                   |
| `offline`            | Erro de conexão REST                                                |
| `server-error`       | HTTP 503                                                            |
| `expired`            | Expiração nas rotas privadas                                        |
| `favorite-error`     | Mutation de favorito falha e faz rollback                           |
| `price-change`       | Altera o preço na criação do pedido; exige nova revisão             |
| `sold-out`           | Esgota a edição na criação do pedido                                |
| `order-timeout`      | Cria o pedido, mas a resposta se perde; recuperar usa a mesma chave |
| `payment-declined`   | Pagamento recusado; carrinho preservado                             |
| `pending-disconnect` | Interrompe Socket.IO com pedido pendente                            |

O mesmo painel permite alterar preço/estoque de Emerald Ape, enviar eventos duplicados/antigos, interromper o socket e expirar a sessão. Esses controles chamam a API MSW; os eventos são codificados pelo binding e chegam por `socket.io-client`.

Para retornar de `offline`/`server-error`, o painel continua acessível: seus endpoints de controle não são sujeitos às falhas do cenário. Escolha `standard` e repita a consulta. Conflito de cadastro: use um e-mail das contas existentes. Erro de perfil/carteira/senha: preencha os campos com dados inconsistentes.

## Testes e evidências

Cada teste usa um BrowserContext isolado e reset integral do banco MSW. REST passa pelos handlers e tempo real pelo cliente Socket.IO. `playwright-report/index.html` contém o relatório HTML; `test-results` guarda screenshots/traces das falhas. As baselines em `tests/visual.spec.ts-snapshots` foram geradas no Windows e devem ser revistas ao mudar SO/Chromium/fontes.

Os contratos, limites dos mocks, política de cache, isolamento de sessão e decisões de UX estão em [ARCHITECTURE.md](ARCHITECTURE.md). [REQUIREMENTS.md](REQUIREMENTS.md) relaciona os requisitos aos arquivos responsáveis.

## Publicação

`dist` é uma SPA estática. Vercel e Netlify têm rewrites versionados (`vercel.json`, `public/_redirects`). Outros hosts precisam enviar rotas desconhecidas para `index.html`, preservando assets e o service worker. HTTPS ou localhost são necessários para MSW, Web Crypto e WebSocket.

O ambiente de homologação está no início deste README. Antes do envio, publique a versão correspondente à branch de entrega. O fork recebe os commits via origin; upstream aponta para o desafio original.

## Revisão final

Consulte [REVISAO_FINAL.md](docs/REVISAO_FINAL.md) para persistência com Zustand, validação por campo, refinamentos mobile, cenários de resposta inválida e preparação do fork.
