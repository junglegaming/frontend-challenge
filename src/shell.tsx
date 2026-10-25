import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ShoppingBag,
  Menu,
  X,
  Leaf,
  Heart,
  UserRound,
  Wallet,
  SlidersHorizontal,
} from "lucide-react";
import { api, get, message, queryClient } from "./api";
import type { Cart, Nft, Order, User, Scenario } from "./domain";
import { scenarios } from "./domain";
import { Button } from "./components/ui/button";
import { Modal } from "./components/ui/dialog";
export const sessionOptions = {
  queryKey: ["session"],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    get<{ user: User | null }>("/session", signal),
};
export function useSession() {
  return useQuery(sessionOptions);
}
export function useCart() {
  const { data } = useSession();
  return useQuery({
    queryKey: ["cart", data?.user?.id || "guest"],
    queryFn: ({ signal }) => get<Cart>("/cart", signal),
  });
}
let notify: (s: string) => void = () => {};
export function toast(text: string) {
  notify(text);
}
export function Skeleton({ cards = false }: { cards?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cards ? "nft-grid" : ""}
    >
      {Array.from({ length: cards ? 8 : 1 }, (_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: cards ? 370 : 220 }}
        />
      ))}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div className="empty" role="alert">
      <h2>Ops, algo deu errado</h2>
      <p>{message(error)}</p>
      <Button onClick={retry}>Tentar novamente</Button>
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Leaf size={36} />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
function Realtime() {
  const { data } = useSession();
  useEffect(() => {
    let active = true;
    let close = () => {};
    // Load after MSW installs WebSocket interception; keep the socket client
    // outside the initial render's critical path.
    import("socket.io-client")
      .then(({ io }) => {
        if (!active) return;
        const socket = io(window.location.origin, {
          transports: ["websocket"],
          autoConnect: false,
        });
        const versions = new Map<string, number>();
        socket.on("connect", () => {
          socket.emit("subscribe", data?.user?.id);
          queryClient.invalidateQueries({
            predicate: (q) =>
              ["nfts", "nft", "cart", "quote", "order"].includes(
                String(q.queryKey[0]),
              ),
          });
        });
        socket.on("nft.updated", (nft: Nft & { eventId: string }) => {
          const key = "nft:" + nft.id;
          const cached = queryClient.getQueryData<Nft>(["nft", nft.id]);
          const listVersion = Math.max(
            0,
            ...queryClient
              .getQueriesData<{ items?: Nft[] } | Nft[]>({ queryKey: ["nfts"] })
              .flatMap(([, data]) =>
                (Array.isArray(data) ? data : data?.items || [])
                  .filter((item) => item.id === nft.id)
                  .map((item) => item.version),
              ),
          );
          if (
            nft.version <=
            Math.max(versions.get(key) || 0, cached?.version || 0, listVersion)
          )
            return;
          versions.set(key, nft.version);
          queryClient.setQueryData(["nft", nft.id], nft);
          queryClient.invalidateQueries({
            predicate: (q) =>
              ["nfts", "cart", "quote"].includes(String(q.queryKey[0])),
          });
          toast(
            "Preço ou disponibilidade atualizados. Revise sua coleção antes de comprar.",
          );
        });
        socket.on("order.updated", (order: Order) => {
          if (order.userId !== data?.user?.id) return;
          const key = "order:" + order.id;
          const cached = queryClient.getQueryData<Order>([
            "order",
            data?.user?.id,
            order.id,
          ]);
          if (
            order.version <=
              Math.max(versions.get(key) || 0, cached?.version || 0) ||
            (cached && cached.status !== "pending")
          )
            return;
          versions.set(key, order.version);
          queryClient.setQueryData(["order", data?.user?.id, order.id], order);
          queryClient.invalidateQueries({ queryKey: ["cart"] });
        });
        socket.connect();
        close = () => {
          socket.removeAllListeners();
          socket.disconnect();
        };
      })
      .catch(() => {
        if (active)
          toast(
            "Atualizações ao vivo indisponíveis. Recarregue a página para reconectar.",
          );
      });
    return () => {
      active = false;
      close();
    };
  }, [data?.user?.id]);
  return null;
}
export function Shell() {
  const { data } = useSession();
  const cart = useCart();
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [demo, setDemo] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    notify = setNotice;
    return () => {
      notify = () => {};
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (r) => r,
      (error) => {
        if (
          error.response?.status === 401 &&
          !error.config.url?.startsWith("/auth")
        ) {
          queryClient.clear();
          queryClient.setQueryData(["session"], { user: null });
          if (
            ["/checkout", "/profile", "/wallets", "/favorites", "/orders"].some(
              (p) => location.pathname.startsWith(p),
            )
          )
            navigate({ to: "/login", search: { redirect: location.href } });
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [location.href, location.pathname, navigate]);
  async function logout() {
    await api.post("/auth/logout");
    queryClient.clear();
    await navigate({ to: "/" });
    toast("Você saiu da sua conta.");
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <div className="announcement">
        Um novo mundo de arte espera por você <ArrowUpRight size={13} />
        <span>DEMONSTRAÇÃO • SEM TRANSAÇÕES REAIS</span>
      </div>
      <header className="header container">
        <Link to="/" className="brand" aria-label="Jungle início">
          <Leaf fill="currentColor" size={25} />
          jungle<span>®</span>
        </Link>
        <nav aria-label="Navegação principal" className="desktop-nav">
          <Link to="/" activeProps={{ className: "active" }}>
            Explore
          </Link>
          <Link to="/favorites">Favoritos</Link>
        </nav>
        <div className="header-actions">
          <Link
            to="/cart"
            className="cart-link"
            aria-label={`Carrinho, ${cart.data?.items.reduce((s, i) => s + i.quantity, 0) || 0} itens`}
          >
            <ShoppingBag size={20} />
            <span>
              {cart.data?.items.reduce((s, i) => s + i.quantity, 0) || 0}
            </span>
          </Link>
          {data?.user ? (
            <>
              <Link to="/profile" className="account-link">
                <UserRound size={19} />
                <span>{data.user.name.split(" ")[0]}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sair
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/login" search={{ redirect: location.href }}>
                Entrar <ArrowUpRight size={16} />
              </Link>
            </Button>
          )}
          <Button
            className="mobile-menu"
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            onClick={() => setMenu(true)}
          >
            <Menu />
          </Button>
        </div>
      </header>
      <Modal open={menu} onOpenChange={setMenu} title="Menu">
        <nav className="mobile-nav">
          <Link to="/">Explore</Link>
          <Link to="/favorites">
            <Heart size={18} />
            Favoritos
          </Link>
          <Link to="/profile">
            <UserRound size={18} />
            Meu perfil
          </Link>
          <Link to="/wallets">
            <Wallet size={18} />
            Carteiras
          </Link>
        </nav>
      </Modal>
      <Realtime />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer container">
        <div>
          <Link to="/" className="brand">
            <Leaf fill="currentColor" size={22} />
            jungle<span>®</span>
          </Link>
          <p>Arte extraordinária. Conexões que ficam.</p>
        </div>
        <div className="footer-links">
          <Link to="/">Explore</Link>
          <Link to="/profile">Minha conta</Link>
          <Link to="/wallets">Carteiras</Link>
          <button onClick={() => setDemo(true)}>
            <SlidersHorizontal size={14} /> Cenários
          </button>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Jungle. Todos os direitos reservados.
          </span>
          <span>Marketplace demonstrativo. Arte e transações simuladas.</span>
        </div>
      </footer>
      <div className="toast" role="status" aria-live="polite">
        {notice && (
          <div>
            {notice}
            <button onClick={() => setNotice("")} aria-label="Dispensar aviso">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <Demo open={demo} close={() => setDemo(false)} />
    </>
  );
}
function Demo({ open, close }: { open: boolean; close: () => void }) {
  const [scenario, setScenario] = useState<Scenario>("standard");
  async function change(reset = false) {
    await api.post(reset ? "/demo/reset" : "/demo/scenario", { scenario });
    if (reset) {
      queryClient.clear();
      sessionStorage.clear();
    } else queryClient.invalidateQueries();
    toast(reset ? "Cenário restaurado." : "Cenário selecionado.");
    close();
  }
  return (
    <Modal open={open} onOpenChange={close} title="Laboratório de cenários">
      <p className="muted">
        Controles da API simulada para testar falhas e recuperação.
      </p>
      <label>
        Cenário
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value as Scenario)}
        >
          {scenarios.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <div className="row wrap">
        <Button onClick={() => change()}>Aplicar</Button>
        <Button variant="outline" onClick={() => change(true)}>
          Restaurar cenário
        </Button>
      </div>
      <hr />
      <p>Eventos via Socket.IO, NFT #1</p>
      <div className="row wrap">
        <Button
          variant="outline"
          onClick={() => api.post("/demo/event", { id: "1", kind: "price" })}
        >
          Alterar preço
        </Button>
        <Button
          variant="outline"
          onClick={() => api.post("/demo/event", { id: "1", kind: "stock" })}
        >
          Esgotar edição
        </Button>
        <Button
          variant="outline"
          onClick={() => api.post("/demo/event", { kind: "expire" })}
        >
          Expirar sessão
        </Button>
      </div>
    </Modal>
  );
}
export function NotFound() {
  return (
    <div className="container empty">
      <h1>Esta página se perdeu na selva.</h1>
      <p>O endereço não existe. Explore algo novo.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
