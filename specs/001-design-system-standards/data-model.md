# Data Model: Padrões do Design System

Não há dados persistidos nem API. Estas são as entidades de design que o catálogo e o código
precisam representar. Valores vêm de `research.md`.

## ColorToken

| Campo | Regra |
|-------|-------|
| `name` | Nome funcional único (`background`, `surface`, `primary`, `text`, `text-muted`, `border`, `ring`, `destructive`, `success`, `warning`) |
| `value` | Hex `#RRGGBB`; uma única definição por nome |
| `role` | Uso previsto |
| `allowedOn` | Lista de tokens de fundo sobre os quais pode ser texto, cada par com contraste ≥ 4,5:1 (≥ 3:1 para texto grande/componentes) |

Base: `background #140D0A`, `surface #241612`, `primary #D28A4C`, `text-muted #B39463`, `text #F5F1EB`, `ring #CFB28C`.

## TypeScale

`name` (`title`, `body`, `action`, `caption`) · `family` (única, monoespaçada) · `size` (px; `body` ≥ 14) · `weight` (400/700) · `lineHeight` (1,5).

## SpacingScale / Radius

Escala de 4 px: 4, 8, 12, 16, 24, 32, 48. Raios: `sm` 4, `md` 8, `lg` 20. Altura de controle: 40.

## Breakpoint

`mobile` < 768 (padrão 390) · `tablet` ≥ 768 · `desktop` ≥ 1024 (validado em 1440). Cada um associa regras: navbar completa vs. compacta, dock visível/oculta, menu lateral coluna/colapsado, formulário 1 ou 2 colunas.

## Icon

`name` semântico · `source` (lucide) · `size` (16/20/24) · `kind` (`decorative` → `aria-hidden`; `meaningful` → rótulo acessível obrigatório).

## NavItem (compartilhado por Navbar e Dock)

| Campo | Regra |
|-------|-------|
| `id` | Único (`home`, `market`, `creators`, `learn`, `cart`, `favorites`, `account`) |
| `label` | Texto em pt-BR |
| `icon` | Icon (usado na Dock) |
| `to` | Rota existente ou `null` |
| `enabled` | `false` quando `to` é `null` (renderiza desabilitado, nunca como link) |
| `placement` | `navbar`, `dock` ou ambos |

## UiComponent

`name` · `variants[]` · `states[]` (padrão, foco, ativo, desabilitado, erro, carregando — os aplicáveis) · `a11y` (papel, nome acessível, teclado) · `responsive` (comportamento por breakpoint).
