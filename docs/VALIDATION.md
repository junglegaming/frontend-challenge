# Validação local — 25 de outubro de 2026

## Ambiente

Windows 10.0.26200, Intel Core i7-1255U, aproximadamente 16 GB de RAM. Node.js 20.19.6, npm 10.8.2, Google Chrome 155.0.8059.85, Playwright 1.64.1, TypeScript 5.9.3, Vite 6.4.5, MSW 2.15.0 e Lighthouse 12.8.2. As versões das dependências estão fixadas pelo lockfile.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| TypeScript strict | Passou |
| ESLint | Passou |
| Build otimizado | Passou |
| Suíte E2E completa | 32 testes passaram; desktop e mobile |
| Verificação final de carrinho, compra e conflitos | 8 testes passaram |
| Regressão após otimizações de carregamento | 10 testes passaram |
| Baselines visuais | Oito imagens comparadas sem diferenças |

A suíte completa testa busca/filtros/ordenação/paginação e histórico, acesso direto e 404, cadastro e conflito, isolamento de conta, rollback de favoritos, carrinho/cupom/refresh, compra com recibo imutável, recusa, timeout com recuperação, perfil/avatar/senha/carteiras, eventos Socket.IO duplicados/antigos, sessão expirada, skeletons, recuperação de falhas e foco de diálogos. Os cenários adicionais verificam pedido pendente com desconexão/refresh, preço/estoque alterados no envio e navegação por teclado a 768 px.

Viewports E2E: 1440 × 1000 e 390 × 844; teste adicional: 768 × 1024. O fluxo final de compra percorre os controles da interface: catálogo → detalhe → carrinho → pagamento → revisão → recibo.

Os testes não substituem REST por respostas de `page.route` nem atualizam o cache diretamente. As requisições atravessam MSW; os testes de tempo real atravessam o cliente Socket.IO.

Relatórios preservados:

- [Suíte completa, 32 testes](../reports/playwright/full/index.html).
- [Verificação final, 8 testes](../reports/playwright/final/index.html).
- [Regressão de carregamento, 10 testes](../reports/playwright/performance/index.html).
- [Baselines versionadas](../tests/marketplace.spec.ts-snapshots).

Para abrir um relatório no navegador: `npx playwright show-report reports/playwright/full`. A configuração retém traces e screenshots quando ocorre uma falha; as execuções finais acima não tiveram falhas.

## Lighthouse

Foram auditadas as rotas `/` e `/nft/1` em mobile e desktop, com três medições independentes por combinação. O cenário padrão dos mocks, as imagens WebP e as funcionalidades completas permaneceram ativos. As medições são sequenciais, usando o build otimizado servido por `vite preview`. Mobile usa o throttling simulado padrão do Lighthouse; desktop usa conexão local sem throttling e viewport 1440 × 1000.

Os relatórios HTML/JSON e o resumo de medianas são gravados em [reports/lighthouse](../reports/lighthouse). O script reproduzível está em [scripts/audit.mjs](../scripts/audit.mjs).

Medianas finais de três execuções por linha:

| Página / perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início / mobile | 88 | 100 | 96 | 100 | 3393 ms | 0,00091 | 43,5 ms |
| Início / desktop | 100 | 96 | 100 | 100 | 470 ms | 0,00013 | 0 ms |
| Detalhe / mobile | 87 | 100 | 96 | 100 | 3537 ms | 0 | 39,5 ms |
| Detalhe / desktop | 100 | 100 | 100 | 100 | 650 ms | 0,00013 | 0 ms |

Performance mobile ficou abaixo da meta de 90; as demais categorias atingiram suas metas nos quatro conjuntos. O fator restante é o atraso de renderização inicial: o navegador precisa carregar e inicializar React, Router e o service worker MSW antes de consultar e exibir os dados. O módulo dos mocks representa aproximadamente 103,5 KB transferidos com compressão, além dos demais chunks. A emulação mobile aplica limitação de CPU/rede a essa cadeia. As imagens são locais e otimizadas, e o CLS do detalhe foi eliminado; não foram removidas funcionalidades para obter uma nota artificialmente maior. Uma próxima otimização seria pré-renderizar o conteúdo público e reconciliá-lo com a API simulada, evitando aguardar todo o bootstrap antes da primeira pintura.

Na primeira rodada, o detalhe mobile apresentou CLS de aproximadamente 0,233: a altura do skeleton era menor que o conteúdo final. O placeholder foi substituído por uma composição que reserva a proporção da galeria e a altura das informações. O cliente Socket.IO também passou a carregar depois da montagem, fora do caminho inicial de renderização, e o código de rotas passou a carregar em paralelo à ativação do MSW. O resumo anterior foi preservado em [lighthouse-before.json](../reports/lighthouse-before.json).

## Escopo da entrega

Aplicação validada localmente; deploy pendente. O código foi preparado para entrega pelo fork e inclui as configurações de publicação. A fidelidade visual e as substituições de tipografia estão documentadas em [ARCHITECTURE.md](../ARCHITECTURE.md); as imagens originais do Figma e sua proveniência estão em [ASSETS.md](ASSETS.md).
