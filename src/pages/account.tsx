import { parseUser } from "../lib/session";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  LogOut,
  UserRound,
  Wallet as WalletIcon,
  Heart,
  Package,
  Check,
  Plus,
  Eye,
  EyeOff,
  ImagePlus,
} from "lucide-react";
import { api, http, logout, message, queryClient, useSession } from "../api";
import { categories, defaultSearch, eth, networks } from "../domain";
import type { Order, User, Wallet } from "../types";
import { useToast } from "../shell";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { PasswordField } from "../components/password-field";
import {
  Empty,
  ErrorState,
  Field,
  PageTitle,
  Skeleton,
} from "../components/shared";
export function AuthPage({ register = false }: { register?: boolean }) {
  const search = useSearch({ strict: false }) as { returnTo?: string };
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [help, setHelp] = useState("");
  const backdrop = useQuery({
    queryKey: ["catalog", "auth-backdrop"],
    queryFn: ({ signal }) => api.catalog(defaultSearch, signal),
    enabled: matchMedia("(min-width: 601px)").matches,
  });
  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      if (register) await http.post("/register", data);
      return parseUser((await http.post<unknown>("/login", data)).data);
    },
    onSuccess: async (user) => {
      queryClient.clear();
      queryClient.setQueryData(["session"], user);
      await navigate({ to: search.returnTo || "/perfil" });
      toast(
        register
          ? "Sua conta foi criada. Bem-vindo à Kurio!"
          : "Bom ter você de volta.",
      );
    },
    onError: (e) => setError(message(e)),
  });
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    if (register && values.password !== values.confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    mutation.mutate(values);
  };
  return (
    <section
      className={`auth-layout ${register ? "auth-register" : "auth-login"}`}
    >
      <div className="auth-story">
        <p className="eyebrow">Seu próximo capítulo começa aqui</p>
        <h1>
          SEJA DONO DO FUTURO
          <br />
          DA ARTE DIGITAL
        </h1>
        <p className="muted">
          Colecione o extraordinário.
          <br />
          Faça parte de uma nova cultura.
        </p>
        <img
          src="/assets/ape-1.webp"
          alt="Emerald Ape da coleção Kurio"
          width="640"
          height="640"
        />
      </div>
      <aside className="auth-backdrop-sidebar" aria-hidden="true">
        <h3>Coleções</h3>
        {categories.map((category) => (
          <p key={category}>{category}</p>
        ))}
        <h3>Faixa de preço</h3>
        <div className="decorative-range" />
        <small>Preço: 0,02 – 12,30 ETH</small>
        <h3>Rede</h3>
        {networks.map((network) => (
          <p key={network}>{network}</p>
        ))}
      </aside>
      <div className="auth-backdrop-grid" aria-hidden="true">
        {backdrop.data?.items.map((nft) => (
          <div key={nft.id}>
            <img src={nft.image} alt="" />
            <p>{nft.name}</p>
            <span>{eth(nft.price)}</span>
          </div>
        ))}
      </div>
      <div className="auth-form-panel">
        <Link className="auth-close" to="/" aria-label="Fechar formulário">
          ×
        </Link>
        <nav className="auth-tabs" aria-label="Acesso à conta">
          <Link to="/login" className={!register ? "active" : ""}>
            Entrar
          </Link>
          <span> | </span>
          <Link to="/cadastro" className={register ? "active" : ""}>
            Criar conta
          </Link>
        </nav>
        <Link to="/" className="auth-brand" aria-label="Voltar ao início">
          KURIO
        </Link>
        <h2>{register ? "Criar perfil de colecionador" : "Entrar"}</h2>
        <p className="muted">
          {register
            ? "Seu primeiro passo para uma coleção única."
            : "Entre para continuar sua jornada de colecionador."}
        </p>
        <form onSubmit={submit} className="form-stack">
          {register && (
            <Field label="Nome completo">
              <input
                name="name"
                placeholder="Nome de exibição"
                autoComplete="name"
                required
                minLength={2}
              />
            </Field>
          )}
          <Field label="E-mail">
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@exemplo.com"
            />
          </Field>
          <div className="password-input">
            <Field label="Senha">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={8}
                pattern={register ? "(?=.*[A-Z])(?=.*[0-9]).{8,}" : undefined}
                aria-describedby={register ? "password-help" : undefined}
              />
            </Field>
            <button
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>
          </div>
          {!register && (
            <button
              type="button"
              className="forgot-password"
              onClick={() => setHelp("Recuperação de senha")}
            >
              Esqueceu a senha?
            </button>
          )}
          {register && (
            <>
              <small id="password-help" className="muted">
                Use 8 caracteres ou mais, com maiúscula e número.
              </small>
              <Field label="Confirmar senha">
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Confirmar senha"
                  minLength={8}
                />
              </Field>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Aguarde…"
              : register
                ? "Criar conta"
                : "Entrar"}
            <ArrowRight size={16} />
          </Button>
        </form>
        <div className="social-login">
          <p>
            <span>Ou continue com</span>
          </p>
          <Button variant="outline" onClick={() => setHelp("Login com Google")}>
            <span className="google-symbol" aria-hidden="true">
              G
            </span>
            Continuar com Google
          </Button>
          <Button
            variant="outline"
            onClick={() => setHelp("Login com Facebook")}
          >
            <span className="facebook-symbol" aria-hidden="true">
              f
            </span>
            Continuar com Facebook
          </Button>
        </div>
        <p className="auth-switch">
          {register ? "Já tem uma conta?" : "Novo na Kurio?"}{" "}
          <Link to={register ? "/login" : "/cadastro"}>
            {register ? "Entre aqui" : "Crie uma conta"}
          </Link>
        </p>
        <div className="demo-credentials">
          <span>EXPERIMENTE A DEMONSTRAÇÃO</span>
          <p>ana@kurio.demo · Kurio123!</p>
          <small>Use apenas dados fictícios nesta aplicação.</small>
        </div>
      </div>
      <Dialog
        open={!!help}
        onOpenChange={(open) => !open && setHelp("")}
        title={help}
        description="Esta ação não faz parte da simulação do desafio."
      >
        <p>
          Use o cadastro e o login por e-mail para acessar sua conta
          demonstrativa. Para testar, entre com ana@kurio.demo e a senha
          Kurio123!.
        </p>
        <Button className="mt-5 w-full" onClick={() => setHelp("")}>
          Entendi
        </Button>
      </Dialog>
    </section>
  );
}
export function AccountLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  return (
    <div className="account-layout">
      <aside className="account-nav">
        <h2>Meu perfil</h2>
        <Link to="/perfil" activeProps={{ className: "active" }}>
          <UserRound size={15} />
          Dados do perfil
        </Link>
        <Link to="/carteiras" activeProps={{ className: "active" }}>
          <WalletIcon size={15} />
          Carteiras
        </Link>
        <Link to="/pedidos" activeProps={{ className: "active" }}>
          <Package size={15} />
          Meus pedidos
        </Link>
        <button
          onClick={() =>
            toast("Atividade está fora do escopo desta demonstração.")
          }
        >
          <Package size={15} />
          Atividade
        </button>
        <Link to="/" search={(s) => ({ ...s, favorites: true })}>
          <Heart size={15} />
          Lista de interesse
        </Link>
        {["Ofertas", "Arquivos baixados", "Suporte"].map((label) => (
          <button
            key={label}
            onClick={() =>
              toast(
                `${label}: funcionalidade fora do escopo desta demonstração.`,
              )
            }
          >
            <Plus size={15} />
            {label}
          </button>
        ))}
        <button
          onClick={async () => {
            await logout();
            void navigate({ to: "/" });
            toast("Você saiu da sua conta.");
          }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </aside>
      <section className="account-content">
        <PageTitle title={title} />
        {children}
      </section>
    </div>
  );
}
export function Profile() {
  const { data: user, isPending } = useSession();
  if (isPending || !user) return <Skeleton cards={2} />;
  return (
    <AccountLayout title="Perfil do colecionador">
      <ProfileForm key={user.id} user={user} />
    </AccountLayout>
  );
}
function ProfileForm({ user }: { user: User }) {
  const toast = useToast();
  const [avatar, setAvatar] = useState(user.avatar);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const save = useMutation({
    mutationFn: async (data: Record<string, string>) =>
      parseUser(
        (await http.patch<unknown>("/profile", { ...data, avatar })).data,
      ),
    onSuccess: (u) => {
      queryClient.setQueryData(["session"], u);
      toast("Perfil atualizado com sucesso.");
    },
    onError: (e) => setError(message(e)),
  });
  const password = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      if (data.password !== data.confirmPassword)
        throw new Error("As senhas precisam ser iguais.");
      await http.post("/password", data);
    },
    onSuccess: () => toast("Senha alterada com sucesso."),
    onError: (e) => setPasswordError(message(e)),
  });
  return (
    <>
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          save.mutate(
            Object.fromEntries(new FormData(e.currentTarget)) as Record<
              string,
              string
            >,
          );
        }}
      >
        <Field label="Nome de exibição *">
          <input
            name="name"
            defaultValue={user.name}
            required
            autoComplete="name"
          />
        </Field>
        <Field label="Nome de usuário *">
          <input
            name="username"
            defaultValue={user.username}
            required
            pattern="[a-zA-Z0-9._-]{2,30}"
          />
        </Field>
        <Field label="E-mail *">
          <input
            name="email"
            defaultValue={user.email}
            required
            type="email"
            autoComplete="email"
          />
        </Field>
        <Field label="Nome ENS">
          <input name="ens" defaultValue={user.ens} placeholder="seunome.eth" />
        </Field>
        <Field label="Apelido da carteira">
          <input name="walletAlias" defaultValue={user.walletAlias} />
        </Field>
        <div className="avatar-field">
          <span>Avatar</span>
          <div>
            {avatar ? (
              <img src={avatar} width="56" height="56" alt="Seu avatar" />
            ) : (
              <span className="avatar-placeholder" aria-label="Sem avatar">
                <ImagePlus size={22} />
              </span>
            )}
            <label className="upload-button">
              Alterar
              <input
                aria-label="Alterar avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    file.size > 1000000 ||
                    !["image/png", "image/jpeg", "image/webp"].includes(
                      file.type,
                    )
                  ) {
                    setError("Selecione PNG, JPEG ou WebP de até 1 MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setAvatar(String(reader.result));
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setAvatar("")}
            >
              Remover
            </Button>
          </div>
        </div>
        {error && (
          <p className="form-error full-width" role="alert">
            {error}
          </p>
        )}
        <div className="full-width">
          <Button disabled={save.isPending}>
            {save.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>
      <section className="password-section">
        <h2>Alterar senha</h2>
        <p className="muted">
          Use uma senha exclusiva para sua conta de demonstração.
        </p>
        <form
          className="form-grid mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            setPasswordError("");
            password.mutate(
              Object.fromEntries(new FormData(e.currentTarget)) as Record<
                string,
                string
              >,
            );
          }}
        >
          <PasswordField
            label="Senha atual"
            name="currentPassword"

            autoComplete="current-password"
            required
          />
          <div />
          <PasswordField
            label="Nova senha"
            name="password"

            autoComplete="new-password"
            minLength={8}
            required
            pattern="(?=.*[A-Z])(?=.*[0-9]).{8,}"
          />
          <PasswordField
            label="Confirmar nova senha"
            name="confirmPassword"

            autoComplete="new-password"
            minLength={8}
            required
          />
          {passwordError && (
            <p className="form-error full-width" role="alert">
              {passwordError}
            </p>
          )}
          <Button className="justify-self-start" disabled={password.isPending}>
            Atualizar senha
          </Button>
        </form>
      </section>
    </>
  );
}
export function Wallets() {
  const { data: user } = useSession();
  const query = useQuery({
    queryKey: ["private", user?.id, "wallets"],
    queryFn: ({ signal }) => api.wallets(signal),
    enabled: !!user,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const selected = adding
    ? undefined
    : (query.data?.find((wallet) => wallet.id === editingId) ??
      query.data?.find((wallet) => wallet.primary));
  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) =>
      (
        await http.post<Wallet[]>("/wallets", {
          ...data,
          id: selected?.id,
          primary: data.primary === "on",
        })
      ).data,
    onSuccess: (wallets) => {
      queryClient.setQueryData(["private", user?.id, "wallets"], wallets);
      void queryClient.invalidateQueries({ queryKey: ["session"] });
      setAdding(false);
      setEditingId(null);
      setError("");
      toast("Carteira salva com sucesso.");
    },
    onError: (error) => setError(message(error)),
  });
  return (
    <AccountLayout
      title={
        adding
          ? "Cadastrar carteira"
          : selected?.primary
            ? "Carteira principal"
            : "Editar carteira"
      }
    >
      <p className="wallet-description muted">
        Estas carteiras ficam disponíveis no pagamento e para receber NFTs
        comprados.
      </p>
      <Button
        className="wallet-add"
        size="sm"
        variant="ghost"
        onClick={() => {
          setAdding(true);
          setEditingId(null);
          setError("");
        }}
      >
        <Plus size={14} />
        Adicionar carteira
      </Button>
      {query.isPending ? (
        <Skeleton cards={1} />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <form
            key={selected?.id ?? "new"}
            className="wallet-editor form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              mutation.mutate(
                Object.fromEntries(new FormData(event.currentTarget)) as Record<
                  string,
                  string
                >,
              );
            }}
          >
            <Field label="Nome de exibição *">
              <input
                name="displayName"
                defaultValue={selected?.displayName ?? user?.name}
                required
                minLength={2}
              />
            </Field>
            <Field label="Apelido da carteira">
              <input name="label" required defaultValue={selected?.label} />
            </Field>
            <Field label="Rede">
              <select
                name="network"
                aria-label="Rede"
                defaultValue={selected?.network ?? "Ethereum"}
              >
                {networks.map((network) => (
                  <option key={network}>{network}</option>
                ))}
              </select>
            </Field>
            <Field label="Nome do perfil *">
              <input
                name="profileName"
                defaultValue={selected?.profileName ?? user?.username}
                required
                minLength={2}
              />
            </Field>
            <Field label="Endereço simulado">
              <input
                name="address"
                required
                defaultValue={selected?.address}
                pattern="0x[a-fA-F0-9]{40}"
                placeholder="Endereço 0x da carteira"
              />
            </Field>
            <Field label="ENS ou carteira secundária (opcional)">
              <input
                name="secondaryWallet"
                defaultValue={selected?.secondaryWallet}
                placeholder="ENS ou carteira secundária (opcional)"
              />
            </Field>
            <Field label="Tipo de carteira">
              <select
                name="provider"
                aria-label="Tipo de carteira"
                defaultValue={selected?.provider ?? "WalletConnect"}
              >
                {["WalletConnect", "MetaMask", "Coinbase Wallet"].map(
                  (provider) => (
                    <option key={provider}>{provider}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Código de indicação (opcional)">
              <input
                name="referral"
                defaultValue={selected?.referral}
                maxLength={50}
              />
            </Field>
            <Field label="E-mail *">
              <input
                name="email"
                type="email"
                defaultValue={selected?.email ?? user?.email}
                required
              />
            </Field>
            <Field label="Nome ENS">
              <input
                name="ens"
                defaultValue={selected?.ens ?? user?.ens}
                placeholder="seunome.eth"
              />
            </Field>
            <label className="check-label full-width">
              <input
                type="checkbox"
                name="primary"
                defaultChecked={selected?.primary ?? !query.data.length}
              />
              Definir como principal
            </label>
            {error && (
              <p role="alert" className="form-error full-width">
                {error}
              </p>
            )}
            <div className="flex gap-3 full-width">
              <Button disabled={mutation.isPending}>
                <Check size={15} />
                Salvar carteira
              </Button>
              {(adding || editingId) && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAdding(false);
                    setEditingId(null);
                    setError("");
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
          <section className="secondary-wallets">
            <h2>Carteira secundária</h2>
            {query.data.some((wallet) => !wallet.primary) ? (
              <div className="wallet-list">
                {query.data
                  .filter((wallet) => !wallet.primary)
                  .map((wallet) => (
                    <article className="wallet-card" key={wallet.id}>
                      <WalletIcon size={24} />
                      <div>
                        <h2>{wallet.label}</h2>
                        <p>{wallet.network}</p>
                        <code>{wallet.address}</code>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(wallet.id);
                          setAdding(false);
                          setError("");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Editar
                      </Button>
                    </article>
                  ))}
              </div>
            ) : (
              <p className="muted">
                Você ainda não adicionou uma carteira secundária.
              </p>
            )}
          </section>
        </>
      )}
      <p className="simulation-note mt-8">
        Endereços fictícios · nenhuma extensão ou carteira real é necessária.
      </p>
    </AccountLayout>
  );
}

export function Orders() {
  const { data: user } = useSession();
  const query = useQuery({
    queryKey: ["private", user?.id, "orders"],
    queryFn: async () => (await http.get<Order[]>("/orders")).data,
    enabled: !!user,
  });
  return (
    <AccountLayout title="Meus pedidos">
      {query.isPending ? (
        <Skeleton cards={1} />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : query.data.length ? (
        <div className="order-list">
          {query.data.map((o) => (
            <Link key={o.id} to="/pedido/$id" params={{ id: o.id }}>
              <div>
                <span>Pedido #{o.id.slice(0, 8)}</span>
                <small>
                  {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                </small>
              </div>
              <span className={`order-status ${o.status}`}>
                {o.status === "confirmed"
                  ? "Confirmado"
                  : o.status === "declined"
                    ? "Recusado"
                    : "Pendente"}
              </span>
              <strong>{eth(o.quote.total)}</strong>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="Sua coleção começa aqui"
          description="Quando você fizer uma compra, seu pedido aparecerá aqui."
        />
      )}
    </AccountLayout>
  );
}
