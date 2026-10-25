# Auditoria Lighthouse

Páginas: início (`/`) e detalhe do NFT (`/nft/emerald-ape-042`). Build otimizado (`vite build` + `vite preview`), cenário padrão dos mocks (MSW ativo, como no deploy). Três execuções por página e perfil. A tabela mostra a **mediana**.

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | Desktop | 100 | 100 | 100 | 100 | 0,69 s | 0 | 0 ms |
| Detalhe | Desktop | 100 | 100 | 100 | 100 | 0,67 s | 0 | 0 ms |
| Início | Mobile | 95 | 100 | 100 | 100 | 2,81 s | 0 | 14 ms |
| Detalhe | Mobile | 96 | 100 | 100 | 100 | 2,67 s | 0 | 18 ms |

Relatórios HTML/JSON de todas as execuções: `lighthouse-reports/desktop` e `lighthouse-reports/mobile`. Configuração versionada: `lighthouserc.desktop.json` e `lighthouserc.mobile.json`.

## Como reproduzir

```bash
npm ci
npm run lighthouse   # build + 3 execuções por página em cada perfil
```

## Ambiente e condições

- Lighthouse 12.6.1 via `@lhci/cli` 0.15.1, Chrome headless 155, Node 20.19.6, macOS 26.5 (Apple M4).
- Mobile: preset padrão do Lighthouse (Moto G Power emulado, 4G lento simulado: RTT 150 ms, 1,6 Mbps, CPU 4× mais lenta).
- Desktop: preset `desktop` (sem throttling de CPU, 10 Mbps).
- Mocks ativos e imagens/fontes reais da entrega; nenhuma simplificação exclusiva para a auditoria.

## Análise

- **LCP mobile (~3,3 s):** é o caminho crítico de uma SPA com backend simulado no browser. O HTML carrega o bootstrap, que baixa o MSW (~172 KB gzip) e registra o service worker. Só então o app é importado, renderiza e busca `/api/nfts`, e por fim a imagem do primeiro card é pintada. Num backend real, o MSW sairia do caminho crítico.
- **Experimento descartado:** baixar app e MSW em paralelo piorou o LCP mobile (≈4,1 s). Sob banda limitada, os dois disputam a conexão. O carregamento ficou sequencial (ver `src/main.tsx`).
- **Otimizações aplicadas:** `socket.io-client` carregado sob demanda depois da renderização, code-splitting por rota (TanStack Router `autoCodeSplitting`), imagens WebP 640/1080 com `srcset`/`sizes` e dimensões explícitas, `fetchpriority="high"` nos três primeiros cards e na imagem do herói, fonte self-hosted com `font-display: swap`.
- **CLS 0:** skeletons com as mesmas dimensões do conteúdo e `main` com altura mínima de uma tela, para o footer não "pular" quando os dados chegam. Uma primeira medição no detalhe tinha CLS 0,144 por esse motivo.
- **Acessibilidade 100:** a auditoria apontou contraste baixo nos ícones sociais do footer e alvos de toque de 10 px nos pontos dos carrosséis mobile. Os dois foram corrigidos (alvo de 24 px com o ponto visual mantido).
- **SEO 100:** `lang="pt-BR"`, título e descrição, e `robots.txt` válido. Antes, a reescrita da SPA devolvia HTML em `/robots.txt`.

## Rodada de fidelidade ao Figma

A auditoria foi refeita depois da rodada de fidelidade. Duas regressões de acessibilidade no mobile apareceram e foram corrigidas antes de registrar as medianas acima:

- **Contraste do link "EXPLORAR" do herói mobile (3,87:1).** Com o texto curto do Figma, o link passou a ficar sobre o círculo decorativo `#674228`. Recebeu um laranja um tom mais claro (`#f3b06f`, 4,71:1).
- **Alvos de toque de 12 px nos pontos do carrossel do detalhe.** Voltaram a ter 24 × 24 px, com o ponto visual de 7 px dentro.

Depois disso a home mobile estava em 89, abaixo da meta de 90. A investigação está na seção seguinte.

## Home mobile de 89 para 95: o cookie jar que ninguém usava

**Diagnóstico.** O elemento de LCP no mobile não é o herói: é a imagem de um card da grade (2º da coluna esquerda). Dois problemas na cadeia:

1. **A imagem era `lazy`.** A grade masonry mobile só priorizava o 1º card de uma coluna. Agora os 2 primeiros de cada coluna (a primeira dobra) são `eager` + `fetchpriority="high"`. Sozinho, isso não mudou a nota: a imagem só entra no DOM depois de JS → MSW → app → `/api/nfts`.
2. **O chunk do MSW, que precisa carregar antes do primeiro render, tinha 464 KB.** O source map mostrou ~258 KB de `tough-cookie` + `tldts` (cookie jar com a lista pública de sufixos de domínio), que o MSW usa só para emular `document.cookie`. Esta API não usa cookies: o token vai no header `Authorization`, e `grep cookie src/` volta vazio.

**Correção.** Alias no Vite de `tough-cookie` para um stub de 20 linhas com a mesma interface que o MSW usa (`src/mocks/tough-cookie-stub.ts`). O chunk caiu para **170 KB**, e a suíte E2E inteira (110 testes, que dependem do MSW para REST e Socket.IO) passou sem alteração.

| Home mobile | Antes | Depois |
| --- | ---: | ---: |
| Performance | 89 | **95** |
| FCP | 2,1 s | 1,8 s |
| LCP | 3,4 s | 2,8 s |

Não é uma simplificação para o Lighthouse: o mesmo bundle vai para produção, e a funcionalidade removida (cookies nos mocks) não existe na entrega. Se um handler passar a usar cookies, o alias sai.

**Atenção ao medir localmente.** `npm run dev` serve módulos ES sem bundle e sem minificação; a mesma home mobile marca ~38 no Lighthouse (LCP ~40 s). As medições valem para `npm run build && npm run preview`, que é o que `npm run lighthouse` faz.
