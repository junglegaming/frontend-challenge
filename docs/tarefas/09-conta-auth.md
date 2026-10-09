# 09 — Conta e sessão (cadastro, login, logout, guards)

**Onda:** 4 · **Paralela com:** `08-catalogo` · **Depende de:** 03, 06, 07 · **Bloqueia:** 10, 12, 13
**Label sugerido:** `ui` · **Esforço:** G

## Objetivo

Fluxos de autenticação completos com a API mockada, sessão persistente e guards já
configurados no 06 funcionando de ponta a ponta.

## Subtasks

### 09.1 — Tela de Login

- Frame `9:115`/`16:1022`: formulário, erros por campo + credenciais inválidas
  (mensagem única, sem revelar qual falhou), `?redirect=` de volta ao fluxo anterior

### 09.2 — Tela de Cadastro

- Frame `9:1022`/`16:1228`: validação local (zod) + `409 CONFLICT` no e-mail —
  `fields` da API vencem os erros locais

### 09.3 — Ciclo de sessão

- Hidratação no boot (`GET /auth/session`), persistência após refresh,
  `SESSION_EXPIRED` tratado durante a navegação → login com contexto

### 09.4 — Expiração no checkout + saída de sessão

- Rascunho em `gm_checkout_draft` e retomada após autenticar
- Logout: limpeza de cache privado (`removeQueries`), socket e `gm_session`
- Troca de usuário: nenhum dado do usuário anterior visível

### 09.5 — Merge do carrinho visitante

- Enviar `anonymousId` no login; itens do visitante fundidos no carrinho do usuário

### 09.6 — Acessibilidade dos formulários

- Labels, `aria-describedby`, `aria-invalid`, `aria-live` em erros e sucesso

## Critérios de aceite (gate)

- [x] Fluxo: rota privada → login → volta à rota original → logout limpa tudo
- [x] Sessão sobrevive a refresh · segundo usuário não vê dados do primeiro
- [x] `pnpm typecheck && pnpm lint` verdes

## Validação dos critérios — 08/10/2026

Validado sobre o commit `adaaf85`, incluindo os ajustes de layout. Os três
critérios do gate passaram; a suíte ampliada ainda tem pendências e não está
totalmente verde.

| Verificação                                | Resultado e evidência                                                                                                                                                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rota privada → login → destino → logout    | Aprovado em desktop (1440 px) e mobile (390 px) para `/checkout`, `/orders/sample`, `/profile` e `/wallets`. Os testes `guard and return` preservam `?draft=abc#review`, verificam refresh no destino e bloqueio após logout.                                           |
| Limpeza no logout e isolamento de usuários | Aprovado mesmo com falha de rede no logout: `gm_session`, `gm_pending_order`, rascunho e queries privadas de Ana removidos; socket desconectado e sem autenticação. Login de Bruno não exibe o cache anterior; resposta 401 com token antigo não encerra a sessão nova. |
| Persistência e hidratação                  | Aprovado: refresh valida a sessão uma vez; falha de rede bloqueia conteúdo privado e permite retry. Sessões expiradas ou malformadas não liberam rotas privadas.                                                                                                        |
| Typecheck e lint                           | `pnpm typecheck` e `pnpm lint` concluídos com código de saída 0.                                                                                                                                                                                                        |

### Comandos executados

```sh
pnpm typecheck
pnpm lint
pnpm test:contract tests/contract/session.spec.ts tests/contract/cart.spec.ts tests/contract/routes.spec.ts tests/contract/auth-client.spec.ts tests/contract/favorites.spec.ts
pnpm test:e2e tests/e2e/auth.spec.ts tests/e2e/routes.spec.ts --workers=2
```

- Contratos: **15 testes aprovados**, em 5 arquivos.
- E2E: **54 aprovados e 4 falhas**, em desktop e mobile. Todos os testes de
  `routes.spec.ts` passaram.
- Também passaram cadastro com confirmação divergente e e-mail duplicado, erros
  por campo da API, credenciais inválidas sem expirar uma sessão existente, retry
  de rede e bloqueio de envio duplicado, expiração por prazo e por 401, retomada do
  rascunho pelo mesmo proprietário, descarte ao trocar de conta, merge do carrinho
  visitante, rejeição de redirect externo e ausência de overflow horizontal com
  movimento reduzido.
- A retomada do rascunho foi verificada pela infraestrutura de persistência;
  o formulário completo de checkout permanece para a etapa de checkout.

### Pendências encontradas na validação ampliada

- [ ] Ajustar e repetir `modal preserves background filters, history, switching
and trigger focus`: o teste procura o botão **Crie uma conta**, removido nos
      ajustes. No desktop existe a aba **Criar conta**; no mobile as duas abas estão
      ocultas (`hidden md:block`), sem controle visível para alternar os formulários.
      Histórico e filtros passaram até esse ponto; fechamento e retorno do foco,
      posteriores à alternância no teste, ficaram sem conclusão nesta execução.
- [ ] Ajustar e repetir `local errors, password visibility and keyboard focus
are accessible`: login agora inicia com as credenciais válidas de Ana. O teste
      submete esperando campos vazios, mas autentica e fecha o modal. É necessário
      limpar explicitamente os campos antes de validar erros locais. Visibilidade da
      senha e contenção de foco, posteriores à primeira falha, ficaram sem conclusão
      neste teste.
- [ ] Restaurar a explicação acessível das ações sociais e recuperação de senha:
      os controles permanecem desabilitados com `aria-describedby="auth-unavailable"`,
      mas o elemento com esse ID não existe no modal atual (verificado no código).

Relatório HTML e traces desta execução disponíveis localmente em
`playwright-report/` e `test-results/`. Nenhuma alteração de layout ou de testes
foi realizada nesta verificação.

## Referências

- `docs/api/session.md` · `ARCHITECTURE.md` §2 · frames `9:115`, `9:1022`, `16:1022`, `16:1228`
