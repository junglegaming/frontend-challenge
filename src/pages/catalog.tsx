import { useState } from "react";
import {
  Link,
  useSearch,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowRight,
  Search as SearchIcon,
  Heart,
  SlidersHorizontal,
  Check,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { api, get, message, queryClient } from "../api";
import type { Cart, Nft } from "../domain";
import type { Search } from "../router";
import {
  useSession,
  useCart,
  Skeleton,
  ErrorState,
  Empty,
  toast,
} from "../shell";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/dialog";
export function FavoriteButton({ id }: { id: string }) {
  const { data } = useSession();
  const navigate = useNavigate();
  const key = ["favorites", data?.user?.id];
  const favorites = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => get<string[]>("/favorites", signal),
    enabled: !!data?.user,
  });
  const mutation = useMutation({
    mutationFn: () => api.post("/favorites", { id }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const old = queryClient.getQueryData<string[]>(key) || [];
      queryClient.setQueryData(
        key,
        old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
      );
      return { old };
    },
    onError: (e, _, context) => {
      queryClient.setQueryData(key, context?.old);
      toast(message(e));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  return (
    <button
      className={"favorite " + (favorites.data?.includes(id) ? "selected" : "")}
      aria-label={
        favorites.data?.includes(id)
          ? "Remover dos favoritos"
          : "Adicionar aos favoritos"
      }
      aria-pressed={!!favorites.data?.includes(id)}
      disabled={mutation.isPending}
      onClick={() =>
        data?.user
          ? mutation.mutate()
          : navigate({ to: "/login", search: { redirect: location.pathname } })
      }
    >
      <Heart
        size={18}
        fill={favorites.data?.includes(id) ? "currentColor" : "none"}
      />
    </button>
  );
}
export function NftCard({ nft }: { nft: Nft }) {
  return (
    <article className="nft-card">
      <div className="card-art" style={{ background: nft.color }}>
        <Link
          to="/nft/$id"
          params={{ id: nft.id }}
          aria-label={`Ver ${nft.name}`}
        >
          <img
            src={nft.image}
            alt={`Arte digital ${nft.name}, de ${nft.artist}`}
            loading="lazy"
            width="480"
            height="480"
          />
        </Link>
        <FavoriteButton id={nft.id} />
        <span className="edition-badge">
          {nft.stock ? `${nft.stock} edições` : "Esgotado"}
        </span>
      </div>
      <div className="card-info">
        <div className="artist">
          <span className="avatar-dot" style={{ background: nft.color }}>
            {nft.artist[0]}
          </span>
          {nft.artist}
          <span className="verified">
            <Check size={9} />
          </span>
        </div>
        <Link to="/nft/$id" params={{ id: nft.id }}>
          <h3>{nft.name}</h3>
        </Link>
        <div className="card-bottom">
          <div>
            <span>Preço atual</span>
            <strong>
              ◈ {nft.price} <small>ETH</small>
            </strong>
          </div>
          <Link
            to="/nft/$id"
            params={{ id: nft.id }}
            className="round-link"
            aria-label={`Detalhes de ${nft.name}`}
          >
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function Catalog() {
  const featured = useQuery({
    queryKey: ["nft", "1"],
    queryFn: ({ signal }) => get<Nft>("/nfts/1", signal),
  });
  const search = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const [filters, setFilters] = useState(false);
  const [draft, setDraft] = useState(search.q);
  const query = useQuery({
    queryKey: ["nfts", search],
    queryFn: ({ signal }) =>
      get<{ items: Nft[]; total: number; pages: number }>(
        `/nfts?${new URLSearchParams(Object.entries(search).map(([k, v]) => [k, String(v)]))}`,
        signal,
      ),
  });
  function update(patch: Partial<Search>) {
    navigate({
      search: (prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }),
    });
  }
  const filterFields = (
    <>
      <label>
        Categoria
        <select
          aria-label="Categoria"
          value={search.category}
          onChange={(e) => update({ category: e.target.value })}
        >
          <option value="">Todas as categorias</option>
          {["3D Art", "Abstract", "Photography", "Illustration"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Artista
        <select
          aria-label="Artista"
          value={search.artist}
          onChange={(e) => update({ artist: e.target.value })}
        >
          <option value="">Todos os artistas</option>
          {["Sofia Chen", "Lucas Martins", "Alex Rivera", "Maya Studio"].map(
            (c) => (
              <option key={c}>{c}</option>
            ),
          )}
        </select>
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={search.available}
          onChange={(e) => update({ available: e.target.checked })}
        />
        Somente disponíveis
      </label>
      <Button
        variant="ghost"
        onClick={() => {
          setDraft("");
          update({
            q: "",
            category: "",
            artist: "",
            available: false,
            sort: "recent",
          });
        }}
      >
        Limpar filtros
      </Button>
    </>
  );
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> BEM-VINDO À NOVA ERA
          </div>
          <h1>
            Seja dono do futuro
            <br />
            da <span>arte digital.</span>
            <span className="hero-asterisk">✳</span>
          </h1>
          <p>
            Descubra, colecione e negocie NFTs extraordinários.
            <br />
            Explore um universo de arte digital e encontre sua próxima coleção.
          </p>
          <a href="#explore" className="button button-primary">
            Explorar NFTs <ArrowUpRight size={19} />
          </a>
          <div className="hero-social">
            <div className="avatar-stack">
              <span>SC</span>
              <span>LM</span>
              <span>AR</span>
            </div>
            <p>
              <strong>Arte sem fronteiras.</strong>
              <br />
              Uma comunidade de criadores independentes.
            </p>
          </div>
        </div>
        <Link to="/nft/$id" params={{ id: "1" }} className="hero-art">
          <img
            src="/art/golden-signal.webp"
            alt="NFT de macaco com óculos e jaqueta verde"
            width="700"
            height="650"
            fetchPriority="high"
          />
          <span className="hero-art-tag">
            COLEÇÃO EXCLUSIVA / 001 <ArrowUpRight size={18} />
          </span>
          <div className="hero-art-caption">
            <div>
              <span>NFT EM DESTAQUE</span>
              <h2>{featured.data?.name || "Coleção exclusiva"}</h2>
              <p>
                {featured.data
                  ? `por ${featured.data.artist}`
                  : "Descubra novas perspectivas"}{" "}
                <Check size={13} />
              </p>
            </div>
            <div>
              <span>PREÇO ATUAL</span>
              <strong>
                {featured.data
                  ? featured.data.stock
                    ? `${featured.data.price} ETH`
                    : "Esgotado"
                  : "—"}
              </strong>
            </div>
          </div>
        </Link>
      </section>
      <div className="ticker" aria-hidden="true">
        <span>ARTE É CONEXÃO</span>✳<span>COLECIONE SUA INSPIRAÇÃO</span>✳
        <span>EXPLORE O INESPERADO</span>✳
      </div>
      <section id="explore" className="catalog-section">
        <aside className="catalog-sidebar" aria-label="Coleções em destaque">
          <div className="sidebar-panel">
            <h2>Coleções</h2>
            {[
              ["", "Todas as coleções"],
              ["3D Art", "Bored Ape"],
              ["Abstract", "Digital Dreams"],
              ["Photography", "Rare Faces"],
              ["Illustration", "Golden Club"],
            ].map(([value, label], index) => (
              <button
                key={value}
                className={search.category === value ? "active" : ""}
                onClick={() => update({ category: value })}
              >
                <span>{label}</span>
                <small>{index === 0 ? "24" : "06"}</small>
              </button>
            ))}
          </div>
          <div className="sidebar-panel">
            <h2>Explore do seu jeito</h2>
            <button onClick={() => update({ sort: "price-asc" })}>
              Menores preços <ArrowUpRight size={13} />
            </button>
            <button onClick={() => update({ available: !search.available })}>
              {search.available ? "✓ " : ""}Edições disponíveis <span>◈</span>
            </button>
          </div>
          <Link to="/nft/$id" params={{ id: "3" }} className="sidebar-feature">
            <span className="eyebrow">NFT EM DESTAQUE</span>
            <h3>
              Outras formas.
              <br />
              Novas histórias.
            </h3>
            <img
              src="/art/sage-nomad.webp"
              alt="NFT em destaque, macaco de chapéu e moletom lilás"
              loading="lazy"
              width="220"
              height="220"
            />
            <span>
              Conheça a obra <ArrowUpRight size={14} />
            </span>
          </Link>
        </aside>
        <div className="catalog-main">
          <div className="section-heading">
            <div>
              <div className="eyebrow">COLEÇÕES EXCLUSIVAS</div>
              <h2>
                Explore nossos NFTs<span>.</span>
              </h2>
            </div>
            <p>Arte única para colecionadores extraordinários.</p>
          </div>
          <div className="catalog-toolbar">
            <div className="category-tabs">
              {["", "3D Art", "Abstract", "Photography", "Illustration"].map(
                (c) => (
                  <button
                    key={c}
                    className={search.category === c ? "active" : ""}
                    onClick={() => update({ category: c })}
                  >
                    {c || "Todos os NFTs"}
                  </button>
                ),
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(true)}
            >
              <SlidersHorizontal size={16} />
              Filtros{(search.artist || search.available) && " •"}
            </Button>
          </div>
          <div className="search-toolbar">
            <form
              className="search-box"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: draft });
              }}
            >
              <SearchIcon size={18} />
              <input
                aria-label="Buscar obras ou artistas"
                placeholder="Buscar NFTs ou artistas..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit">Buscar</button>
            </form>
            <label className="sort-label">
              Ordenar por
              <select
                aria-label="Ordenar por"
                value={search.sort}
                onChange={(e) => update({ sort: e.target.value })}
              >
                <option value="recent">Mais recentes</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
              </select>
            </label>
          </div>
          {query.isPending ? (
            <Skeleton cards />
          ) : query.isError ? (
            <ErrorState error={query.error} retry={() => query.refetch()} />
          ) : query.data.items.length ? (
            <>
              <p className="result-count" aria-live="polite">
                {query.data.total} obras encontradas
                {query.isFetching ? " • Atualizando…" : ""}
              </p>
              <div className="nft-grid">
                {query.data.items.map((n) => (
                  <NftCard key={n.id} nft={n} />
                ))}
              </div>
              <nav className="pagination" aria-label="Paginação">
                <Button
                  variant="outline"
                  disabled={search.page <= 1}
                  onClick={() => update({ page: search.page - 1 })}
                >
                  Anterior
                </Button>
                <span>
                  Página {search.page} de {query.data.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={search.page >= query.data.pages}
                  onClick={() => update({ page: search.page + 1 })}
                >
                  Próxima <ArrowRight size={15} />
                </Button>
              </nav>
            </>
          ) : (
            <Empty title="Nenhuma obra encontrada">
              <p>Tente outro termo ou combine outros filtros.</p>
            </Empty>
          )}
        </div>
      </section>
      <section className="collect-banner">
        <span className="banner-symbol">✳</span>
        <div className="eyebrow">NFTS QUE DESPERTAM NOVAS HISTÓRIAS</div>
        <h2>
          Sua próxima coleção
          <br />
          começa aqui.
        </h2>
        <p>Encontre a obra que combina com você.</p>
        <a href="#explore" className="button button-primary">
          Descubra sua próxima obra <ArrowUpRight size={18} />
        </a>
      </section>
      <Modal
        open={filters}
        onOpenChange={setFilters}
        title="Refine sua descoberta"
      >
        <div className="form-stack">
          {filterFields}
          <Button onClick={() => setFilters(false)}>Ver resultados</Button>
        </div>
      </Modal>
    </div>
  );
}
function DetailSkeleton() {
  return (
    <div className="container page" role="status" aria-label="Carregando">
      <div
        className="skeleton"
        style={{ width: 180, height: 17, marginBottom: 25 }}
      />
      <div className="detail-grid">
        <div>
          <div className="detail-art skeleton" />
          <div className="detail-thumbnails">
            <div className="skeleton" style={{ width: 72, height: 72 }} />
          </div>
        </div>
        <div className="detail-info">
          <div
            className="skeleton"
            style={{ width: 200, height: 10, marginBottom: 18 }}
          />
          <div
            className="skeleton"
            style={{ width: "85%", height: 47, marginBottom: 20 }}
          />
          <div className="skeleton" style={{ width: 180, height: 20 }} />
          <div className="skeleton" style={{ height: 90, marginBlock: 24 }} />
          <div className="skeleton" style={{ height: 140, marginBottom: 22 }} />
          <div className="skeleton" style={{ height: 72 }} />
          <div className="skeleton" style={{ height: 42, marginTop: 14 }} />
          <div className="skeleton" style={{ height: 42, marginTop: 14 }} />
          <div className="skeleton" style={{ height: 14, marginBlock: 16 }} />
          <div className="skeleton" style={{ height: 100 }} />
        </div>
      </div>
    </div>
  );
}
export function Detail() {
  const { id } = useParams({ from: "/nft/$id" });
  const query = useQuery({
    queryKey: ["nft", id],
    queryFn: ({ signal }) => get<Nft>(`/nfts/${id}`, signal),
  });
  const [edition, setEdition] = useState("Original");
  const [quantity, setQuantity] = useState(1);
  const cart = useCart();
  const add = useMutation({
    mutationFn: async () => {
      const current =
        cart.data?.items.find((i) => i.id === id && i.edition === edition)
          ?.quantity || 0;
      return api.post<Cart>("/cart", {
        id,
        edition,
        quantity: current + quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast("Obra adicionada ao carrinho.");
    },
    onError: (e) => toast(message(e)),
  });
  if (query.isPending) return <DetailSkeleton />;
  if (query.isError)
    return (
      <div className="container">
        <ErrorState error={query.error} retry={() => query.refetch()} />
      </div>
    );
  const n = query.data;
  const available = Math.min(n.stock, n.editionStock?.[edition] ?? n.stock);
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/">Explore</Link>
        <span>/</span>
        <span>{n.name}</span>
      </div>
      <div className="detail-grid">
        <div className="detail-gallery">
          <div className="detail-art" style={{ background: n.color }}>
            <img src={n.image} alt={n.name} width="700" height="700" />
            <FavoriteButton id={id} />
          </div>
          <div className="detail-thumbnails">
            <img
              src={n.image}
              alt="Vista da obra selecionada"
              width="72"
              height="72"
            />
            <span>
              Digital collectible
              <br />
              <small>Original artwork • {n.category}</small>
            </span>
          </div>
        </div>
        <div className="detail-info">
          <span className="eyebrow">{n.category} / EDIÇÃO LIMITADA</span>
          <h1>
            {n.name}
            <span>.</span>
          </h1>
          <div className="artist">
            <span className="avatar-dot" style={{ background: n.color }}>
              {n.artist[0]}
            </span>
            Criado por <strong>{n.artist}</strong>
            <Check size={14} />
          </div>
          <p className="detail-description">
            A moment suspended between imagination and reality. This unique
            digital artwork explores the beauty of unexpected forms, inviting
            you to see the familiar in a completely new way.
          </p>
          <div className="price-box">
            <span>Preço atual</span>
            <strong>
              ◈ {n.price} <small>ETH</small>
            </strong>
            <p>{available} edições disponíveis</p>
          </div>
          <div className="row">
            <label className="grow">
              Edição
              <select
                value={edition}
                aria-label="Edição"
                onChange={(e) => {
                  setEdition(e.target.value);
                  setQuantity(1);
                }}
              >
                {n.editions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                    {(n.editionStock?.[x] ?? n.stock) === 0
                      ? " — indisponível"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantidade
              <div className="quantity">
                <button
                  aria-label="Diminuir quantidade"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => q - 1)}
                >
                  <Minus size={14} />
                </button>
                <output>{quantity}</output>
                <button
                  aria-label="Aumentar quantidade"
                  disabled={quantity >= available}
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </label>
          </div>
          <Button
            className="full"
            disabled={!available || add.isPending || quantity > available}
            onClick={() => add.mutate()}
          >
            {add.isPending
              ? "Adicionando…"
              : available
                ? "Adicionar ao carrinho"
                : "Edição esgotada"}
            <ArrowUpRight size={18} />
          </Button>
          <Button asChild variant="outline" className="full">
            <Link to="/cart">Ver carrinho</Link>
          </Button>
          <div className="secure-note">
            <ShieldCheck size={17} />
            Compra simulada e segura. Nenhum valor real será cobrado.
          </div>
          <details open>
            <summary>Sobre a obra</summary>
            <p>
              Arquivo digital em alta resolução. Edição selecionada: {edition}.
              Rede demonstrativa Ethereum / Polygon. A compra concede uma
              licença pessoal de exibição.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
