import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  Wallet as WalletIcon,
  XCircle,
} from "lucide-react";
import { api, get, message, queryClient } from "../api";
import {
  totalLine,
  type Collector,
  type Nft,
  type Order,
  type Quote,
  type Wallet,
} from "../domain";
import {
  useCart,
  useSession,
  Skeleton,
  ErrorState,
  Empty,
  toast,
} from "../shell";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/dialog";
export function Summary({ quote }: { quote: Quote }) {
  return (
    <div className="summary-lines">
      <div>
        <span>Subtotal</span>
        <strong>{quote.subtotal} ETH</strong>
      </div>
      <div>
        <span>Desconto {quote.coupon && `(${quote.coupon})`}</span>
        <strong>− {quote.discount} ETH</strong>
      </div>
      <div>
        <span>Taxa de rede</span>
        <strong>{quote.fee} ETH</strong>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{quote.total} ETH</strong>
      </div>
    </div>
  );
}
export function useQuote() {
  const { data } = useSession();
  const cart = useCart();
  return useQuery({
    queryKey: ["quote", data?.user?.id || "guest", cart.data],
    queryFn: ({ signal }) => get<Quote>("/quote", signal),
    enabled: !!cart.data,
  });
}
export function CartPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const quote = useQuote();
  const [coupon, setCoupon] = useState("");
  const mutation = useMutation({
    mutationFn: (body: unknown) => api.post("/cart", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["quote"] });
      toast("Carrinho atualizado.");
    },
    onError: (e) => toast(message(e)),
  });
  const catalog = useQuery({
    queryKey: ["nfts", "cart", cart.data],
    queryFn: () =>
      Promise.all(
        (cart.data?.items || []).map((i) => get<Nft>(`/nfts/${i.id}`)),
      ),
    enabled: !!cart.data,
  });
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/">Início</Link>
        <span>/</span>
        <span>Carrinho</span>
      </div>
      <h1>
        Meu carrinho<span>.</span>
      </h1>
      {cart.isPending || catalog.isPending ? (
        <Skeleton />
      ) : cart.isError || catalog.isError ? (
        <ErrorState
          error={cart.error || catalog.error}
          retry={() => {
            cart.refetch();
            catalog.refetch();
          }}
        />
      ) : !cart.data?.items.length ? (
        <Empty title="Seu carrinho está esperando por arte">
          <p>Descubra uma obra para chamar de sua.</p>
          <Button asChild>
            <Link to="/">Explorar NFTs</Link>
          </Button>
        </Empty>
      ) : (
        <div className="purchase-grid">
          <div className="cart-items">
            <div className="cart-table-heading">
              <span>Produto</span>
              <span>Preço</span>
              <span>Quantidade</span>
              <span>Total</span>
            </div>
            {cart.data.items.map((item, index) => {
              const nft = catalog.data?.[index];
              if (!nft) return null;
              const available = Math.min(
                nft.stock,
                nft.editionStock?.[item.edition] ?? nft.stock,
              );
              return (
                <article className="cart-row" key={item.id + item.edition}>
                  <Link
                    to="/nft/$id"
                    params={{ id: item.id }}
                    className="cart-product"
                  >
                    <img
                      src={nft.image}
                      alt={nft.name}
                      width="72"
                      height="72"
                    />
                    <div>
                      <h3>{nft.name}</h3>
                      <small>{item.edition}</small>
                      {item.quantity > available && (
                        <p role="alert" className="field-error">
                          Disponibilidade mudou: {available} restantes.
                        </p>
                      )}
                    </div>
                  </Link>
                  <strong className="cart-unit">{nft.price} ETH</strong>
                  <div className="quantity">
                    <button
                      aria-label={`Diminuir ${nft.name}`}
                      disabled={mutation.isPending || item.quantity <= 1}
                      onClick={() =>
                        mutation.mutate({
                          ...item,
                          quantity: item.quantity - 1,
                        })
                      }
                    >
                      <Minus size={13} />
                    </button>
                    <output>{item.quantity}</output>
                    <button
                      aria-label={`Aumentar ${nft.name}`}
                      disabled={
                        mutation.isPending || item.quantity >= available
                      }
                      onClick={() =>
                        mutation.mutate({
                          ...item,
                          quantity: item.quantity + 1,
                        })
                      }
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <strong>{totalLine(nft.price, item.quantity)} ETH</strong>
                  <button
                    className="remove"
                    aria-label={`Remover ${nft.name}`}
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ ...item, quantity: 0 })}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              );
            })}
            <Link to="/" className="text-link">
              ← Continuar explorando
            </Link>
          </div>
          <aside className="panel order-summary">
            <h2>Resumo do pedido</h2>
            <form
              className="coupon-form"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate({ coupon });
              }}
            >
              <label htmlFor="coupon">Código promocional</label>
              <div className="row">
                <input
                  id="coupon"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Digite seu cupom"
                />
                <Button size="sm" disabled={mutation.isPending}>
                  Aplicar
                </Button>
              </div>
              <small>Experimente JUNGLE10</small>
            </form>
            {cart.data.coupon && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => mutation.mutate({ coupon: "" })}
              >
                Remover cupom
              </Button>
            )}
            {quote.isPending ? (
              <Skeleton />
            ) : quote.isError ? (
              <ErrorState error={quote.error} retry={() => quote.refetch()} />
            ) : (
              <Summary quote={quote.data} />
            )}
            <Button
              className="full"
              disabled={!quote.data || quote.isError}
              onClick={() => navigate({ to: "/checkout" })}
            >
              Continuar para pagamento
            </Button>
            <p className="secure-note">
              <ShieldCheck size={16} />
              Compra segura • transação simulada
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
export function Checkout() {
  const { data } = useSession();
  const cart = useCart();
  const quote = useQuote();
  const wallets = useQuery({
    queryKey: ["wallets", data?.user?.id],
    queryFn: ({ signal }) => get<Wallet[]>("/wallets", signal),
  });
  const [walletId, setWalletId] = useState("");
  const [network, setNetwork] = useState("Ethereum");
  const [connection, setConnection] = useState("disconnected");
  const [review, setReview] = useState<Quote | null>(null);
  const draftKey = `jungle.checkout.${data?.user?.id}`;
  const [collector, setCollector] = useState<Collector | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(draftKey) || "null");
    } catch {
      return null;
    }
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const attemptKey = `jungle.attempt.${data?.user?.id}`;
  const [attempt, setAttempt] = useState<{
    key: string;
    body: {
      fingerprint: string;
      walletId: string;
      network: string;
      collector: Collector;
    };
  } | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(attemptKey) || "null");
    } catch {
      return null;
    }
  });
  const mutation = useMutation({
    mutationFn: async (a: NonNullable<typeof attempt>) =>
      (
        await api.post<Order>("/orders", a.body, {
          headers: { "Idempotency-Key": a.key },
        })
      ).data,
    onSuccess: async (order) => {
      sessionStorage.removeItem(attemptKey);
      sessionStorage.removeItem(draftKey);
      await navigate({ to: "/orders/$id", params: { id: order.id } });
    },
    onError: async (e) => {
      setError(message(e));
      setReview(null);
      const status = (e as { response?: { status: number } }).response?.status;
      if (status && status >= 400 && status < 500 && status !== 401) {
        sessionStorage.removeItem(attemptKey);
        setAttempt(null);
        await queryClient.invalidateQueries({ queryKey: ["quote"] });
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
    },
  });
  useEffect(() => {
    if (review && quote.data && review.fingerprint !== quote.data.fingerprint) {
      setReview(null);
      setError("Os valores mudaram. Revise a nova cotação antes de confirmar.");
    }
  }, [quote.data, review]);
  async function prepare() {
    setError("");
    if (connection !== "connected") {
      setError("Conecte uma carteira antes de continuar.");
      return;
    }
    const result = await quote.refetch();
    if (result.data && !result.isError) setReview(structuredClone(result.data));
  }
  function confirm() {
    if (
      !review ||
      !collector ||
      mutation.isPending ||
      review.fingerprint !== quote.data?.fingerprint
    )
      return;
    const a = attempt || {
      key: crypto.randomUUID(),
      body: { fingerprint: review.fingerprint, walletId, network, collector },
    };
    sessionStorage.setItem(attemptKey, JSON.stringify(a));
    setAttempt(a);
    mutation.mutate(a);
  }
  if (cart.isPending || wallets.isPending)
    return (
      <div className="container page">
        <Skeleton />
      </div>
    );
  if (!cart.data?.items.length && !attempt)
    return (
      <div className="container page">
        <Empty title="Seu carrinho está vazio">
          <Button asChild>
            <Link to="/">Explorar NFTs</Link>
          </Button>
        </Empty>
      </div>
    );
  return (
    <div className="container page">
      <div className="breadcrumb">
        <Link to="/cart">Carrinho</Link>
        <span>/</span>
        <span>Pagamento</span>
      </div>
      <h1>
        Finalize sua coleção<span>.</span>
      </h1>
      <form
        className="purchase-grid"
        onChange={(e) => {
          const fields = Object.fromEntries(new FormData(e.currentTarget));
          sessionStorage.setItem(draftKey, JSON.stringify(fields));
        }}
        onSubmit={(e) => {
          e.preventDefault();
          setCollector(
            Object.fromEntries(new FormData(e.currentTarget)) as Collector,
          );
          prepare();
        }}
      >
        <div className="form-stack">
          <section className="panel form-stack">
            <h2>Dados do colecionador</h2>
            <div className="account-columns">
              <label>
                Nome completo
                <input
                  name="name"
                  defaultValue={collector?.name || data?.user?.name}
                  required
                  minLength={2}
                />
              </label>
              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  defaultValue={collector?.email || data?.user?.email}
                  required
                />
              </label>
              <label>
                País
                <select
                  name="country"
                  defaultValue={collector?.country || "Brasil"}
                  aria-label="País"
                >
                  <option>Brasil</option>
                  <option>Portugal</option>
                  <option>Outro</option>
                </select>
              </label>
              <label>
                Telefone
                <input
                  name="phone"
                  defaultValue={collector?.phone || ""}
                  type="tel"
                  required
                  pattern={"[+0-9\\s\\-\\(\\)]{8,20}"}
                  placeholder="(11) 99999-9999"
                />
              </label>
            </div>
          </section>
          <section className="panel form-stack">
            <h2>Carteira e rede</h2>
            {wallets.isError ? (
              <ErrorState
                error={wallets.error}
                retry={() => wallets.refetch()}
              />
            ) : wallets.data?.length ? (
              <>
                <label>
                  Selecione sua carteira
                  <select
                    aria-label="Selecione sua carteira"
                    value={walletId}
                    required
                    onChange={(e) => {
                      setWalletId(e.target.value);
                      setConnection("disconnected");
                    }}
                  >
                    <option value="">Selecione</option>
                    {wallets.data.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} • {w.network}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Rede
                  <select
                    aria-label="Rede"
                    value={network}
                    onChange={(e) => {
                      setNetwork(e.target.value);
                      setConnection("disconnected");
                    }}
                  >
                    <option>Ethereum</option>
                    <option>Polygon</option>
                  </select>
                </label>
                <div className="row wrap">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      !walletId ||
                      wallets.data.find((w) => w.id === walletId)?.network !==
                        network
                    }
                    onClick={() =>
                      setConnection(
                        connection === "connected"
                          ? "disconnected"
                          : "connected",
                      )
                    }
                  >
                    <WalletIcon size={16} />
                    {connection === "connected"
                      ? "Desconectar carteira"
                      : "Simular conexão"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setConnection("refused");
                      setError(
                        "Conexão recusada pela carteira. Tente novamente.",
                      );
                    }}
                  >
                    Simular recusa
                  </Button>
                </div>
                <p role="status">
                  {connection === "connected"
                    ? "Carteira conectada à rede " + network
                    : connection === "refused"
                      ? "Conexão recusada"
                      : "Carteira desconectada"}
                </p>
              </>
            ) : (
              <Empty title="Cadastre uma carteira">
                <Button asChild>
                  <Link to="/wallets">Adicionar carteira</Link>
                </Button>
              </Empty>
            )}
          </section>
          <label className="checkbox">
            <input type="checkbox" required />
            Revisei os dados e entendo que esta compra é uma simulação.
          </label>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          {attempt && (
            <div className="panel">
              <p>
                Existe uma tentativa de compra em andamento. Recupere o
                resultado antes de iniciar outra.
              </p>
              <Button
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(attempt)}
              >
                Recuperar compra
              </Button>
            </div>
          )}
        </div>
        <aside className="panel order-summary">
          <h2>Seu pedido</h2>
          {quote.isPending ? (
            <Skeleton />
          ) : quote.isError ? (
            <ErrorState error={quote.error} retry={() => quote.refetch()} />
          ) : (
            <>
              {quote.data.items.map((i) => (
                <div className="checkout-item" key={i.id + i.edition}>
                  <img src={i.image} alt="" width="52" height="52" />
                  <div>
                    <strong>{i.name}</strong>
                    <small>
                      {i.edition} × {i.quantity}
                    </small>
                  </div>
                  <span>{totalLine(i.price, i.quantity)} ETH</span>
                </div>
              ))}
              <Summary quote={quote.data} />
            </>
          )}
          <Button
            className="full"
            disabled={
              mutation.isPending || quote.isError || !quote.data || !!attempt
            }
          >
            Revisar compra
          </Button>
          <p className="secure-note">
            <ShieldCheck size={16} />
            Sem movimentação de criptomoedas reais.
          </p>
        </aside>
      </form>
      <Modal
        open={!!review}
        onOpenChange={() => setReview(null)}
        title="Revise e confirme sua compra"
      >
        {review && (
          <>
            <p>
              Confira os valores finais. A disponibilidade será revalidada ao
              enviar.
            </p>
            <p>
              {collector?.name} • {collector?.email}
              <br />
              {collector?.country} • {collector?.phone}
            </p>
            <Summary quote={review} />
            <Button
              className="full"
              onClick={confirm}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Enviando…" : "Confirmar compra"}
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}
export function Receipt() {
  const { id } = useParams({ from: "/orders/$id" });
  const { data } = useSession();
  const query = useQuery({
    queryKey: ["order", data?.user?.id, id],
    queryFn: ({ signal }) => get<Order>(`/orders/${id}`, signal),
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 1500 : false),
  });
  if (query.isPending)
    return (
      <div className="container page">
        <Skeleton />
      </div>
    );
  if (query.isError)
    return (
      <div className="container">
        <ErrorState error={query.error} retry={() => query.refetch()} />
      </div>
    );
  const order = query.data;
  return (
    <div className="container page">
      <article className="receipt panel">
        {order.status === "confirmed" ? (
          <CheckCircle className="receipt-icon" size={44} />
        ) : order.status === "refused" ? (
          <XCircle className="receipt-icon" size={44} />
        ) : (
          <Clock className="receipt-icon" size={44} />
        )}
        <span className="eyebrow">
          {order.status === "confirmed"
            ? "WELCOME TO YOUR NEXT CHAPTER"
            : "SIMULAÇÃO DE PAGAMENTO"}
        </span>
        <h1>
          {order.status === "confirmed"
            ? "Sua coleção ganhou uma nova história."
            : order.status === "refused"
              ? "Pagamento recusado."
              : "Seu pedido está sendo processado."}
        </h1>
        <p role="status">
          {order.status === "confirmed"
            ? "Compra confirmada pela simulação."
            : order.status === "refused"
              ? "Seus itens continuam no carrinho. Você pode tentar novamente."
              : "Aguardando confirmação. Você pode atualizar a página com segurança."}
        </p>
        <div className="receipt-reference">
          <span>Pedido</span>
          <code>{order.id}</code>
          {order.status === "confirmed" && (
            <>
              <span>Transação simulada</span>
              <code>{order.transaction}</code>
            </>
          )}
        </div>
        {order.quote.items.map((i) => (
          <div className="checkout-item" key={i.id + i.edition}>
            <img src={i.image} alt="" width="56" height="56" />
            <div>
              <strong>{i.name}</strong>
              <small>
                {i.edition} × {i.quantity}
              </small>
            </div>
            <span>{totalLine(i.price, i.quantity)} ETH</span>
          </div>
        ))}
        <Summary quote={order.quote} />
        <p className="muted">
          {order.wallet.name} • {order.wallet.network}
        </p>
        <Button asChild className="full">
          <Link to={order.status === "refused" ? "/cart" : "/"}>
            {order.status === "refused"
              ? "Voltar ao carrinho"
              : "Continuar explorando"}
          </Link>
        </Button>
      </article>
    </div>
  );
}
