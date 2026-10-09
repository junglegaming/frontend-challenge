# Validação — detalhe do NFT

Referências: arquivo `SXihYJLrfKxbEdy60kqVVN`, frames `10:244` e
`15:5536`, componente `70342:2763`. Contexto, medidas e capturas consultados
pelo Figma MCP. Implementação conferida com a fixture `emerald-ape-042`.

## Visual

Capturas em `test-results/detail-desktop.png`, `detail-mobile414.png` e
`detail-mobile390.png`, após `document.fonts.ready` e decodificação das imagens.
Roboto Mono confirmada por `document.fonts.check` e estilos computados.
Nenhuma dessas resoluções apresentou overflow horizontal.

| Elemento | Medida computada | Referência / decisão |
| --- | --- | --- |
| Título desktop | 28px, peso 700, linha 37px | Heading/28 existente |
| Preço desktop | 22px, peso 700, linha 16px | Title/22 do componente |
| Miniaturas desktop | 100px | Componente complexo |
| Painel / imagem desktop | 444px / 404px | Padding de 20px |
| Separação galeria / informações | 32px | Componente complexo |
| Título mobile | 20px, peso 400, linha 28px | Token Title e ajuste manual do usuário |
| Painel mobile 414px | y=393px, raio 32px | Frame y=392px; token de raio existente |
| Barra mobile 414px | y=732px, altura 164px, raio 40px | Frame mobile |
| Barra mobile 390px | y=680px, altura 164px | Adaptação responsiva |
| Cores | `#F5F1EB`, `#D28A4C`, `#241612` | Tokens foreground, primary e surface-card |

SVGs de coração, quantidade, avaliação, mensagem, carrinho e ampliação extraídos
do Figma estão em `src/assets/nft-detail/`. Cores equivalentes usam os tokens
existentes. A seta de retorno segue o controle compartilhado da aplicação.

Diferenças explícitas: a API fornece a mesma descrição nos dois perfis, enquanto
o frame mobile usa texto mais curto. O criador é exibido como informação adicional,
e o painel desktop tem 482px após os ajustes do usuário, comparado a 448px no
componente complexo. O título mobile preserva a linha de 28px do token e o peso
400 solicitado no layout atual; o Figma especifica 16px e peso 700. A galeria mobile usa
padding simétrico de 28px: imagem de 358×353px em 414px, comparada a 361×356px no
frame. Esses conteúdos permanecem acessíveis por rolagem, com espaço reservado
para a barra e safe area. Não foram alterados os tokens globais.

Tailwind IntelliSense 0.16.0 conferido em dez arquivos TSX: substituições
`aspect-[361/356]` → `aspect-361/356` e `break-words` → `wrap-break-word`.
A revalidação retornou quatorze respostas de diagnósticos sem warnings, incluindo
os dois carrosséis e os componentes de card e preço. O harness
temporário normalizou separadores Windows na seleção do projeto; nenhuma
regra de diagnóstico foi alterada.

## Comportamento e verificações

- Contratos: 47 testes passaram, incluindo metadados opcionais, quantidade e
  precedência de versões de socket sobre respostas REST atrasadas.
- Detalhe: 22 casos E2E passaram entre desktop e mobile, incluindo galeria,
  foco, refresh/histórico, 404, loading/retry, indisponibilidade, compra anônima
  e autenticada, conflito de estoque, rollback e troca de sessão.
- Rotas: 36 casos passaram; navegação mobile revalidada após ocultar o painel
  de desenvolvimento que interceptava cliques no teste.
- Seções desktop do catálogo: reexecução passou nos dois perfis.
- Typecheck, lint e build conferidos. ESLint ignora `.agents/`, que contém
  referências de ferramentas externas, além dos artefatos já ignorados.
- Build emite chunks separados para a rota de detalhe, `GalleryDialog` e
  `NftDesktopSections`; as seções complementares não carregam no mobile.

A rodada ampliada encontrou quatro falhas nos testes existentes de autenticação:
dois perfis procuram “Crie uma conta”, mas o modal atual tem outro controle;
dois submetem o formulário esperando campos vazios, embora ele já venha
preenchido. Esses fluxos não foram alterados nesta tarefa. O teste de âncora do
catálogo falhou nessa rodada e passou na reexecução isolada.

## Revalidação do gate em 08/10/2026

Após os ajustes manuais de layout e o carrossel compartilhado, typecheck, lint,
47 testes de contrato e build passaram novamente. A rodada conjunta de
`nft-detail`, `routes`, `hero` e `collection-carousel` terminou com 71 E2E
aprovados e um skip esperado para a coleção no mobile. Inclui 404 em
`erro-4xx`, rollback com erro de mutation após GET bem-sucedido, retorno do
login, proteção contra respostas da sessão anterior e drag com clique seguro.

As medidas acima foram atualizadas por estilos computados e capturas de 1440,
414 e 390px, com a fonte carregada e imagens visíveis decodificadas. A comparação
utilizou os três nós presentes na extração local `docs/figma/file.json` e as
referências visuais consultadas anteriormente. As novas consultas de contexto
ao Figma MCP foram recusadas pelo limite do plano Starter: não houve renovação
do contexto remoto nem uma nova validação completa pelo MCP.

No desktop, o painel de informações ocupa x=725px e largura de 595px, como o
componente extraído; sua altura de 482px acomoda os dados adicionais. A imagem
principal continua com 404×404px dentro do painel de 444px. A coleção mantém
cinco cards de aproximadamente 220,8px, gap de 24px e indicadores de 8px;
essas dimensões foram comparadas ao grid anterior e permaneceram idênticas.
O catálogo mantém os SVGs próprios de paginação, autoplay e drag por toque.
Os ajustes de layout do usuário foram preservados.
