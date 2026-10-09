# Catálogo

`components/CatalogPage.tsx` compõe a tela sem implementar consultas ou controles.

- `hooks/useCatalog.ts`: URL, navegação, consultas e ações de favoritos.
- `components/CatalogHero.tsx`: carrossel editorial com três destaques, Embla e autoplay de 6 segundos em mobile e desktop.
- `components/CatalogSidebar.tsx` e `CatalogMobileControls.tsx`: busca e filtros por breakpoint.
- `components/FilterBar.tsx`: categorias e redes com contagens globais da API, preço provisório até Aplicar e estados de loading/erro/retry.
- `components/CatalogResults.tsx`: estados de dados, grid e paginação.
- `components/CatalogToolbar.tsx` e `CatalogStatus.tsx`: ordenação e feedback acessível.
- `components/CatalogEditorial.tsx`: promoções e artigos.

Os componentes reutilizáveis ficam em `src/components/shared`: `SearchInput`,
`NFTCard`, `NFTCardSkeleton`, `NFTGrid`, `Price`, `ErrorState`, `EmptyState`,
`SortSelect` e `Pagination`. Cabeçalho, rodapé e navegação mobile ficam em
`src/components/layout`. Os estilos ficam inline em `className`, com utilitários Tailwind nos próprios componentes.

## Carregamento

O hero usa artes locais e não consulta a API. Indicadores, swipe/arraste e setas
do teclado permitem navegar. Não há botão Play/Pause; o autoplay retoma após a interação. Hover, foco e aba oculta suspendem a reprodução. Com
movimento reduzido, o autoplay fica desativado e a seleção não anima. Slides
inativos ficam fora da navegação por teclado; anúncios são apenas manuais.

`src/routes/index.tsx` mantém a validação dos parâmetros. `index.lazy.tsx` carrega
a composição apenas quando a rota é acessada, sem importar a rota dentro da feature.
`CatalogDesktopSections` forma um segundo chunk carregado com `React.lazy` apenas
quando `(min-width: 768px)` corresponde. A mudança de viewport também atualiza essa
condição. O bloco preserva a navegação direta para `#diario` após carregar.

Para ajustar o visual, altere a seção correspondente ou o componente compartilhado;
não replique os estilos de cards, busca e estados dentro da página.
