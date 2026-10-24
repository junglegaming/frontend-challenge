# Domínio `coins-admin`

Administração do serviço de moedas real (`apps/api`) no site, **somente leitura** (specs/012-coins-admin, constituição
1.7.0): entrada do administrador, lista paginada de donos de saldo e, por dono, o saldo e as 50 operações mais recentes.

## Por que é um domínio separado

É outro **contexto delimitado**. O administrador das moedas é outro papel, com outra credencial e outro serviço:

| Domínio | Quem age | Credencial | Dados |
| --- | --- | --- | --- |
| `admin` | admin do marketplace | sessão simulada do site (`ana@nft.dev`) | MSW `/api/admin/*` |
| `ledger` | dono do saldo | token de dono (`POST /backend/auth/token`) | `/backend/coins/*` |
| `coins-admin` | admin das moedas | token de admin (`POST /backend/admin/login`) | `/backend/admin/*` |

Por isso não compartilham sessão, cliente HTTP nem guarda de rota: um token nunca vale pelo outro. O cliente
(`api/client.ts`) é próprio e só envia o token do admin para `/backend/admin/*`.

## Sessão (em memória)

`api/session.ts` guarda `{ token, expiresAt, adminId, email }` numa variável de módulo. **Nunca** em `localStorage` nem
`sessionStorage` (constituição 1.7.0): recarregar a página, ou o acesso expirar (o serviço dá 15 minutos e não renova),
pede nova entrada. O módulo guarda o **motivo** do encerramento (`logout` ou `expired`) até ser lido uma vez:
só `expired` leva à entrada com o aviso "Sua sessão de administrador expirou"; o "Sair" navega sem aviso. Qualquer
encerramento remove do cache as chaves `['coins-admin', …]` (`useCoinsAdminSessionRedirect`).

## Guarda e redirecionamento

`requireCoinsAdmin(href)` (no `beforeLoad`) leva à entrada guardando para onde a pessoa ia (`?redirect=`).
`safeCoinsAdminRedirect` só aceita caminhos dentro de `/admin/coins`: nunca outra origem nem `//host`.

## Paginação

O serviço só devolve o cursor da **próxima** página (opaco, ordem por identificador). A lista guarda a pilha de cursores
na URL (`/admin/coins?cursors=…`): "Próxima" empilha, "Anterior" desempilha. A primeira página não leva `cursors`. O
parâmetro é opcional e o `catch` da rota devolve `cursors: undefined` explicitamente: o roteador junta a busca validada
com a bruta, e um resultado sem a chave deixaria passar um valor malformado.

## Erros e mensagens

| Situação | Mensagem |
| --- | --- |
| e-mail inexistente ou senha errada (mesma resposta do serviço) | "E-mail ou senha incorretos." |
| 401/403 (token ausente, vencido ou de outro papel) | "Sua sessão de administrador expirou. Entre de novo." |
| rede, tempo esgotado, 5xx | "Serviço de moedas indisponível. Tente novamente." |
| identificador fora de `[A-Za-z0-9_.-]{1,128}` | "Identificador de dono inválido." (sem consultar o serviço) |

As consultas repetem só falhas transitórias (no máximo 2 vezes); o login nunca é repetido sozinho.

## Cache

Chaves isoladas por administrador: `['coins-admin', adminId, 'owners', cursors]` e
`['coins-admin', adminId, 'owner', ownerId]`. O app usa `staleTime` de 30 s.

## API pública

`useCoinsAdminLogin`, `coinsAdminLogout`, `useCoinsAdminSession`, `hasCoinsAdminSession`, `requireCoinsAdmin`,
`useCoinsAdminSessionRedirect`, `useOwnersPage`, `useOwnerDetail`, `SessionBar`, `safeCoinsAdminRedirect`,
`coinsAdminErrorMessage`, `CoinsAdminError` e os schemas Zod de `model/contracts.ts`. O token nunca é exportado.

## Testes e mock

Playwright contra `src/mocks/contexts/coins-admin` (MSW), nunca contra o serviço real; credencial de demonstração e
cenários (`coins-unavailable`, `coins-admin-session-expired`) em `src/mocks/contexts/coins-admin/README.md`. Specs:
`e2e/admin-coins-login`, `e2e/admin-coins`, `e2e/admin-coins-owner` e, no build de produção,
`e2e/production/hardening.spec.ts`.
