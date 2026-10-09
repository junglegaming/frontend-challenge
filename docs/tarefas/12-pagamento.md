# 12 — Tela Pagamento + confirmação (recibo)

**Onda:** 7 · **Paralela com:** `13-perfil-carteiras` · **Depende de:** 09, 11 · **Bloqueia:** 14, 15, 16
**Label sugerido:** `ui` · **Esforço:** G

## Objetivo

Checkout completo com revisão, carteira/rede, idempotência e estados do pedido;
tela de confirmação só para pedido efetivamente confirmado.

## Subtasks

### 12.1 — Composição das telas

- Frames `11:2862`/`16:748` (pagamento) e `11:4385` (confirmação/recibo)

### 12.2 — Dados + carteira/rede + conexão simulada

- Dados do colecionador, seleção de carteira e rede (seed da API)
- Simulação: `disconnected → connecting → connected | rejected` + desconectar;
  `rejected`/`disconnected` bloqueiam o envio

### 12.3 — Revisão + idempotência

- Revisão antes do envio (itens, cupom, totais, carteira, rede)
- `Idempotency-Key` persistida (`gm_pending_order`); botão `disabled` + `aria-busy`
  durante envio (clique repetido não dispara 2ª chamada)
- Timeout/erro → retry manual reutiliza a **mesma chave** (recupera o mesmo pedido)

### 12.4 — Revalidação (`QUOTE_STALE`)

- `409 QUOTE_STALE` → refetch da cotação + **nova confirmação do usuário**

### 12.5 — Estados do pedido + recibo

- Pendente/confirmado/recusado via `order.updated` (+ polling de segurança);
  confirmação renderiza **só** com `status === "confirmed"`
- Recibo = snapshot (itens, taxas, total, `txHash`/link explorador simulados)
- `declined` mostra `declineReason` e mantém o carrinho

### 12.6 — Limpeza do carrinho + expiração

- Após `confirmed`: remover **só** itens/quantidades comprados
- Expiração no meio do checkout → login → retomada com rascunho

## Critérios de aceite (gate)

- [x] Cenários `timeout-pedido`, `pagamento-recusado`, `preco-muda` com portas de saída corretas
- [x] Refresh com pedido pendente recupera estado sem duplicar compra
- [x] `pnpm typecheck && pnpm lint` verdes

## Referências

- `docs/api/orders.md` · `ARCHITECTURE.md` §5–6 · `docs/MOCKS.md` §4 · frames citados

## Implementação e evidências

- Formulário editável com react-hook-form, zod e componentes shadcn/ui existentes.
  Código de indicação e Nome ENS são obrigatórios; Nome ENS usa Select.
  Perfil e carteira fornecem os valores iniciais. Contas sem indicação ou ENS
  recebem `NFT Marketplace` e `nft-marketplace.eth` para teste.
- `OrderReview` é separado: miniaturas, identificação do token, quantidades,
  subtotal por item, cupom, subtotal, desconto, taxa estimada e total. O grupo
  de rádios de carteira fica abaixo da revisão e é sincronizado com o tipo
  escolhido no formulário.
- A ação única **Confirmar compra** valida e atualiza a conta, depois abre a
  autorização simulada. Não há botões separados de salvamento ou de conexão.
  Rejeitar ou fechar o diálogo impede a criação do pedido.
- `timeout-pedido`: retry manual e refresh sem ID reaproveitam o mesmo payload
  e a mesma chave; recibo confirmado recuperado sem segunda compra.
- Refresh com ID mantém o mesmo pedido; polling sem socket confirma o pedido.
  Snapshot preservado após alterações na conta; eventos antigos não regressam
  pedido terminal; acesso de outro usuário ao recibo é recusado.
- `preco-muda`: cotação obsoleta libera a tentativa, atualiza a cotação e exige
  nova confirmação. `pagamento-recusado` mostra motivo, oferece retorno ao
  carrinho e preserva seus itens. Estoque insuficiente bloqueia nova compra.
- Confirmação remove somente quantidades compradas no servidor mock, preservando
  adições durante a espera. Expiração preserva rascunho e tentativa do mesmo
  usuário; logout/troca de usuário limpa dados privados.
- `pnpm typecheck`, `pnpm lint` e os 50 testes de contrato passaram.
  Playwright cobre checkout/pedidos, carrinho, autenticação e rotas em desktop
  e mobile; expectativas antigas de botões/colunas foram atualizadas.
- Diagnósticos `tailwindcss(suggestCanonicalClasses)` verificados separadamente
  via Tailwind Language Server: nenhum diagnóstico nos 11 arquivos de UI.

### Limites documentados

A composição usa apenas estilos estruturais, conforme AGENTS.md; os estilos dos
componentes reutilizados foram preservados. Não se declara paridade de cores,
espaçamentos ou tipografia com a imagem. ENS e autorização são simulados, sem
registro de domínio, extensão de carteira ou transação real. As atualizações de
perfil e carteira são sequenciais: se a segunda falhar, a primeira permanece e
a interface exige correção e nova confirmação antes de criar o pedido.
