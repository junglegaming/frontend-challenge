# Problemas encontrados na verificação

Bugs reais encontrados ao rodar o app num browser, a suíte E2E e o Lighthouse, antes da entrega. Para cada um: o sintoma, a causa raiz e a correção. Nenhum deles aparecia em typecheck, lint ou build.

---

## 1. Pedido confirmado no servidor, mas a tela ficava "aguardando"

**Sintoma.** Depois de comprar, o servidor marcava o pedido como `confirmed`, mas a tela de pedido nunca saía de "Aguardando confirmação da rede". Só acontecia quando o usuário fazia login **durante** o fluxo, como visitante que vai ao checkout.

**Causa raiz.** Eram duas, encadeadas:

1. O login removia todas as queries privadas, **incluindo `['session']`**, e depois recriava a sessão com `setQueryData`. Os observers ativos (root e header) continuavam presos à query removida. O root nunca viu o `userId` mudar, e o socket não era recriado com o token.
2. Mesmo recriado, o `io()` do socket.io-client reaproveita o **Manager em cache** para a mesma URL. O novo socket herdava a query antiga, sem token.

Resultado: a conexão continuava anônima, e o servidor (corretamente) não entregava o `order.updated`, que é privado ao dono do pedido.

**Correção.** A query de sessão nunca é removida, só tem o valor trocado. O socket usa `forceNew: true`. Um diagnóstico (`__kurioMock.connectedUsers()`) passou a ser verificado no teste de troca de usuário.

**Lição.** O bug só aparece depois de uma troca de sessão, exatamente o cenário que o enunciado manda testar. Um evento público (broadcast) teria funcionado e escondido o problema.

---

## 2. Retry após timeout não levava ao recibo

**Sintoma.** No cenário `order-timeout`, clicar em "Tentar novamente" recuperava o pedido certo no servidor (sem duplicar), mas a tela não navegava para o recibo.

**Causa raiz.** O pedido era confirmado enquanto a primeira requisição ainda esperava a resposta, o carrinho esvaziava e o checkout trocava para a tela de recuperação. A tela de recuperação e o checkout usavam **instâncias diferentes** do hook `usePlaceOrder`, cada uma com o próprio `useState` da tentativa. O `orderId` recebido no retry chegava à instância errada.

**Correção.** A tentativa virou um store observável (`useSyncExternalStore` sobre o `localStorage`). Todas as telas leem a mesma versão.

---

## 3. Perfil e carteiras renderizavam com 991 px no mobile

**Sintoma.** No mobile, o clique em "Sair" e em "Alterar senha" travava na suíte E2E. A página estava com 991 px de largura num viewport de 390 px.

**Causa raiz.** O menu horizontal da conta (com scroll) tinha itens "Em breve" com um `<span class="sr-only">`, que usa `position: absolute`. Nem o item nem o `<nav>` eram `position: relative`, então o containing block desses spans ficava **fora** do container de scroll. Eles eram posicionados até x≈1000 px sem recorte, e o Chrome mobile ampliava o viewport de layout para caber.

**Correção.** `relative` no componente `ComingSoon`, mais `grid-cols-1` (`minmax(0, 1fr)`) no layout de coluna única.

**Falha do próprio teste.** O primeiro teste de overflow comparava `scrollWidth` com `innerWidth`, e os dois estavam inflados pelo bug. Agora ele compara com a largura do dispositivo.

---

## 4. Footer "pulava" no carregamento do detalhe (CLS 0,144)

**Causa.** Enquanto o detalhe carregava, a página era mais curta que a tela e o footer aparecia no viewport. Depois era empurrado para baixo.

**Correção.** `main` com altura mínima de uma tela. CLS medido: 0.

---

## 5. Achados do Lighthouse

| Achado | Causa | Correção |
| --- | --- | --- |
| Contraste insuficiente (3,08:1) | Ícones sociais do footer com `opacity-60` | Opacidade total (≈5,5:1) |
| Alvos de toque de 10×10 px | Pontos dos carrosséis mobile | Botão de 24×24 px com o ponto visual dentro |
| `robots.txt` inválido | A rewrite da SPA devolvia HTML | `public/robots.txt` |
| `lang="en"`, título "app" | Template do Vite | `pt-BR`, título e descrição |

---

## 6. Socket nunca era interceptado pelo MSW

**Sintoma.** No primeiro teste em browser, o WebSocket tentava resolver o DNS de `realtime.kurio.mock` e falhava.

**Causa.** O `engine.io-client` guarda a referência de `globalThis.WebSocket` no momento em que é importado, e o app era importado antes do `worker.start()` aplicar o patch.

**Correção.** O app só é importado depois de os mocks subirem, e o `socket.io-client` é carregado sob demanda.

---

## 7. Botões principais invisíveis no desktop (carrinho e pagamento)

**Sintoma.** "Conectar e finalizar" e "Confirmar compra" ocupavam espaço, eram clicáveis e passavam no E2E, mas não apareciam na tela.

**Causa raiz.** O `cn()` passa as classes pelo `tailwind-merge`, que trata `bg-gradient-to-b` (gradiente do botão mobile) e `bg-primary` (cor do `Button`) como o mesmo grupo e descarta a cor. No desktop, `md:bg-none` tirava o gradiente: fundo transparente com texto escuro.

**Correção.** Gradiente só no mobile (`max-md:bg-gradient-to-b`), sem "aplicar e desligar". Só a comparação visual com o Figma pegou: o Playwright clica em elementos invisíveis por cor.

---

## 8. E2E sem backend em clones sem `.env` (e na CI)

**Sintoma.** Num worktree novo, a home carregava sem nenhum card e o WebSocket tentava resolver `realtime.kurio.mock` no DNS.

**Causa raiz.** Os mocks só ligavam com `VITE_ENABLE_MOCKS === 'true'`, e o `.env` é ignorado pelo git. A CI e a Vercel também não têm `.env`, então os E2E da CI teriam falhado do mesmo jeito.

**Correção.** Mocks ligados por padrão; só `VITE_ENABLE_MOCKS=false` desliga. Os outros envs já tinham default.

---

## 9. Overflow e herói cortado em 768 px

**Sintoma.** O projeto `tablet` acusou `scrollWidth` 774 na home e, na regressão visual, o título do herói cortado pela imagem e a newsletter do footer espremida.

**Causa raiz.** Medidas fixas do Figma desktop (texto de 600 px + imagem de 450 px, footer em 4 colunas) somam mais que 768 px. Desktop e mobile não viam isso.

**Correção.** Escala intermediária em `md` (herói com imagem de 300 px, footer em 2×2) e as medidas do Figma a partir de `lg`.
