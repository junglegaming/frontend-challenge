# Estilos Reutilizáveis — Cores, Textos e Componentes

> Fonte de verdade: arquivo Figma `Frontend Challenge` (`Ff0SksUi7UFtPWUO8kyNtw`),
> extraído via API (`pnpm fig:extract`). Estrutura do projeto: [`ESTRUTURA.md`](./ESTRUTURA.md).

## 1. Tipografia

**Família única: Roboto Mono** (400, 500, 700) — 100% dos textos do layout.

- Auto-hospedar em `public/fonts/` via `@fontsource/roboto-mono` (pesos 400/500/700 + itálico se necessário).
- Fallback: `ui-monospace, SFMono-Regular, Menlo, monospace`.
- No Tailwind v4: `--font-mono: "Roboto Mono", …` em `@theme` e `font-mono` como default do body.

### 1.1 Inventário de text styles em uso (extraído do Figma)

| Estilo Figma | Peso | Tamanho | Line-height |
| --- | ---: | ---: | ---: |
| Display/43 Bold | 700 | 43px | 70px |
| Display/32 Bold | 700 | 32px | 42.2px |
| Heading/28 Bold | 700 | 28px | 36.9px |
| Heading/24 Bold | 700 | 24px | 31.7px |
| Title/22 Bold | 700 | 22px | 16px* |
| Title/22 Regular | 400 | 22px | 29px |
| Title/21 Regular | 400 | 21px | 16px* |
| Title/20 Bold | 700 | 20px | 16px* |
| Title/20 Medium | 500 | 20px | 16px* |
| Title/20 Regular · lh 10 | 400 | 20px | 28px |
| Body Large/18 Bold | 700 | 18px | 16px / 24px |
| Body Large/18 Medium | 500 | 18px | 25px |
| Body Large/18 Regular | 400 | 18px | 16px |
| Body Large/17 Bold | 700 | 17px | 16px |
| Body Large/17 Regular | 400 | 17px | 16px / 24px |
| Body Large/16 Bold | 700 | 16px | 16px / 20px / 21.1px(auto) |
| Body Large/16 Medium | 500 | 16px | 16px / 21.1px(auto) |
| Body Large/16 Regular | 400 | 16px | 16px / 22px / 21.1px(auto) |
| Body/15 Bold | 700 | 15px | 15px / 16px / 40px |
| Body/15 Medium | 500 | 15px | 16px |
| Body/15 Regular | 400 | 15px | 15px / 19.8px / 40px / 45px |
| Body/14 Bold | 700 | 14px | 16px / 20px / 24px / 18.5px(auto) |
| Body/14 Medium | 500 | 14px | 16px / 20px |
| Body/14 Regular | 400 | 14px | 15px / 16px / 22px / 24px / 30px |
| Caption/13 Medium | 500 | 13px | 16px |
| Caption/13 Regular | 400 | 13px | 16px / 22px |
| Caption/12 Bold | 700 | 12px | 14px |
| Caption/12 Regular | 400 | 12px | 16px / 18px |
| Tiny/10 Medium | 500 | 10px | 13.2px |
| Tiny/9 Bold | 700 | 9px | 11.9px |

\* line-height menor que o tamanho: rótulos de linha única (badges, botões).

### 1.2 Tokens recomendados (`@theme` em `global.css`)

```css
@theme {
  --text-display:    43px;  --text-display--line-height: 70px;    --text-display--font-weight: 700;
  --text-display-2:  32px;  --text-display-2--line-height: 42px;  --text-display-2--font-weight: 700;
  --text-h1:         28px;  --text-h1--line-height: 37px;         --text-h1--font-weight: 700;
  --text-h2:         24px;  --text-h2--line-height: 32px;         --text-h2--font-weight: 700;
  --text-title:      20px;  --text-title--line-height: 28px;
  --text-body-18-bold: 18px; --text-body-18-bold--line-height: 16px; --text-body-18-bold--font-weight: 700; --text-body-18-bold--letter-spacing: 0em;
  --text-body-18-regular: 18px; --text-body-18-regular--line-height: 16px; --text-body-18-regular--font-weight: 400; --text-body-18-regular--letter-spacing: 0em;
  --text-body-17-bold: 17px; --text-body-17-bold--line-height: 16px; --text-body-17-bold--font-weight: 700; --text-body-17-bold--letter-spacing: 0em;
  --text-body-17-regular: 17px; --text-body-17-regular--line-height: 24px; --text-body-17-regular--font-weight: 400; --text-body-17-regular--letter-spacing: 0em;
  --text-body-lg:    16px;  --text-body-lg--line-height: 24px;
  --text-body-lg-bold: 16px; --text-body-lg-bold--line-height: 24px; --text-body-lg-bold--font-weight: 700;
  --text-body-lg-medium: 16px; --text-body-lg-medium--line-height: 24px; --text-body-lg-medium--font-weight: 500;
  --text-body:       15px;  --text-body--line-height: 24px;
  --text-body-combo: 15px; --text-body-combo--line-height: 16px; --text-body-combo--font-weight: 500; --text-body-combo--letter-spacing: 0em;
  --text-body-regular: 14px; --text-body-regular--line-height: 24px; --text-body-regular--font-weight: 400;
  --text-body-medium: 14px; --text-body-medium--line-height: 16px; --text-body-medium--font-weight: 500;
  --text-body-bold: 14px; --text-body-bold--line-height: 16px; --text-body-bold--font-weight: 700; --text-body-bold--letter-spacing: 0em;
  --text-body-sm:    14px;  --text-body-sm--line-height: 22px;
  --text-caption:    13px;  --text-caption--line-height: 16px;
  --text-caption-bold: 12px; --text-caption-bold--line-height: 14px; --text-caption-bold--font-weight: 700; --text-caption-bold--letter-spacing: 0em;
  --text-tiny:       12px;  --text-tiny--line-height: 16px;
  --text-tiny-bold: 9px; --text-tiny-bold--line-height: 11.9px; --text-tiny-bold--font-weight: 700; --text-tiny-bold--letter-spacing: 0em;
  --text-micro:      10px;  --text-micro--line-height: 13px;      --text-micro--font-weight: 500;
}
```

**Regra de uso:** o token é o default; quando o Figma pedir um line-height diferente do token,
use o utilitário arbitrário (`text-[14px] leading-[30px]`) mantendo peso/cores do token.
Não crie um token por variante de line-height.

**Tipografia responsiva:** use a mesma classe em desktop e mobile, por exemplo
`text-body-medium`. Ajustes mobile dos tokens ficam na media query
`@media (width < 48rem)` de `global.css`, alinhada ao breakpoint `md` do Tailwind.
`--text-body-medium` mantém 14 px em ambos os tamanhos por enquanto; novos ajustes
devem ser centralizados nesse bloco, sem criar classes com sufixo `-mobile`.
`text-body-regular` usa 14 px / line-height 24 px no desktop e 12 px / line-height
18 px abaixo de 48 rem, mantendo peso 400.

## 2. Cores

### 2.1 Paleta (estilos nomeados do Figma → tokens Tailwind)

| Token (`@theme`) | Hex | Estilo Figma | Uso |
| --- | --- | --- | --- |
| `--color-ink` | `#140D0A` | Color/Ink | fundo base da página/app |
| `--color-surface-card` | `#241612` | Color/Surface Card | cards, painéis, inputs sobre o fundo |
| `--color-surface-raised` | `#2F1D15` | Color/Surface Raised | itens elevados, hover de card, dropdowns |
| `--color-surface-dark` | `#38220F` | Color/Surface Dark | áreas internas, trilhos, footer |
| `--color-border` | `#3F2319` | Color/Border | borda padrão (1px) |
| `--color-border-soft` | `#55321F` | Color/Border Soft | borda secundária / hover de borda |
| `--color-foreground` | `#F5F1EB` | Color/Foreground | texto principal (creme) |
| `--color-text-secondary` | `#CFB28C` | Text/Secondary | texto de apoio, labels |
| `--color-text-accent` | `#E89B55` | Text/Accent | destaques dentro de texto, links |
| `--color-primary` | `#D28A4C` | Color/Primary | botões primários, acentos, foco |
| `--color-primary-light` | `#DD9A5F` | Color/Primary Light | hover do primário |
| `--color-primary-dark` | `#C47B3E` | Color/Primary Dark | active/pressed |
| `--color-secondary` | `#B39463` | Color/Secondary | badges, acentos alternativos |
| `--color-amber` | `#E3A44E` | Color/Amber | destaques de status (em alta, RARO) |
| `--color-coral` | `#EA6B4F` | Text/Coral | preços promocionais, avisos (renderiza `#F0805F` com opacidade) |
| `--color-success` | `#00A66C` | Color/Success | confirmações, pedido confirmado |
| `--color-error` | `#ED1B2E` | Color/Error | erros de validação, pedido recusado |
| `--color-elevated-light` | `#FBFBFB` | Color/Background Elevated | superfícies claras (botão Google, tooltips claros) |
| `--color-gray-light` | `#EDEDED` | Color/Gray Light | divisórias claras, placeholder sobre claro |
| `--color-white` / `--color-black` | `#FFFFFF` / `#000000` | Color/White · Color/Black | uso pontual |

`Text/Primary` é um estilo legado ("creme mais quente que Foreground") — **não usar**; headings usam `foreground`.

### 2.2 Cores de marca (botões sociais / logos)

`Google Blue #4086F4` (e variantes de logo), `Facebook #3B5999`, `Blue #4175DF`,
`Indigo #283593`, `Light Blue #03A9F4`, `Orange #FF641A`, `Google Green #59C36A`,
`Google Yellow #FFDA2D` — aplicar apenas nos ícones/botões sociais correspondentes.

### 2.3 Regras de cor

1. Fundo da app = `ink`; camadas sobem `surface-card → surface-raised → surface-dark`.
2. Texto principal sempre `foreground`; secundário `text-secondary`; nunca cinza puro.
3. Estados NÃO dependem só de cor: erro = ícone + texto + borda; sucesso = ícone + texto.
4. Botão primário: bg `primary`, texto `ink` (contraste alto), hover `primary-light`,
   active `primary-dark`, foco = ring `primary` 2px + offset 2px.
5. Verificar contraste mínimo AA nos pares usados (Lighthouse Accessibility ≥ 95 exige).

## 3. Raios, bordas e sombras

| Uso | Raio | Frequência no Figma |
| --- | ---: | --- |
| Chips/badges pequenos, tags | 3–4px | alta |
| Botões, inputs, miniaturas | 5–6px | alta |
| Cards pequenos, avatares | 8px | média |
| Cards, diálogos, painéis | 16–20px | média |
| Pill (segmented, preços, avatares redondos) | 37px / full | média |

Tokens: `--radius-sm: 4px; --radius: 6px; --radius-md: 8px; --radius-lg: 16px; --radius-xl: 20px; --radius-2xl: 24px; --radius-pill: 9999px`.

- **Bordas:** 1px (`border` padrão) e 1.5px (destaques/inputs focados); 2px só em anéis/ícones.
- **Sombras** (não há effect styles nomeados — padrões observados):
  - Card elevado: `0 6px 20px rgb(0 0 0 / 45%)` ou `0 0 20px rgb(0 0 0 / 45%)` (brilho)
  - Popover/dropdown: `0 4px 12px rgb(0 0 0 / 15%)`
  - Botão/CTA: `0 0 20px rgb(210 138 76 / ~25%)` (glow do primary) — usar com moderação
  - Nunca empilhar mais de 2 sombras; sobre `surface-raised`, prefira borda a sombra.

## 4. Componentes reutilizáveis

### 4.1 shadcn/ui adaptados ao tema (`src/components/ui/`)

Instalar sob demanda e adaptar cores ao `@theme`:

`button`, `input`, `label`, `textarea`, `badge`, `card`, `dialog`, `alert-dialog`, `sheet` (drawer mobile),
`select`, `dropdown-menu`, `checkbox`, `radio-group`, `switch`, `tabs`, `separator`, `skeleton`,
`tooltip`, `sonner` (toasts), `form` (react-hook-form + zod), `avatar`, `table`, `accordion`, `slider`.

O filtro de preço usa o Slider Range (Radix) com dois marcadores cobre, trilha de 4 px,
foco visível e área de toque ampliada. Escala linear inicial de 0 a 20 ETH, passo de
0,01 ETH; preços maiores da URL ampliam a escala até o próximo ETH inteiro. A seleção
é provisória até **Aplicar**. Conversões entre posições inteiras e ETH ficam em
`lib/money.ts`; valores exatos da URL são preservados até mover o respectivo marcador.

Variantes novas do `Button`: `primary` (default), `secondary` (borda `border-soft`, texto foreground),
`ghost`, `danger` (coral/error), `pill`, tamanhos `xsm/sm/md/lg` e `full-width`.
`xsm` preserva o tamanho compacto anterior (32 px de altura); `sm` tem 36 px de altura
e padding de 9 px vertical / 7 px horizontal.

`CatalogButton` (`ui/catalog-button`) é um botão de seleção com sublinhado, reutilizável
entre telas. Recebe `active` (false por padrão), conteúdo em `children` e props nativas
de botão, incluindo `onClick`, `disabled`, `ref` e `className`. A tela controla a seleção;
o componente anuncia o estado via `aria-pressed` e usa `type="button"` por padrão.

`IconBadge` envolve um ícone e recebe `count`. O contador usa fundo `primary`, texto
`ink`, altura de 16 px e fica sobreposto no canto superior direito. Oculta zero e
valores inválidos, exibe `99+` acima de 99 e anuncia a quantidade completa via `aria-live`.

### 4.2 Componentes custom (`src/components/shared/`)

| Componente | Responsabilidade |
| --- | --- |
| `NFTCard` | miniatura + nome + coleção + preço + favorito; usado no catálogo e buscas |
| `NFTGrid` | grade responsiva com skeletons embutidos (3 col desktop / 2 tablet / 1–2 mobile) |
| `Price` | formata ETH (`decimal.js`), símbolo, variação/coral quando aplicável |
| `QuantityStepper` | `− / n / +` com limites (disponibilidade, edição), acessível (aria-live) |
| `FavoriteButton` | toggle otimista de favorito (guard de auth) |
| `SearchInput` | campo de busca com limpar (X) — espelha o componente `Search` do Figma |
| `FilterBar` / `FilterGroup` | filtros combináveis (drawer no mobile) |
| `SortSelect` | ordenação (`select` do shadcn) |
| `Pagination` | páginas; sincroniza com `page` da URL |
| `CouponInput` | aplicar/remover cupom com estados inválido/expirado |
| `OrderSummary` | subtotal, desconto, taxa de rede, total |
| `StatusBadge` | status do pedido (pendente/confirmado/recusado) — cor + ícone + texto |
| `WalletCard` / `WalletSelect` / `NetworkSelect` | carteiras e rede no checkout |
| `FormField` | label + input + descrição + erro associado (`aria-describedby`, `aria-invalid`) |
| `Skeleton` | bloco com shimmer (gradiente em sweep) preservando dimensões do conteúdo |
| `EmptyState` / `ErrorState` | estados de vazio/erro com ação de retry |
| `PageContainer` | largura/max-width e padding consistentes (1440 desktop, 414 mobile) |

### 4.3 Componentes do Figma → React

| Componente Figma | Instâncias | Destino |
| --- | ---: | --- |
| `Header Row` | 9 | `layout/Header` (itens de nav/conta) |
| `Header With Divider` | 5 | `layout/Header` (variante com divisor) |
| `Footer` | 5 | `layout/Footer` (links fora do escopo → comportamento inerte, sem sucesso aparente) |
| `Filters` | 3 | `catalog/components/FilterBar` |
| `Search` | — | `shared/SearchInput` |
| `Password Input` | 3 | `ui/password-input` (Input + botão mostrar/ocultar) |
| `Social Button` (set) | 8 | `ui/social-button` (variantes Google/…) |
| `Mobile Social Block` | 2 | `auth/components/SocialBlock` (variante mobile) |
| `Arrow-Down`, `X`, `User`, `Shop`, `Message` | 1–9 | `shared/*` ou pages (ícones/controles) |
| `Marketplace Page`, `Checkout Page` | 2+2 | páginas (marcadores de seção, não componentes) |

### 4.4 Ícones

O layout usa o set **Iconly** (Bold / Curved / Light-Outline / Two-tone) — não é o lucide.

- Exportar os SVGs reais do Figma (`pnpm fig:extract` → `/v1/images?format=svg`) para `public/icons/`
  e expor como componentes em `components/icons/` (`<IconlyLogout />`), com `aria-hidden` quando decorativo.
- Inventário por instâncias: `Logout ×11`, `Star ×6`, `Hide ×8` (2 variantes), `Delete ×4`,
  `Arrow-Right/Left/Down ×18`, `Filter ×4`, `Location ×2`, `Activity ×2`, `Download ×2`,
  `Danger Triangle ×2`, `Home`, `Wallet`, `Image 2`, `Arrow-Right 2`.
- Substituir por lucide-react **só** se a exportação falhar; documentar troca no `ARCHITECTURE.md`.

## 5. Estados visuais padrão

| Estado | Padrão |
| --- | --- |
| **Loading** | `Skeleton` com shimmer no mesmo tamanho do conteúdo (catálogo, detalhe, resumo do carrinho). Animação desligada em `prefers-reduced-motion` (bloco estático na cor `surface-raised`). |
| **Vazio** | `EmptyState`: título + descrição + CTA (ex.: "Nenhum NFT encontrado" + limpar filtros). |
| **Erro** | `ErrorState`: mensagem do `AppError` + botão "Tentar novamente" (requery). |
| **Background update** | Query em refetch → indicador sutil (opacidade 70% no conteúdo, sem spinner de tela cheia). |
| **Foco** | `outline: 2px solid primary; outline-offset: 2px` — sempre visível, nunca `outline: none` sem substituto. |
| **Hover** | card: borda `border-soft` + leve elevação; link: `text-accent`; botão primário: `primary-light`. |
| **Disabled** | opacidade 50% + `cursor: not-allowed` + `aria-disabled` (não remover do DOM). |

## 6. Responsividade

| Breakpoint | Base | Observação |
| --- | ---: | --- |
| Mobile | **414px** (frames Figma) | testar também 390px (exigência do enunciado) |
| Tablet | 768px | sem frame no Figma — seguir padrão do desktop recomposto |
| Desktop | **1440px** | frames desktop |

- Grid do catálogo: 3 col (≥1024) / 2 col (≥640) / 1–2 col (mobile).
- Filtros: inline no desktop, `Sheet`/drawer no mobile.
- Header: navegação completa no desktop, menu hambúrguer (`Sheet`) no mobile.
- Sem overflow horizontal; imagens com proporção preservada (`aspect-square` nos NFTs);
  zoom de 200% sem perda de conteúdo (WCAG).
