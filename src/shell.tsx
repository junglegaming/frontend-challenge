import { accountLabel } from "./lib/session";
import {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";

import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";

import {
  Menu,
  Search,
  ShoppingCart,
  LogIn,
  UserRound,
  FlaskConical,
  Home as HomeIcon,
  Heart,
  ScanLine,
  ChevronLeft,
  LogOut,
} from "lucide-react";

import { http, logout, message, queryClient, useCart, useSession } from "./api";
import { useRealtime } from "./configs/websocket-realtime";
import { Button } from "./components/ui/button";
import { Dialog } from "./components/ui/dialog";

const ToastContext = createContext<(text: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function AppShell() {
  const { data: user } = useSession();
  const { data: cart } = useCart(user);
  const [toast, setToast] = useState("");
  const notify = useCallback((text: string) => setToast(text), []);
  const connected = useRealtime(user?.id, notify);
  const [menu, setMenu] = useState(false);
  const [demo, setDemo] = useState(false);
  const [scenario, setScenario] = useState("standard");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const favorites = useRouterState({
    select: (s) => s.location.search.favorites === true,
  });
  const auth = pathname === "/login" || pathname === "/cadastro";
  const page = auth
    ? "auth"
    : pathname.startsWith("/nft/")
      ? "detail"
      : pathname.startsWith("/pedido/")
        ? "receipt"
        : pathname === "/"
          ? "home"
          : pathname.slice(1);
  const count = cart?.reduce((total, line) => total + line.quantity, 0) ?? 0;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const listener = () => {
      if (
        ["/pagamento", "/perfil", "/carteiras", "/pedidos"].includes(
          location.pathname,
        ) ||
        location.pathname.startsWith("/pedido/") ||
        (location.pathname === "/" &&
          new URLSearchParams(location.search).get("favorites") === "true")
      )
        void navigate({
          to: "/login",
          search: { returnTo: location.pathname + location.search },
        });
    };
    window.addEventListener("kurio:session-expired", listener);
    return () => window.removeEventListener("kurio:session-expired", listener);
  }, [navigate]);

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  return (
    <ToastContext.Provider value={notify}>
      <div className={`app-shell page-${page}`}>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" to="/" aria-label="KURIO início">
              KURIO<span>®</span>
            </Link>
            <nav className="desktop-nav" aria-label="Principal">
              <Link
                to="/"
                className={
                  pathname === "/" ||
                  ["/perfil", "/carteiras", "/pedidos"].includes(pathname)
                    ? "active"
                    : ""
                }
              >
                Início
              </Link>
              <Link to="/" hash="mercado">
                Mercado
              </Link>
              <a href="#criadores">Criadores</a>
              <a href="#sobre">Aprenda</a>
            </nav>
            <div className="header-actions">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Buscar NFTs"
                onClick={() => {
                  void navigate({ to: "/", hash: "mercado" });
                  setTimeout(
                    () => document.getElementById("catalog-search")?.focus(),
                    100,
                  );
                }}
              >
                <Search size={19} />
              </Button>
              <Link
                to="/carrinho"
                className="cart-link"
                aria-label={`Carrinho, ${cart?.reduce((a, x) => a + x.quantity, 0) ?? 0} itens`}
              >
                <ShoppingCart size={20} />
                {!!cart?.length && (
                  <span>{cart.reduce((a, x) => a + x.quantity, 0)}</span>
                )}
              </Link>
              <Button size="sm" asChild>
                {user ? (
                  <Link to="/perfil" aria-label="Meu perfil">
                    <UserRound size={15} />
                    <span className="login-label">{accountLabel(user)}</span>
                  </Link>
                ) : (
                  <Link to="/login" aria-label="Entrar na conta">
                    <LogIn size={15} />
                    <span className="login-label">Entrar</span>
                  </Link>
                )}
              </Button>
              <Button
                className="mobile-menu"
                variant="ghost"
                size="icon"
                aria-label="Abrir navegação"
                onClick={() => setMenu(true)}
              >
                <Menu size={20} />
              </Button>
            </div>
          </div>
        </header>
        {!auth && pathname !== "/" && (
          <div className="mobile-page-header">
            <Link
              to={pathname === "/pagamento" ? "/carrinho" : "/"}
              aria-label="Voltar"
            >
              <ChevronLeft size={19} />
            </Link>
            <span>
              {page === "detail"
                ? ""
                : page === "carrinho"
                  ? "Carrinho de NFTs"
                  : page === "pagamento"
                    ? "Pagamento com carteira"
                    : page === "perfil"
                      ? "Meu perfil"
                      : page === "carteiras"
                        ? "Minhas carteiras"
                        : page === "receipt"
                          ? "Seu pedido"
                          : "Meus pedidos"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir navegação"
              onClick={() => setMenu(true)}
            >
              <Menu size={17} />
            </Button>
          </div>
        )}
        <main id="conteudo" tabIndex={-1} className="site-main">
          <Outlet />
        </main>
        <section className="trust-strip" id="sobre">
          <div>
            <span className="trust-letter" aria-hidden="true">
              W
            </span>
            <h3>Segurança da carteira</h3>
            <p>
              Proteja sua carteira e colecione arte digital verificada com
              confiança.
            </p>
          </div>
          <div>
            <span className="trust-letter" aria-hidden="true">
              C
            </span>
            <h3>Criadores em destaque</h3>
            <p>
              Conheça artistas, estúdios e comunidades que moldam a cultura
              digital na rede.
            </p>
          </div>
          <div>
            <span className="trust-letter" aria-hidden="true">
              D
            </span>
            <h3>Alertas de lançamentos</h3>
            <p>
              Receba calendários de cunhagem, novidades e listas de acesso e
              análises do mercado.
            </p>
          </div>
          <div className="newsletter">
            <h3>Antecipe-se ao próximo lançamento</h3>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                notify("A newsletter não está disponível nesta demonstração.");
              }}
            >
              <input
                type="email"
                aria-label="E-mail para lançamentos"
                placeholder="digite seu e-mail..."
                required
              />
              <Button type="submit" size="sm">
                Enviar
              </Button>
            </form>
            <p>
              Receba lançamentos selecionados, histórias de criadores e
              novidades do mercado.
            </p>
          </div>
        </section>
        <footer className="site-footer">
          <div className="footer-contact">
            <Link to="/" className="brand">
              KURIO
            </Link>
            <span>
              Feito para colecionadores,
              <br />
              criadores e cultura
            </span>
            <span>contato@email.com</span>
            <span>+55 11 4002 8922</span>
          </div>
          <div className="footer-top">
            <div>
              <h3>Meu perfil</h3>
              <Link to="/perfil">Meu perfil</Link>
              <Link to="/pedidos">Minha coleção</Link>
              <button
                onClick={() =>
                  notify("Atividade está fora do escopo desta demonstração.")
                }
              >
                Atividade
              </button>
              <button
                onClick={() =>
                  notify(
                    "O estúdio do criador está fora do escopo desta demonstração.",
                  )
                }
              >
                Estúdio do criador
              </button>
              <Link to="/" search={{ favorites: true }}>
                Lista de interesse
              </Link>
            </div>
            <div>
              <h3>Central de ajuda</h3>
              {[
                "Central de ajuda",
                "Como comprar NFTs",
                "Carteira e segurança",
                "Política do mercado",
                "Denunciar item",
              ].map((label) => (
                <button
                  key={label}
                  onClick={() =>
                    notify(
                      `${label}: conteúdo fora do escopo desta demonstração.`,
                    )
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <div>
              <h3>Coleções</h3>
              {[
                "Arte digital",
                "Fotografia",
                "Música",
                "Arte 3D",
                "Utilidade",
              ].map((category) => (
                <Link
                  to="/"
                  search={{ category, page: 1 }}
                  hash="mercado"
                  key={category}
                >
                  {category}
                </Link>
              ))}
            </div>
            <div>
              <h3>Redes sociais</h3>
              <div className="social-links">
                {[
                  ["Facebook", "f"],
                  ["Instagram", "◎"],
                  ["Twitter", "♥"],
                  ["LinkedIn", "in"],
                  ["YouTube", "▶"],
                ].map(([name, symbol]) => (
                  <button
                    key={name}
                    aria-label={name}
                    onClick={() =>
                      notify(
                        `${name}: a Kurio é uma marca de demonstração e não possui perfil oficial.`,
                      )
                    }
                  >
                    {symbol}
                  </button>
                ))}
              </div>
              <h3>Carteiras compatíveis</h3>
              <span className="compatible-wallets">
                METAMASK · WALLETCONNECT · COINBASE
              </span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Kurio. Propriedade digital para todos.</span>
            <span className="connection">
              <i className={connected ? "online" : ""} />
              {connected
                ? "Atualizações ao vivo"
                : "Reconectando atualizações…"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setDemo(true)}>
              <FlaskConical size={13} />
              Cenários de demonstração
            </Button>
          </div>
        </footer>

        {!auth && (
          <nav className="bottom-navigation" aria-label="Navegação inferior">
            <Link
              to="/"
              search={{ favorites: false }}
              aria-label="Início"
              aria-current={pathname === "/" && !favorites ? "page" : undefined}
            >
              <HomeIcon size={21} />
              <span>Início</span>
            </Link>
            <Link
              to={user ? "/" : "/login"}
              search={
                user ? { favorites: true } : { returnTo: "/?favorites=true" }
              }
              aria-label="Favoritos"
              aria-current={favorites ? "page" : undefined}
            >
              <Heart size={21} fill="currentColor" />
              <span>Favoritos</span>
            </Link>
            <Link
              to="/carteiras"
              className="bottom-cart"
              aria-label="Minhas carteiras"
              aria-current={pathname === "/carteiras" ? "page" : undefined}
            >
              <ScanLine size={28} />
              <span>Carteiras</span>
            </Link>
            <Link
              to="/carrinho"
              aria-label={`Abrir carrinho, ${count} itens`}
              aria-current={pathname === "/carrinho" ? "page" : undefined}
            >
              <ShoppingCart size={21} />
              {count > 0 && <b>{count}</b>}
              <span>Carrinho</span>
            </Link>
            <Link
              to={user ? "/perfil" : "/login"}
              aria-label="Minha conta"
              aria-current={pathname === "/perfil" ? "page" : undefined}
            >
              <UserRound size={21} />
              <span>Conta</span>
            </Link>
          </nav>
        )}
        <div className="toast" role="status" aria-live="polite">
          {toast && (
            <div>
              {toast}
              <button
                onClick={() => setToast("")}
                aria-label="Dispensar mensagem"
              >
                ×
              </button>
            </div>
          )}
        </div>
        <Dialog
          open={menu}
          onOpenChange={setMenu}
          title="Explore o KURIO"
          description="Sua próxima coleção começa aqui."
        >
          <nav className="mobile-links">
            <Link to="/">Início</Link>
            <Link
              to="/"
              hash="mercado"
              className={
                pathname.startsWith("/nft/") ||
                ["/carrinho", "/pagamento"].includes(pathname)
                  ? "active"
                  : ""
              }
            >
              Mercado
            </Link>
            <Link to="/perfil">Meu perfil</Link>
            <Link to="/carteiras">Carteiras</Link>
            <Link to="/pedidos">Pedidos</Link>
            {user && (
              <Button
                variant="ghost"
                className="mobile-logout"
                onClick={async () => {
                  try {
                    await logout();
                    setMenu(false);
                    await navigate({ to: "/" });
                    notify("Você saiu da sua conta.");
                  } catch (error) {
                    notify(message(error));
                  }
                }}
              >
                <LogOut size={17} />
                Sair
              </Button>
            )}
          </nav>
        </Dialog>
        <Dialog
          open={demo}
          onOpenChange={setDemo}
          title="Laboratório de cenários"
          description="Controle a API simulada e os eventos reais do cliente Socket.IO."
        >
          <label className="field">
            Cenário
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
            >
              {[
                "standard",
                "empty",
                "slow",
                "out-of-order",
                "offline",
                "server-error",
                "invalid-catalog",
                "invalid-response",
                "expired",
                "favorite-error",
                "price-change",
                "sold-out",
                "order-timeout",
                "payment-declined",
                "pending-disconnect",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-3 my-5">
            <Button
              onClick={async () => {
                await http.post("/demo/scenario", { scenario });
                await queryClient.invalidateQueries();
                notify("Cenário atualizado.");
                setDemo(false);
              }}
            >
              Aplicar cenário
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await http.post("/demo/reset", { scenario });
                localStorage.removeItem("kurio:attempt");
                localStorage.removeItem("kurio:coupon");
                location.href = "/";
              }}
            >
              Reset completo
            </Button>
          </div>
          <p className="muted mb-3">Eventos sobre Emerald Ape #042:</p>
          <div className="flex gap-2 flex-wrap">
            {[
              ["price", "Alterar preço"],
              ["stock", "Esgotar edição"],
              ["duplicate", "Evento duplicado"],
              ["old", "Evento antigo"],
              ["disconnect", "Interromper conexão"],
              ["expire", "Expirar sessão"],
            ].map(([type, label]) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={async () => {
                  await http.post("/demo/event", { type });
                  notify(`Evento enviado: ${label}`);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <p className="muted mt-5 text-xs">
            Contas: ana@kurio.demo e leo@kurio.demo
            <br />
            Senha fictícia: Kurio123!
          </p>
        </Dialog>
      </div>
    </ToastContext.Provider>
  );
}
