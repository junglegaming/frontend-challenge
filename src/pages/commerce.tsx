import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { collectorErrors } from "../lib/collector";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  api,
  http,
  invalidateCommerce,
  message,
  queryClient,
  useCart,
  useSession,
} from "../api";
import { eth, fromWei, toWei } from "../domain";
import type { CartLine, Order, Quote } from "../types";
import { useToast } from "../shell";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import {
  Empty,
  ErrorState,
  Field,
  PageTitle,
  Skeleton,
} from "../components/shared";
import { Related } from "./catalog";
import { MobilePurchasePanel } from "../components/mobile-purchase-panel";
function useCoupon() {
  const [coupon, setCouponState] = useState(
    () => localStorage.getItem("kurio:coupon") ?? "",
  );
  const setCoupon = (value: string) => {
    setCouponState(value);
    localStorage.setItem("kurio:coupon", value);
  };
  return [coupon, setCoupon] as const;
}
function useQuote(coupon: string) {
  const { data: user } = useSession();
  const cart = useCart(user);
  return useQuery({
    queryKey: ["quote", user?.id ?? "guest", cart.data, coupon],
    queryFn: ({ signal }) => api.quote(coupon, signal),
    enabled: !!cart.data?.length,
    staleTime: 0,
  });
}
export function Summary({
  quote,
  children,
  beforeTotals,
  showItems = true,
  title = "Seus NFTs",
}: {
  quote: Quote;
  children?: React.ReactNode;
  beforeTotals?: React.ReactNode;
  showItems?: boolean;
  title?: string;
}) {
  return (
    <aside className="summary">
      <h2>{title}</h2>
      {showItems && (
        <div className="summary-items">
          <div className="summary-columns">
            <span>NFTs</span>
            <span>Subtotal</span>
          </div>
          {quote.items.map((l) => (
            <div key={`${l.nftId}:${l.edition}`}>
              <img src={l.nft.image} alt="" width="44" height="44" />
              <span>
                {l.nft.name}
                <small>
                  ID do token: #
                  {l.nft.name.match(/#(\d+)/)?.[1].padStart(4, "0")} · ×{" "}
                  {l.quantity}
                </small>
              </span>
              <strong>{eth(l.lineTotal)}</strong>
            </div>
          ))}
        </div>
      )}
      {beforeTotals}
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{eth(quote.subtotal)}</dd>
        </div>
        <div>
          <dt>Desconto {quote.coupon && `(${quote.coupon})`}</dt>
          <dd>− {eth(quote.discount)}</dd>
        </div>
        <div>
          <dt>Taxa de rede</dt>
          <dd>{eth(quote.fee)}</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd>{eth(quote.total)}</dd>
        </div>
      </dl>
      {children}
      <p className="simulation-note">
        <ShieldCheck size={13} /> Ambiente de simulação. Sem cobrança.
      </p>
    </aside>
  );
}
function CartItem({ line }: { line: CartLine }) {
  const toast = useToast();
  const nft = useQuery({
    queryKey: ["nft", line.nftId],
    queryFn: ({ signal }) => api.nft(line.nftId, signal),
  });
  const change = useMutation({
    mutationFn: async (quantity: number) => {
      if (quantity === 0) await http.delete("/cart", { data: line });
      else await http.patch("/cart", { ...line, quantity });
    },
    onSuccess: () => void invalidateCommerce(),
    onError: (e) => toast(message(e)),
  });
  if (!nft.data) return <div className="skeleton h-24" />;
  const n = nft.data;
  const stock = Math.min(
    n.stock,
    n.editions.find((e) => e.id === line.edition)?.stock ?? 0,
  );
  return (
    <article className="cart-item">
      <Link to="/nft/$id" params={{ id: n.id }}>
        <img src={n.image} alt={n.name} width="84" height="84" />
      </Link>
      <div className="cart-item-name">
        <Link to="/nft/$id" params={{ id: n.id }}>
          {n.name}
        </Link>
        <small>
          {n.editions.find((e) => e.id === line.edition)?.label} · {n.network}
        </small>
        {stock < line.quantity && (
          <small className="field-error">
            Disponibilidade alterada: {stock} unidade(s).
          </small>
        )}
      </div>
      <span className="price">{eth(n.price)}</span>
      <div className="quantity-control">
        <span className="sr-only">Quantidade de {n.name}</span>
        <button
          type="button"
          aria-label={`Diminuir quantidade de ${n.name}`}
          disabled={change.isPending || line.quantity <= 1}
          onClick={() => change.mutate(line.quantity - 1)}
        >
          −
        </button>
        <select
          disabled={change.isPending}
          aria-label={`Quantidade de ${n.name}`}
          value={line.quantity}
          onChange={(e) => change.mutate(Number(e.target.value))}
        >
          {Array.from({ length: Math.max(stock, line.quantity) }, (_, i) => (
            <option value={i + 1} key={i}>
              {i + 1}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label={`Aumentar quantidade de ${n.name}`}
          disabled={change.isPending || line.quantity >= stock}
          onClick={() => change.mutate(line.quantity + 1)}
        >
          +
        </button>
      </div>
      <strong className="cart-line-total">
        {eth(fromWei(toWei(n.price) * BigInt(line.quantity)))}
      </strong>
      <Button
        aria-label={`Remover ${n.name}`}
        size="icon"
        variant="ghost"
        disabled={change.isPending}
        onClick={() => change.mutate(0)}
      >
        <Trash2 size={16} />
      </Button>
    </article>
  );
}
export function CartPage() {
  const { data: user } = useSession();
  const cart = useCart(user);
  const [coupon, setCoupon] = useCoupon();
  const [code, setCode] = useState(coupon);
  const [couponError, setCouponError] = useState("");
  const quote = useQuote(coupon);
  const apply = useMutation({
    mutationFn: async () => api.quote(code.trim().toUpperCase()),
    onSuccess: () => {
      setCoupon(code.trim().toUpperCase());
      setCouponError("");
    },
    onError: (e) => setCouponError(message(e)),
  });
  return (
    <>
      <PageTitle
        eyebrow="SUA PRÓXIMA COLEÇÃO"
        title="Carrinho de NFTs"
        description="Peças únicas. Uma coleção que é só sua."
      />
      {cart.isPending ? (
        <Skeleton cards={2} />
      ) : cart.isError ? (
        <ErrorState error={cart.error} retry={() => void cart.refetch()} />
      ) : !cart.data.length ? (
        <Empty
          title="Seu carrinho está esperando por arte"
          description="Explore o mercado e encontre algo que combine com você."
        />
      ) : (
        <div className="commerce-layout">
          <section>
            <div className="cart-table-heading">
              <span>NFT / Edição</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            <div className="cart-items">
              {cart.data.map((l) => (
                <CartItem key={`${l.nftId}:${l.edition}`} line={l} />
              ))}
            </div>

            <Link to="/" hash="mercado" className="back-link">
              <ArrowLeft size={14} />
              Continuar explorando
            </Link>
          </section>
          {quote.isPending ? (
            <Skeleton cards={1} />
          ) : quote.isError ? (
            <ErrorState
              error={quote.error}
              retry={() => void quote.refetch()}
            />
          ) : (
            quote.data && (
              <MobilePurchasePanel className="cart-purchase-panel">
                <Summary
                  quote={quote.data}
                  showItems={false}
                  title="Resumo da carteira"
                  beforeTotals={
                    <form
                      className="coupon-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        apply.mutate();
                      }}
                    >
                      <Field label="Código promocional">
                        <input
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="Digite o código promocional..."
                          aria-describedby={
                            couponError ? "coupon-error" : undefined
                          }
                          aria-invalid={!!couponError}
                        />
                      </Field>
                      <Button variant="outline" disabled={apply.isPending}>
                        Aplicar
                      </Button>
                      {coupon && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setCoupon("");
                            setCode("");
                            setCouponError("");
                          }}
                        >
                          Remover cupom
                        </Button>
                      )}
                      {couponError && (
                        <p
                          className="field-error full-width"
                          id="coupon-error"
                          role="alert"
                        >
                          {couponError}
                        </p>
                      )}
                    </form>
                  }
                >
                  <Button asChild className="w-full">
                    <Link to="/pagamento">
                      Conectar e finalizar <ArrowRight size={15} />
                    </Link>
                  </Button>
                </Summary>
              </MobilePurchasePanel>
            )
          )}
        </div>
      )}
      <Related />
    </>
  );
}
type Attempt = {
  userId: string;
  key: string;
  body: {
    quoteId: string;
    walletId: string;
    network: string;
    name: string;
    email: string;
  };
};
function readAttempt(userId: string): Attempt | null {
  try {
    const value = JSON.parse(localStorage.getItem("kurio:attempt") ?? "null");
    return value?.userId === userId ? value : null;
  } catch {
    return null;
  }
}
export function Checkout() {
  const { data: user } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [coupon] = useCoupon();
  const quote = useQuote(coupon);
  const cart = useCart(user);
  const wallets = useQuery({
    queryKey: ["private", user?.id, "wallets"],
    queryFn: ({ signal }) => api.wallets(signal),
    enabled: !!user,
  });
  const [walletId, setWalletId] = useState("");
  const [network, setNetwork] = useState("Ethereum");
  const [connection, setConnection] = useState<
    "idle" | "connected" | "declined"
  >("idle");
  const [provider, setProvider] = useState("WalletConnect");
  const [selection, setSelection] = useState<string | null>(null);
  const [collectorOpen, setCollectorOpen] = useState(
    () => matchMedia("(min-width: 601px)").matches,
  );
  const connect = useMutation({
    mutationFn: async ({
      provider: selected,
      decision,
    }: {
      provider: string;
      decision: "connect" | "decline" | "disconnect";
    }) =>
      (
        await http.post<{
          status: "connected" | "declined" | "idle";
          provider: string;
        }>("/wallets/connection", {
          walletId,
          network,
          provider: selected,
          decision,
        })
      ).data,
    onSuccess: (result) => {
      setProvider(result.provider);
      setSelection(result.status === "connected" ? result.provider : null);
      setConnection(result.status);
      setError("");
      toast(
        result.status === "connected"
          ? `${result.provider} conectado na simulação.`
          : result.status === "declined"
            ? "Você recusou a conexão simulada."
            : "Carteira desconectada.",
      );
    },
    onError: (error) => {
      setSelection(null);
      setConnection("idle");
      setError(message(error));
    },
  });
  const [review, setReview] = useState<Quote | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const initializedUser = useRef<string | undefined>(undefined);
  const [collector, setCollector] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState<Attempt | null>(() =>
    user ? readAttempt(user.id) : null,
  );
  useEffect(() => {
    setSelection(null);
    setConnection("idle");
  }, [walletId, network]);
  useEffect(() => {
    if (user && initializedUser.current !== user.id) {
      initializedUser.current = user.id;
      setForm({ name: user.name, email: user.email });
      setAttempt(readAttempt(user.id));
    }
  }, [user]);
  useEffect(() => {
    if (wallets.data?.length && !walletId) {
      const primary = wallets.data.find((w) => w.primary) ?? wallets.data[0];
      setWalletId(primary.id);
      setNetwork(primary.network);
    }
  }, [wallets.data, walletId]);
  const place = useMutation({
    mutationFn: async () => {
      if (!review || !user) throw new Error("Revise seu pedido.");
      await api.session();
      const fresh = await api.quote(coupon);
      if (fresh.fingerprint !== review.fingerprint) {
        queryClient.setQueryData(["quote", user.id, cart.data, coupon], fresh);
        setReview(null);
        throw new Error(
          "A cotação mudou. Confira o novo total e revise novamente.",
        );
      }
      const pending = attempt ?? {
        userId: user.id,
        key: crypto.randomUUID(),
        body: {
          quoteId: review.id,
          walletId,
          network,
          provider,
          ...collector,
          ...form,
        },
      };
      setAttempt(pending);
      localStorage.setItem("kurio:attempt", JSON.stringify(pending));
      return (
        await http.post<Order>("/orders", pending.body, {
          headers: { "Idempotency-Key": pending.key },
        })
      ).data;
    },
    onSuccess: (order) => {
      localStorage.removeItem("kurio:attempt");
      setAttempt(null);
      setReview(null);
      void navigate({ to: "/pedido/$id", params: { id: order.id } });
    },
    onError: (e) => {
      if (axios.isAxiosError(e) && e.response?.data?.fields) {
        setFieldErrors(e.response.data.fields);
        setCollectorOpen(true);
      }
      if (
        axios.isAxiosError(e) &&
        e.response &&
        [409, 422].includes(e.response.status)
      ) {
        localStorage.removeItem("kurio:attempt");
        setAttempt(null);
        setReview(null);
        void invalidateCommerce();
      }
      setError(message(e));
    },
  });
  const recover = useMutation({
    mutationFn: async () => {
      if (!attempt) throw new Error("Nenhuma tentativa pendente.");
      return (
        await http.post<Order>("/orders", attempt.body, {
          headers: { "Idempotency-Key": attempt.key },
          timeout: 7000,
        })
      ).data;
    },
    onSuccess: (order) => {
      localStorage.removeItem("kurio:attempt");
      setAttempt(null);
      void navigate({ to: "/pedido/$id", params: { id: order.id } });
    },
    onError: (e) => setError(message(e)),
  });
  const stale = !!review && quote.data?.fingerprint !== review.fingerprint;
  if (cart.isPending || !user) return <Skeleton cards={2} />;
  if (!cart.data?.length && !attempt)
    return (
      <Empty
        title="Seu carrinho está vazio"
        description="Adicione uma peça antes de continuar para o pagamento."
      />
    );
  return (
    <>
      <PageTitle
        eyebrow="ÚLTIMO PASSO PARA SUA COLEÇÃO"
        title="Pagamento"
        description="Confira seus dados e finalize sua compra demonstrativa."
      />
      {attempt && (
        <div className="recovery-banner" role="status">
          <Clock3 size={22} />
          <div>
            <h2>Existe uma tentativa de compra em andamento</h2>
            <p>Recupere o resultado antes de iniciar outra compra.</p>
          </div>
          <Button onClick={() => recover.mutate()} disabled={recover.isPending}>
            Recuperar pedido
          </Button>
        </div>
      )}
      <div className="checkout-layout commerce-layout">
        <form
          id="checkout-form"
          noValidate
          className="checkout-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const values = Object.fromEntries(
              new FormData(event.currentTarget),
            ) as Record<string, string>;
            const invalid = collectorErrors({ ...values, ...form });
            setFieldErrors(invalid);
            if (Object.keys(invalid).length) {
              setCollectorOpen(true);
              setError(
                "Corrija os campos indicados no perfil do colecionador antes de continuar.",
              );
              const first = event.currentTarget.elements.namedItem(
                Object.keys(invalid)[0],
              );
              requestAnimationFrame(() => {
                if (first instanceof HTMLElement) {
                  first.scrollIntoView({ block: "center", behavior: "smooth" });
                  first.focus();
                }
              });
              return;
            }
            const consent =
              document.querySelector<HTMLInputElement>("#checkout-consent");
            if (!consent?.checked) {
              setError(
                "Marque a confirmação de que esta é uma compra simulada para continuar.",
              );
              consent?.focus();
              return;
            }
            setCollector(values);
            setError("");
            try {
              const fresh = await api.quote(coupon);
              setReview(fresh);
            } catch (error) {
              setError(message(error));
            }
          }}
        >
          <details
            className="collector-section"
            open={collectorOpen}
            onToggle={(event) => setCollectorOpen(event.currentTarget.open)}
          >
            <summary>
              Perfil do colecionador <span>Conferir dados</span>
            </summary>
            <div className="form-grid collector-fields">
              <Field label="Nome completo *" error={fieldErrors.name}>
                <input
                  name="name"
                  required
                  minLength={2}
                  value={form.name}
                  autoComplete="name"
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </Field>
              <Field label="Nome de usuário *" error={fieldErrors.username}>
                <input
                  name="username"
                  defaultValue={user.username}
                  required
                  pattern="[a-zA-Z0-9._-]{2,30}"
                />
              </Field>
              <Field label="Rede *">
                <select
                  aria-label="Rede"
                  required
                  value={network}
                  onChange={(event) => {
                    setNetwork(event.target.value);
                    setConnection("idle");
                  }}
                >
                  {["Ethereum", "Polygon", "Solana"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nome do perfil *" error={fieldErrors.profileName}>
                <input
                  name="profileName"
                  defaultValue={user.name}
                  required
                  minLength={2}
                />
              </Field>
              <Field label="Endereço da carteira *">
                <input
                  value={
                    wallets.data?.find((wallet) => wallet.id === walletId)
                      ?.address ?? ""
                  }
                  readOnly
                  required
                />
              </Field>
              <Field label="ENS ou carteira secundária (opcional)">
                <input
                  name="secondaryWallet"
                  placeholder="ENS ou carteira secundária"
                />
              </Field>
              <Field label="Tipo de carteira *">
                <select
                  required
                  value={provider}
                  onChange={(event) => {
                    setProvider(event.target.value);
                    setConnection("idle");
                  }}
                >
                  {["WalletConnect", "MetaMask", "Coinbase Wallet"].map(
                    (item) => (
                      <option key={item}>{item}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field
                label="Código de indicação (opcional)"
                error={fieldErrors.referral}
              >
                <input name="referral" maxLength={50} />
              </Field>
              <Field label="E-mail *" error={fieldErrors.email}>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  autoComplete="email"
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </Field>
              <Field label="Nome ENS (opcional)">
                <input
                  name="ens"
                  defaultValue={user.ens}
                  placeholder="seunome.eth"
                />
              </Field>
              <Field
                label="Observação do colecionador (opcional)"
                error={fieldErrors.note}
              >
                <textarea name="note" maxLength={500} rows={6} />
              </Field>
            </div>
          </details>
          <section className="checkout-wallets">
            <div className="wallet-section-heading">
              <h2>Carteira conectada</h2>
              <Link to="/carteiras" className="text-link">
                Trocar carteira
              </Link>
            </div>
            {wallets.isPending ? (
              <Skeleton cards={1} />
            ) : wallets.isError ? (
              <ErrorState
                error={wallets.error}
                retry={() => void wallets.refetch()}
              />
            ) : !wallets.data.length ? (
              <p>
                Você ainda não tem uma carteira.{" "}
                <Link to="/carteiras" className="text-link">
                  Cadastrar carteira
                </Link>
              </p>
            ) : (
              <>
                <div
                  className="wallet-choices"
                  role="radiogroup"
                  aria-label="Selecionar carteira cadastrada"
                >
                  {wallets.data.map((wallet) => (
                    <label
                      key={wallet.id}
                      className={`wallet-choice ${walletId === wallet.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="saved-wallet"
                        value={wallet.id}
                        checked={walletId === wallet.id}
                        onChange={() => {
                          setWalletId(wallet.id);
                          setNetwork(wallet.network);
                          setConnection("idle");
                        }}
                      />
                      <span>
                        <strong>
                          {wallet.primary ? "Principal" : wallet.label}
                        </strong>
                        <small>
                          {wallet.address.slice(0, 8)}…
                          {wallet.address.slice(-4)}
                        </small>
                        <small>Rede {wallet.network}</small>
                      </span>
                      <Wallet size={17} />
                    </label>
                  ))}
                </div>
                <Field label="Carteira">
                  <select
                    value={walletId}
                    onChange={(event) => {
                      const wallet = wallets.data.find(
                        (item) => item.id === event.target.value,
                      )!;
                      setWalletId(wallet.id);
                      setNetwork(wallet.network);
                      setConnection("idle");
                    }}
                  >
                    {wallets.data.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </section>
        </form>
        <div className="checkout-payment">
          {quote.isPending ? (
            <Skeleton cards={1} />
          ) : quote.isError ? (
            <ErrorState
              error={quote.error}
              retry={() => void quote.refetch()}
            />
          ) : (
            quote.data && <Summary quote={quote.data} />
          )}
          <fieldset className="payment-providers">
            <legend>
              <h2>Carteira e rede</h2>
            </legend>
            {["WalletConnect", "MetaMask", "Coinbase Wallet"].map(
              (item, index) => (
                <label
                  className={`provider-option ${connection === "connected" && provider === item ? "selected" : ""}`}
                  key={item}
                >
                  <input
                    type="radio"
                    name="payment-provider"
                    value={item}
                    checked={selection === item}
                    disabled={
                      connect.isPending || !walletId || wallets.isPending
                    }
                    onChange={() => {
                      setSelection(item);
                      connect.mutate({ provider: item, decision: "connect" });
                    }}
                  />
                  <span className="provider-symbol" aria-hidden="true">
                    {index === 2 ? <Wallet size={21} /> : item[0]}
                  </span>
                  <span>{item}</span>
                </label>
              ),
            )}
          </fieldset>
          <div className="connection-actions">
            <Button
              type="button"
              variant="ghost"
              disabled={connect.isPending || !walletId || wallets.isPending}
              onClick={() =>
                connect.mutate({
                  provider,
                  decision:
                    connection === "connected" ? "disconnect" : "connect",
                })
              }
            >
              {connection === "connected" ? "Desconectar" : "Conectar carteira"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={connect.isPending || !walletId || wallets.isPending}
              onClick={() => connect.mutate({ provider, decision: "decline" })}
            >
              Simular recusa
            </Button>
          </div>
          <p className="connection-feedback" aria-live="polite">
            {connection === "connected"
              ? `${provider} · Carteira conectada`
              : connection === "declined"
                ? "Conexão recusada. Escolha uma carteira para tentar novamente."
                : "Selecione um método para conectar sua carteira simulada."}
          </p>
          {quote.data && (
            <p className="mobile-payment-total">
              Total: <strong>{eth(quote.data.total)}</strong>
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="checkout-consent">
            <label className="check-label">
              <input
                id="checkout-consent"
                type="checkbox"
                required
                form="checkout-form"
              />
              Entendo que esta é uma compra simulada, sem valor financeiro.
            </label>
          </div>
          <Button
            className="checkout-review w-full"
            form="checkout-form"
            type="submit"
            disabled={
              connect.isPending ||
              connection !== "connected" ||
              !quote.data ||
              !!attempt ||
              quote.isFetching
            }
          >
            Confirmar compra <ArrowRight size={15} />
          </Button>
          <p className="simulation-note">
            Revise antes de confirmar · sem cobrança real
          </p>
        </div>
      </div>

      <Dialog
        open={!!review}
        onOpenChange={(open) => {
          if (!place.isPending && !open) setReview(null);
        }}
        title="Tudo pronto para sua coleção?"
        description="Revise os itens e o total. A compra será confirmada apenas após a resposta do pagamento simulado."
      >
        {review && (
          <>
            <dl className="review-lines">
              {review.items.map((l) => (
                <div key={`${l.nftId}:${l.edition}`}>
                  <dt>
                    {l.quantity} × {l.nft.name}
                  </dt>
                  <dd>{eth(l.lineTotal)}</dd>
                </div>
              ))}
              <div className="summary-total">
                <dt>Total com taxas</dt>
                <dd>{eth(review.total)}</dd>
              </div>
            </dl>
            {stale && (
              <p className="form-error" role="alert">
                A cotação foi atualizada. Feche e revise novamente.
              </p>
            )}
            {error && (
              <p role="alert" className="form-error mb-4">
                {error}
              </p>
            )}
            <Button
              className="w-full"
              disabled={stale || place.isPending || !!attempt}
              onClick={() => place.mutate()}
            >
              {place.isPending
                ? "Enviando pedido…"
                : "Confirmar compra simulada"}
            </Button>
            {attempt && (
              <Button
                className="w-full mt-3"
                variant="outline"
                onClick={() => recover.mutate()}
                disabled={recover.isPending}
              >
                Recuperar a mesma tentativa
              </Button>
            )}
          </>
        )}
      </Dialog>
    </>
  );
}
export function OrderPage() {
  const [explorer, setExplorer] = useState(false);
  const { id } = useParams({ strict: false });
  const { data: user } = useSession();
  const order = useQuery({
    queryKey: ["private", user?.id, "order", id],
    queryFn: ({ signal }) => api.order(id!, signal),
    enabled: !!user,
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? 1500 : false,
  });
  const products = useQueries({
    queries: (order.data?.quote.items ?? []).map((l) => ({
      queryKey: ["nft", l.nftId],
      queryFn: () => api.nft(l.nftId),
    })),
  });
  void products;
  useEffect(() => {
    if (order.data?.status === "confirmed") void invalidateCommerce();
  }, [order.data?.status]);
  if (order.isPending) return <Skeleton cards={1} />;
  if (order.isError)
    return (
      <ErrorState error={order.error} retry={() => void order.refetch()} />
    );
  const o = order.data;
  return (
    <section className="receipt">
      <Link to="/" className="receipt-close" aria-label="Fechar recibo">
        ×
      </Link>
      <div className={`receipt-icon ${o.status}`}>
        {o.status === "confirmed" ? (
          <CheckCircle2 size={44} />
        ) : o.status === "declined" ? (
          <XCircle size={44} />
        ) : (
          <Clock3 size={44} />
        )}
      </div>
      <p className="eyebrow">KURIO COLLECTORS CLUB</p>
      <h1>
        {o.status === "confirmed"
          ? "Seus NFTs agora estão na sua carteira"
          : o.status === "declined"
            ? "Não foi possível concluir o pagamento."
            : "Seu pedido está sendo processado."}
      </h1>
      <p className="muted">
        {o.status === "confirmed"
          ? "Pedido confirmado. As peças abaixo agora fazem parte da sua coleção simulada."
          : o.status === "declined"
            ? o.reason
            : "Você pode recarregar esta página. O pedido será recuperado sem criar outra compra."}
      </p>
      <div className="receipt-meta">
        <span>
          <small>
            {o.status === "confirmed" ? "ID da transação" : "Pedido"}
          </small>
          {o.status === "confirmed"
            ? `${o.transaction.slice(0, 8)}…${o.transaction.slice(-4)}`
            : o.id.slice(0, 8)}
        </span>
        <span>
          <small>Data</small>
          {new Date(o.createdAt).toLocaleDateString("pt-BR")}
        </span>
        <span>
          <small>Total</small>
          {eth(o.quote.total)}
        </span>
        {o.payment && (
          <span>
            <small>Carteira e rede</small>
            {o.payment.provider} · {o.payment.network}
          </span>
        )}
      </div>
      <Summary quote={o.quote} title="Detalhes da transação" />
      {o.status === "confirmed" && (
        <div className="transaction">
          <Check size={16} />
          <div>
            Identificação da transação<code>{o.transaction}</code>
            <small>Referência simulada · sem registro em blockchain</small>
          </div>
        </div>
      )}
      <div className="flex justify-center gap-3 flex-wrap mt-7">
        {o.status === "confirmed" && (
          <Button onClick={() => setExplorer(true)}>Ver no Etherscan</Button>
        )}
        <Button asChild>
          <Link to="/">
            Continuar explorando <ArrowRight size={15} />
          </Link>
        </Button>
        {o.status === "declined" && (
          <Button asChild variant="outline">
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/pedidos">Meus pedidos</Link>
        </Button>
      </div>
      <Dialog
        open={explorer}
        onOpenChange={setExplorer}
        title="Explorador de transação simulado"
        description="Esta referência é fictícia e não corresponde a uma transação real no Etherscan."
      >
        <dl className="explorer-details">
          <dt>Referência</dt>
          <dd>
            <code>{o.transaction}</code>
          </dd>
          <dt>Estado do pedido</dt>
          <dd>{o.status === "confirmed" ? "Confirmado" : o.status}</dd>
          <dt>Rede</dt>
          <dd>{o.payment?.network ?? "Simulada"}</dd>
          <dt>Total do recibo</dt>
          <dd>{eth(o.quote.total)}</dd>
        </dl>
      </Dialog>
    </section>
  );
}
