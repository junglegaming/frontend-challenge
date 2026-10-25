# Jungle — NFT Marketplace

Solução independente para o [desafio frontend da Jungle](https://github.com/junglegaming/frontend-challenge), construída em React e TypeScript. Catálogo, conta, carrinho, checkout e recibos utilizam uma API REST simulada com MSW. As atualizações passam pelo cliente Socket.IO real, com o protocolo interceptado na camada de mocks.

## Executar

Requer Node.js 20.19+ e npm 10+. Não é necessário backend, conta de carteira ou chave privada.

```bash
npm ci
npm run dev
```

Acesse http://localhost:5173. Os mocks estão habilitados por padrão inclusive em produção. `.env.example` documenta `VITE_MOCKS=true`; desabilitar os mocks exige fornecer uma implementação real de `/api` e Socket.IO.

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Desenvolvimento com mocks |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint |
| `npm run build` | Verificação de tipos e build otimizado |
| `npm run preview` | Servir o build em http://localhost:4173 |
| `npm run test:e2e` | Playwright em Chrome desktop e mobile |
| `npm run test:e2e -- --update-snapshots` | Atualização intencional das baselines visuais |
| `npm run audit` | Três auditorias Lighthouse por rota e perfil |

Playwright utiliza o Google Chrome instalado, configurado em `playwright.config.ts`. Alternativamente, instale Chromium com `npx playwright install chromium` e remova `channel: 'chrome'` da configuração. Execute o build antes dos E2E, que usam `vite preview` na porta 5173. Relatório HTML: `playwright-report/index.html`. Screenshots e traces de falhas: `test-results/`.

## Contas fictícias

| E-mail | Senha | Carteira inicial |
| --- | --- | --- |
| alex@example.com | Jungle123! | Ethereum, endereço fictício |
| sam@example.com | Jungle123! | Nenhuma; permite testar cadastro de carteiras |

Também é possível criar uma conta. Utilize exclusivamente dados fictícios. A API de demonstração guarda hashes SHA-256; senhas não são persistidas em texto claro. Esta simulação de autenticação local não substitui segurança de um backend de produção.

## Cenários reproduzíveis

O botão **Cenários**, no rodapé, permite selecionar um cenário ou restaurar o banco completo. **Aplicar** preserva os dados existentes; **Restaurar cenário** apaga contas criadas, alterações, sessão, favoritos, carrinhos e pedidos, restaurando as fixtures. Cada contexto Playwright começa com armazenamento isolado.

| Cenário | Comportamento |
| --- | --- |
| standard | Latência de 120 ms e pagamento confirmado |
| slow | Latência de 1,8 s; permite observar skeletons |
| variable | Busca de um caractere demora 1,2 s; demais consultas, 100 ms |
| offline | Erro de conexão em REST |
| server-error | HTTP 503; pode ser recuperado voltando a standard |
| expired | Sessão expirada em cada chamada |
| favorite-error | Mutation de favorito falha; atualização otimista sofre rollback |
| price-change | Preço muda ao enviar a compra; exige revisão da nova cotação |
| sold-out | Edição esgota antes da compra; impede o pedido |
| order-timeout | Pedido é criado, mas a resposta demora 12 s; Axios expira em 7 s |
| payment-refused | Pedido passa a recusado e preserva os itens |
| order-pending | Conclusão em 8 s, para testar desconexão e refresh enquanto pendente |

Os controles também alteram preço, esgotam a edição do NFT #1 e expiram a sessão. Todos passam por handlers MSW. Para controlar cenários nos testes ou no console da página:

```js
await fetch('/api/demo/scenario', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({scenario: 'standard'})
});
await fetch('/api/demo/event', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({id: '1', kind: 'price', duplicate: true})
});
```

`kind` admite `price`, `stock`, `expire` e `disconnect`. `old: true` emite uma versão anterior sem alterar o banco. Os eventos são codificados pelo binding e recebidos pelo `socket.io-client`; os controles não escrevem no cache da interface.

## Roteiro de compra

1. Abra um NFT, escolha edição e quantidade e adicione ao carrinho.
2. No carrinho, use o cupom `JUNGLE10` para 10% de desconto. `EXPIRED` demonstra expiração; outros códigos demonstram invalidação.
3. Prossiga para pagamento e entre com Alex. O carrinho do visitante é incorporado ao carrinho da conta, respeitando o estoque.
4. Preencha os dados, selecione a carteira e sua rede e use **Simular conexão**.
5. Revise a cotação antes de confirmar. O recibo só mostra confirmação depois da resposta da simulação.
6. Para testar timeout, ative `order-timeout` antes de confirmar. Após a falha, atualize a página e use **Recuperar compra**. A chave original recupera o mesmo pedido.

O endereço de carteira de exemplo é `0x1234567890abcdef1234567890abcdef12345678`. Não conecte extensões ou use carteiras reais.

## Deploy e auditoria

O build estático é `dist/`. `vercel.json` e `public/_redirects` contêm fallback de rotas para Vercel e Netlify/Cloudflare Pages. Configure comando `npm run build`, saída `dist`, Node 20.19+ e mocks habilitados. O host precisa servir `mockServiceWorker.js` como JavaScript, fora do fallback de SPA, com HTTPS (localhost é permitido).

Para Lighthouse:

```bash
npm run build
npm run preview
# Em outro terminal:
npm run audit
```

O script usa o Chrome instalado em Windows. `CHROME_PATH` permite outro executável e `AUDIT_URL` muda a origem. Relatórios HTML/JSON e medianas são gravados em `reports/lighthouse/`. As medições utilizam os mesmos assets e funcionalidades do build entregue.

Veja [ARCHITECTURE.md](ARCHITECTURE.md) para decisões de estado e limitações, [contratos](docs/CONTRACTS.md) para REST/eventos e [origem dos assets](docs/ASSETS.md).

## Evidências da execução local

O deploy está pendente. O código está organizado para entrega pelo fork e inclui as configurações de publicação. O [enunciado original](docs/CHALLENGE.md) está disponível para consulta.

Foram executados 32 testes E2E em desktop/mobile e oito verificações adicionais após os ajustes finais, incluindo comparação das oito baselines existentes. Relatórios preservados: [suíte completa](reports/playwright/full/index.html) e [verificação final](reports/playwright/final/index.html). As baselines em `tests/marketplace.spec.ts-snapshots` foram capturadas com Chrome no Windows, conforme o ambiente documentado em [validação](docs/VALIDATION.md).

Após as otimizações de carregamento, outras dez verificações passaram, incluindo compra, Socket.IO, skeletons e regressão visual: [relatório](reports/playwright/performance/index.html). As doze auditorias Lighthouse estão em `reports/lighthouse`: performance desktop 100; mobile 88 no início e 87 no detalhe, abaixo da meta de 90. A análise e todas as medianas estão no documento de validação.
