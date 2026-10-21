# Contract: Carteiras (`pages/wallets`, rota `/account/wallets`, protegida)

## Layout

Reaproveita a navegação lateral de conta já existente na tela Perfil do Colecionador
(`SideMenu`/`ProfileSidebar`), adicionando/realçando o item "Carteiras" (`Carteiras.png`).

## Carteira principal

- Formulário único (`WalletInput`, `slot: 'primary'`) com os campos da tabela de `data-model.md`.
- "Nome de exibição"/"Nome do perfil"/"Nome ENS" exibidos a partir de `Profile` (D3) — edição desses
  três campos continua ocorrendo apenas na tela Perfil, não aqui.
- "Salvar carteira" → `POST` (primeira vez) ou `PUT /wallets/:walletId` (edição) — idempotente por
  natureza (mesmo formulário reenviado substitui o valor, nunca duplica).

## Carteira secundária

- Estado inicial: "Você ainda não adicionou uma carteira secundária." + ação "Adicionar".
- "Adicionar" revela o mesmo conjunto de campos para `slot: 'secondary'`.
- Checkbox "Igual à carteira principal": ao marcar, copia os valores atuais da carteira principal
  para o formulário secundário (campos continuam editáveis depois de copiados).

## Validação

- Endereço de carteira: formato `0x...` obrigatório.
- Rede e tipo de carteira: seleção obrigatória entre os valores de `NETWORKS`/`WALLET_PROVIDERS`.
- E-mail: formato obrigatório.

## Responsivo

- Desktop: sidebar de conta fixa + formulário em duas colunas (`Carteiras.png`).
- Mobile: sidebar de conta colapsa no mesmo padrão já usado pela tela de Perfil; formulário em coluna
  única.

## Acessibilidade

- Mesma convenção de campos obrigatórios/erros de `ui-components.md` (001).
- Item de navegação ativo com `aria-current="page"` no menu de conta.
