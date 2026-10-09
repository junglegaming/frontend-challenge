# Carrinho

`/cart` carrega a feature pelo code splitting automático do TanStack Router.
Os itens usam `CartItemsTable`, com colunas separadas em `cart-table-columns.tsx`
e células em `CartItem`, `CartPrice`, `CartEdition`, `CartTotal` e `CartActions`.
A tabela usa TanStack Table v9 e o `Table` do shadcn/ui, a partir de 768px.
Abaixo disso, `CartItemsList` apresenta imagem, nome, edição, total do item,
quantidade e remoção numa lista semântica, reutilizando as células existentes.
`CartItem` aceita conteúdo em `children`; sem conteúdo, preserva o ID do token.
O layout usa uma coluna até 1024px e três no desktop (duas para os itens e uma
para o resumo). No mobile, o resumo completo usa o `Card` existente e fica fixo
no rodapé, limitado à metade da área visível, com rolagem interna. Um
`ResizeObserver` sincroniza um elemento de reserva com a altura do painel;
`visualViewport` reposiciona o painel quando o teclado reduz a área disponível.
O resumo exibe subtotal, desconto, `networkFee` e total da API.
O `QuantityStepper` compartilhado oferece `size="sm"` e `className`.
A seção de recomendações reutiliza `NftRecommendationsSection`, também usado
no detalhe, e exclui os NFTs presentes no carrinho.

A tarefa ainda possui pendência de skeleton shimmer. Ver
`docs/tarefas/11-carrinho.md`.

Queries e mutations usam Axios e schemas zod. Respostas antigas de carrinho e
cotação são descartadas por versão. Mutations cancelam leituras anteriores,
mantêm a quantidade confirmada em erros e invalidam carrinho e cotação.

A persistência dos itens e o merge de visitante no login pertencem à API.
Cupom é validado antes da aplicação; invalidade/expiração remove o desconto,
preserva a mensagem associada ao input e solicita cotação sem cupom.
Trocar a sessão remonta o estado local da feature.

O SocketProvider anuncia mudanças de preço de itens presentes no carrinho,
somente após a aceitação do evento pelo controle de versões em lib/socket.
Carrinho e cotação são revalidados. O resumo final usa exclusivamente valores
da API. A navegação ao checkout usa o guard beforeLoad já existente.
