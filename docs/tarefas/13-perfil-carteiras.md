# 13 — Telas Perfil + Carteiras (desktop e mobile)

**Onda:** 7 · **Paralela com:** `12-pagamento` · **Depende de:** 09 · **Bloqueia:** 15, 16
**Label sugerido:** `ui` · **Esforço:** M

## Objetivo

Contas do colecionador: edição de dados/avatar/senha e cadastro de carteiras
principal/secundária — incluindo as variantes mobile (sem frame no Figma).

## Subtasks

### 13.1 — Perfil: visualização e edição de dados

- Frame `9:1238`: dados do colecionador + contagem de carteiras; edição com validação
  local + erros da API (`409` username, `422` campos) via `FormField`

### 13.2 — Avatar

- File input (PNG/JPEG ≤ 512KB) com preview e erro local acima do limite;
  persistência após refresh

### 13.3 — Alteração de senha

- Erros por campo (`currentPassword` incorreta, regras da nova senha) ·
  sessão permanece ativa após sucesso

### 13.4 — Carteiras: CRUD

- Frame `9:1670`: listagem principal/secundária; cadastro (endereço `0x`+40hex,
  `409` duplicado/limite de 2); edição (label/note/rede); promover a principal
  inverte a outra

### 13.5 — Variantes mobile

- Perfil, carteiras e confirmação em 414px seguindo o padrão das telas mobile existentes

### 13.6 — Estados e persistência

- Loading (skeleton) / vazio (CTA cadastrar) / erro (retry) · alterações sobrevivem a refresh

## Critérios de aceite (gate)

- [x] Cenário `validacao-api` exibe erros por campo vindos do mock
- [x] `pnpm typecheck && pnpm lint` verdes · sem overflow em 390/414px

## Referências

- `docs/api/profile.md`, `docs/api/wallets.md` · frames `9:1238`, `9:1670` · `docs/ESTILOS.md` §6


## Implementação e evidências — 09/10/2026

- Perfil e carteiras substituem os placeholders, mantendo os guards e usando
  componentes existentes. A composição segue a referência com classes somente
  estruturais; os estilos existentes foram preservados.
- Perfil salva dados/avatar, ENS/apelido da principal e senha em sequência,
  preservando sucessos parciais. Senha mantém a sessão; avatar tem preview,
  validação local e remoção persistente. Contrato/schema/mock documentam `null`.
- Carteiras incluem cadastro, edição e promoção, sem exclusão conforme decisão
  de escopo. Endereço é somente leitura na edição desta tela; cadastro da
  primeira carteira a torna principal. Contagem e cache são invalidados juntos.
- Erros remotos têm associação acessível e foco após o envio; loading, vazio,
  retry, persistência e preservação de edições durante refetch foram verificados.
- `pnpm typecheck` e `pnpm lint`: aprovados na verificação final.
- Contratos afetados: **5 testes aprovados** (`profile.spec.ts`, `wallets.spec.ts`).
- Playwright: **14 testes de conta aprovados** em desktop/mobile e **34 testes
  de checkout aprovados** na regressão. Os runs usaram portas isoladas para
  coexistir com outra execução; configurações temporárias foram removidas.
- Sem overflow em **390, 414, 768 e 1440px**, incluindo o recibo confirmado.
  Reflow em viewport de 720px e zoom CSS de 200% também verificados. Capturas
  de perfil desktop/mobile e carteiras mobile foram inspecionadas.
- Classes novas são canônicas e estruturais, sem valores arbitrários. A consulta
  separada ao Tailwind Language Server recebeu respostas nos três arquivos de UI,
  mas o runner standalone registrou falha de associação de caminhos Windows ao
  projeto; os diagnósticos vazios não confirmam a análise automática completa.

Reprodução dos fluxos:
`pnpm test:e2e -- tests/e2e/account.spec.ts tests/e2e/checkout.spec.ts --workers=2`.
Capturas e relatório da suíte de conta estão em `test-results/account-final/`
e `playwright-report/account-final/` (artefatos gerados, não versionados).
