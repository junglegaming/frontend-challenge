# Research: Padrões do Design System (Kurio)

Todas as incógnitas do Technical Context foram resolvidas abaixo.

## D1 — Papel de cada cor base

- **Decision**: `#140D0A` fundo · `#241612` superfície (cards, menu lateral, navbar sólida) · `#D28A4C` primária/destaque (botões, item ativo, selo) · `#B39463` texto secundário, rótulos auxiliares e bordas (em baixa opacidade) · `#F5F1EB` texto principal · `#CFB28C` anel de foco e realces claros (hover de links).
- **Rationale**: segue o que a imagem mostra (fundo escuro, menu um tom acima, âmbar como destaque, texto claro). Contrastes calculados: `#B39463` sobre `#140D0A` ≈ 6,7:1; `#F5F1EB` e `#CFB28C` sobre fundo e superfície > 9:1; `#140D0A` sobre `#D28A4C` (texto de botão) ≈ 6:1. Todos ≥ 4,5:1.
- **Alternatives**: usar `#D28A4C` como texto de corpo (descartado: reserva-se a destaque); manter tokens provisórios atuais (`#130c0a`, `#d38b4a`…), que divergem levemente dos valores definidos pelo usuário.
- **Cores fora das 6**: erro/obrigatório (coral da imagem, já `--destructive`), sucesso e aviso permanecem como tokens de estado nomeados, derivados e documentados em `contracts/design-tokens.md`. Pedido original dizia "fontes"; interpretado como cores — a fonte continua sendo a monoespaçada.

## D2 — Fonte

- **Decision**: manter `Space Mono` (já instalada via `@fontsource/space-mono`) como `--font-sans` e `--font-mono` da interface inteira, com substituta `ui-monospace, monospace`. Remover `Work Sans` se nenhuma tela a usar.
- **Rationale**: a imagem usa fonte monoespaçada em todo o texto; evita carregar duas famílias e mantém CLS baixo (`font-display: swap` + métricas similares na substituta).
- **Alternatives**: JetBrains Mono (visual próximo, mas exigiria nova dependência).

## D3 — Escalas de tipografia, espaçamento e raio

- **Decision**: tipografia: `title` 16 px bold, `label/body` 14 px regular, `action` 14 px bold, `caption` 12 px; altura de linha 1,5. Espaçamento: base de 4 px (4, 8, 12, 16, 24, 32, 48). Controles: altura 40 px (campos e botões). Raios: `--radius-sm` 4 px (campos, botões), `md` 8 px, `lg` 20 px (cards). Contêiner: `max-w-[1200px]` com gutter 16 px (mobile) / 24 px (tablet) / auto (desktop).
- **Rationale**: medido da imagem (campos ~40 px de altura, gutter de 120 px em 1440 → contêiner ~1200 px, rótulo→campo ≈ 8 px, grupo→grupo ≈ 24 px). Corpo ≥ 14 px atende FR-007.
- **Alternatives**: escala Tailwind padrão sem nomes (descartado: FR-008 pede escala nomeada).

## D4 — Ícones

- **Decision**: usar `lucide-react` (já instalado, `iconLibrary: lucide` no `components.json`), com traço 1,5 px, tamanhos 16/20/24 px e `currentColor`. Um módulo `src/shared/icons/index.ts` re-exporta **apenas** os ícones oficiais com nomes semânticos (`SearchIcon`, `CartIcon`, `ProfileIcon`, `WalletIcon`, `ActivityIcon`, `HeartIcon`, `OffersIcon`, `DownloadIcon`, `SupportIcon`, `LogoutIcon`, `LoginIcon`, `EyeIcon`, `EyeOffIcon`, `ChevronDownIcon`, `AvatarIcon`, `HomeIcon`, `MenuIcon`, `CloseIcon`).
- **Rationale**: a imagem usa ícones de contorno, finos, coerentes com Lucide; zero dependência nova; importar só do módulo permite regra de lint e troca futura de família.
- **Alternatives**: Phosphor/Heroicons (nova dependência sem ganho); SVGs próprios (manutenção alta).

## D5 — Navbar

- **Decision**: `Navbar` única em `app/layout`, ≥ md: logotipo `KURIO` (mono, bold) · itens Início/Mercado/Criadores/Aprenda com sublinhado âmbar no item atual (`aria-current="page"`) · busca · carrinho com selo · botão "Entrar" (ou conta). < md: apenas logotipo + busca + carrinho + conta; navegação principal vai para a Dock. Itens sem rota implementada ficam desabilitados (`aria-disabled`), conforme o desafio. Dados (contagem do carrinho, sessão) entram por props a partir do layout raiz via domínios `cart` e `auth`.
- **Rationale**: reaproveita a lógica do `Header.tsx` atual (já correta quanto a itens desabilitados), muda só aparência e a divisão desktop/mobile.
- **Alternatives**: menu hambúrguer com gaveta (descartado: o pedido do usuário é uma dock).

## D6 — Dock

- **Decision**: `Dock` fixa no rodapé, visível só abaixo de `md` (768 px), 4–5 destinos (Início, Mercado, Carrinho, Favoritos, Conta) vindos do mesmo `nav-items.ts` da navbar; cada item com ícone + rótulo, alvo ≥ 44 × 44 px, estado ativo com cor primária + indicador (não só cor), `padding-bottom: env(safe-area-inset-bottom)`; o `<main>` recebe padding inferior equivalente à altura da dock.
- **Rationale**: padrão de navegação mobile; uma fonte única de itens evita divergência.
- **Alternatives**: dock em todas as larguras (descartado: não está na referência desktop).

## D7 — Aplicação às telas

- **Decision**: padronização em duas camadas: (1) trocar tokens e componentes base, o que restila automaticamente os telas que já usam shadcn; (2) revisar cada página (`home`, `nft-detail`, `cart`, `checkout`, `order-confirmation`, `login`, `signup`, `profile`, `wallets`, `not-found`) removendo classes/cores avulsas e usando os componentes do catálogo. Esqueletos ainda vazios recebem só o contêiner padrão e o estado 404/erro.
- **Rationale**: `button.tsx` e `input.tsx` já são a base; a maior parte do ganho vem dos tokens. Apenas 3 rotas têm conteúdo hoje.

## D8 — Pré-requisito: conflitos de merge

- **Decision**: antes de qualquer tarefa, resolver os marcadores `<<<<<<<` em `src/shared/ui/button.tsx` (duas versões do componente: cva simples vs. shadcn completo), `src/shared/api/http.ts` e regenerar `src/app/routeTree.gen.ts` (status `UU`).
- **Rationale**: o projeto não compila com esses marcadores. Para `button.tsx`, adotar a versão shadcn (traz `asChild`, que `Header.tsx` e `ProfilePage` precisam) e ajustar tamanhos aos tokens (altura 40 px, raio `sm`).
- **Alternatives**: manter a versão simples (descartado: perde `asChild` e variantes usadas).

## D9 — Catálogo visual e verificação

- **Decision**: página interna `/design-system` (apenas em desenvolvimento/demonstração, fora da navegação) exibindo cores com contraste, escala tipográfica, espaçamentos, ícones e cada componente em todos os estados; serve de alvo para snapshots Playwright em 390/768/1440 e para a auditoria de acessibilidade. Documentação normativa fica nos contratos desta feature.
- **Rationale**: atende FR-019/FR-023 e SC-002 sem ferramenta nova (Storybook seria dependência pesada para 13 componentes).
- **Alternatives**: Storybook (descartado por custo/complexidade).
