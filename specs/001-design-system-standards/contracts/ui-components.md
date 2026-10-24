# Contract: Componentes de UI e Navegação

Componentes ficam em `src/shared/ui` (shadcn/ui via CLI, adaptados pelo tema) ou em `src/app/layout`
(navbar e dock). Páginas importam daí; não recriam a aparência.

## Catálogo

| Componente | Variantes | Estados | Acessibilidade |
|------------|-----------|---------|----------------|
| `Button` | `default` (âmbar, texto `#140D0A`, bold), `ghost`/texto, `icon` | padrão, hover, foco, desabilitado, carregando | Nome acessível obrigatório em `icon`; foco 3 px `--ring` |
| `Input` | texto, com ícone, com sufixo (`Select` acoplado, ex.: `.eth`) | padrão, foco, erro, desabilitado | `Label` associado; erro via `aria-invalid` + `aria-describedby` |
| `PasswordInput` | — | + mostrar/ocultar | Botão com nome ("Mostrar senha"/"Ocultar senha") e `aria-pressed` |
| `Label` | com marcador de obrigatório | — | Marcador coral `aria-hidden` + texto "(obrigatório)" acessível |
| `Field` | — | erro | Agrupa rótulo, controle, ajuda, erro |
| `Select` | sufixo compacto | padrão, foco, aberto | Teclado completo (radix) |
| `Avatar` | com ação (Alterar/Remover) | vazio (ícone), com imagem | `alt` útil ou ocultar se decorativo |
| `SideMenu` / `SideMenuItem` | — | padrão, ativo (barra vertical âmbar), foco | `nav` com nome; ativo com `aria-current="page"` |
| `NavLink` (navbar) | — | padrão, ativo (sublinhado âmbar), desabilitado | `aria-current="page"`; desabilitado com `aria-disabled` |
| `CountBadge` | — | 0 (oculto), 1–99, 99+ | Texto acessível com a quantidade no controle pai |
| `Card`, `Badge`, `Separator`, `Tabs`, `Dialog`, `Skeleton`, `Sonner` | shadcn | conforme shadcn | Foco preso em `Dialog`; `Skeleton` com shimmer e dimensões do conteúdo final |

## Navbar (`src/app/layout/Navbar.tsx`)

- Props: `cartCount?: number`, `user?: { name: string; avatarUrl: string | null } | null`.
- Itens: vindos de `nav-items.ts` (`NavItem[]`, ver `data-model.md`).
- Landmark: `<header>` com `<nav aria-label="Principal">`. Item atual: `aria-current="page"`.
- ≥ md: logotipo, itens, busca, carrinho (`CountBadge`), entrar/conta. < md: logotipo, busca, carrinho, conta.
- Itens sem rota (`to: null`) renderizados desabilitados, nunca links.

## Dock (`src/app/layout/Dock.tsx`)

- Visível apenas < md; `<nav aria-label="Navegação rápida">` fixa no rodapé.
- 4–5 itens de `nav-items.ts` com ícone + rótulo; alvo ≥ 44 × 44 px; ativo com cor primária + indicador.
- Respeita `env(safe-area-inset-bottom)`; `<main>` reserva espaço inferior igual à altura da dock.

## Ícones (`src/shared/icons/index.ts`)

- Exporta somente o conjunto oficial (lista em `research.md` D4); páginas não importam `lucide-react` direto.
- Decorativos: `aria-hidden="true"`. Com significado: rótulo no controle pai.

## Regra de revisão

Cor, fonte, espaçamento ou componente fora destes contratos exige justificativa no PR; se aprovado, o contrato é atualizado.
