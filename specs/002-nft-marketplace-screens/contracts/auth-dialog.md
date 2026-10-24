# Contract: Diálogo de Autenticação (`domains/auth/components/AuthDialog`, rotas `/login` e `/signup`)

## Props / entrada

- `defaultTab: 'login' | 'signup'` — definida pela rota.
- `redirect?: string` — da query string; propagada para a navegação pós-sucesso.

## Abas (shadcn `Tabs`)

| Aba | Campos | Submit | Request |
|---|---|---|---|
| Entrar | e-mail, senha (`PasswordInput`), link "Esqueceu a senha?" | "Entrar" | `LoginRequest` |
| Criar conta | nome de usuário, e-mail, senha, confirmar senha | "Criar conta" | `SignupRequest` |

Ambas as abas MUST exibir "Continuar com Google" / "Continuar com Facebook" (ação simulada — ver
constituição: integrações reais fora de escopo; o clique MUST NOT aparentar sucesso funcional real).

## Validação (Zod, na borda)

- E-mail: formato obrigatório em ambas as abas.
- Senha (login): não-vazia.
- Senha (cadastro): mínimo exigido pela política já usada pelo backend simulado; confirmação MUST
  igualar a senha antes do submit (erro bloqueia envio sem round-trip).
- Conflito de e-mail já cadastrado: erro inline vindo da resposta do servidor (`409`), não detectável
  no cliente antes do submit.

## Pós-sucesso

1. Sessão estabelecida (`domains/auth`), carrinho de visitante mesclado (`MergeCartRequest`).
2. Diálogo fecha.
3. Navegação para `redirect` (se presente) ou permanece na rota de fundo.

## Guard de rota protegida (ver research.md D7)

`beforeLoad` em `/checkout`, `/account/wallets`, `/orders/$orderId` → sem sessão, redireciona para
`/login?redirect=<rota>`.

## Responsivo

- Desktop: `Dialog` centralizado sobre a página de fundo (como em `Login.png`/`Cadastro.png`).
- Mobile: mesmo conteúdo em largura total, sem rolagem horizontal; se o `Dialog` padrão não couber
  sem recorte vertical em 390 px, usar `Sheet` (ver research.md D6) para essa largura.

## Acessibilidade

- Foco preso no diálogo; `Escape` fecha; foco retorna ao elemento que abriu o diálogo.
- Erros de campo com `aria-invalid` + `aria-describedby` (padrão já estabelecido em `ui-components.md`
  de 001).
