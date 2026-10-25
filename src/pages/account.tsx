import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Leaf, Plus, Wallet as WalletIcon } from "lucide-react";
import { api, get, message, queryClient } from "../api";
import type { Nft, User, Wallet } from "../domain";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/dialog";
import { Empty, ErrorState, Skeleton, useSession, toast } from "../shell";
import { NftCard } from "./catalog";
export function Login() {
  return <Auth />;
}
export function Register() {
  return <Auth register />;
}
export function Auth({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: (body: Record<string, FormDataEntryValue>) =>
      api.post<{ user: User }>(
        register ? "/auth/register" : "/auth/login",
        body,
      ),
    onSuccess: async (response) => {
      queryClient.clear();
      queryClient.setQueryData(["session"], response.data);
      const target =
        search.redirect || sessionStorage.getItem("auth-return") || "/";
      sessionStorage.removeItem("auth-return");
      await navigate({ to: target });
      toast(
        register
          ? "Sua conta foi criada. Bem-vindo à Jungle!"
          : "Bem-vindo de volta!",
      );
    },
    onError: (e) => setError(message(e)),
  });
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    mutation.mutate(Object.fromEntries(new FormData(e.currentTarget)));
  }
  return (
    <div className="container auth-layout">
      <section className="auth-art">
        <Leaf size={34} />
        <h1>
          Art is personal.
          <br />
          Make it yours<span>.</span>
        </h1>
        <img
          src="/art/violet-nomad.webp"
          width="500"
          height="500"
          alt="NFT de macaco com chapéu e casaco lilás"
        />
        <span>YOUR NEXT CHAPTER STARTS HERE.</span>
      </section>
      <section className="auth-form">
        <span className="eyebrow">YOUR CREATIVE WORLD</span>
        <h1>{register ? "Comece sua coleção." : "Bom ter você de volta."}</h1>
        <p className="muted">
          {register
            ? "Crie sua conta e descubra novas perspectivas."
            : "Entre para continuar sua jornada pela arte."}
        </p>
        <form
          onSubmit={submit}
          className="form-stack"
          aria-describedby={error ? "auth-error" : undefined}
        >
          {register && (
            <label>
              Nome completo
              <input name="name" autoComplete="name" required minLength={2} />
            </label>
          )}
          <label>
            E-mail
            <input
              name="email"
              aria-describedby={error ? "auth-error" : undefined}
              aria-invalid={!!error}
              type="email"
              autoComplete="email"
              required
              placeholder="voce@exemplo.com"
            />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={8}
              aria-describedby={
                error ? "password-help auth-error" : "password-help"
              }
              aria-invalid={!!error}
            />
          </label>
          <small id="password-help">Mínimo de 8 caracteres.</small>
          {register && (
            <label className="checkbox">
              <input type="checkbox" required />
              Concordo em utilizar esta demonstração com dados fictícios.
            </label>
          )}
          {error && (
            <p className="field-error" role="alert" id="auth-error">
              {error}
            </p>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Aguarde…"
              : register
                ? "Criar conta"
                : "Entrar"}
            <ArrowUpRight size={18} />
          </Button>
        </form>
        <p>
          {register ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
          {register ? (
            <Link to="/login" search={{ redirect: "/" }}>
              Entrar
            </Link>
          ) : (
            <Link
              to="/register"
              onClick={() =>
                sessionStorage.setItem("auth-return", search.redirect || "/")
              }
            >
              Criar conta
            </Link>
          )}
        </p>
        <div className="demo-credentials">
          <strong>Conta de demonstração</strong>
          <span>alex@example.com / Jungle123!</span>
          <span>sam@example.com / Jungle123!</span>
        </div>
      </section>
    </div>
  );
}
function AccountNav() {
  return (
    <nav className="account-nav" aria-label="Menu da conta">
      <Link to="/profile">Meu perfil</Link>
      <Link to="/wallets">Minhas carteiras</Link>
      <Link to="/favorites">Favoritos</Link>
    </nav>
  );
}
export function Profile() {
  const { data } = useSession();
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch("/profile", body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast("Dados atualizados com sucesso.");
      setError("");
    },
    onError: (e) => setError(message(e)),
  });
  async function upload(file?: File) {
    if (!file) return;
    if (
      file.size > 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    ) {
      setError("Use PNG, JPEG ou WebP de até 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  }
  return (
    <div className="container page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR SPACE</span>
          <h1>
            Meu perfil<span>.</span>
          </h1>
        </div>
      </div>
      <AccountNav />
      <div className="account-columns">
        <form
          className="panel form-stack"
          key={data?.user?.id}
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({
              ...Object.fromEntries(new FormData(e.currentTarget)),
              avatar: avatar ?? data?.user?.avatar ?? "",
            });
          }}
        >
          <h2>Informações pessoais</h2>
          <div className="row">
            <div className="profile-avatar">
              {avatar || data?.user?.avatar ? (
                <img src={avatar || data?.user?.avatar} alt="Seu avatar" />
              ) : (
                data?.user?.name[0]
              )}
            </div>
            <label>
              Avatar
              <input
                type="file"
                aria-label="Avatar"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => upload(e.target.files?.[0])}
              />
              <small>PNG, JPEG ou WebP. Até 1 MB.</small>
            </label>
          </div>
          <label>
            Nome completo
            <input
              name="name"
              defaultValue={data?.user?.name}
              required
              minLength={2}
            />
          </label>
          <label>
            E-mail
            <input
              name="email"
              type="email"
              defaultValue={data?.user?.email}
              required
            />
          </label>
          <Button disabled={mutation.isPending}>Salvar alterações</Button>
        </form>
        <form
          className="panel form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const body = Object.fromEntries(new FormData(e.currentTarget));
            if (body.password !== body.confirmPassword) {
              setError("As senhas não coincidem.");
              return;
            }
            mutation.mutate(body);
          }}
        >
          <h2>Alterar senha</h2>
          <label>
            Senha atual
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            Nova senha
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label>
            Confirmar nova senha
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <Button variant="outline" disabled={mutation.isPending}>
            Atualizar senha
          </Button>
        </form>
      </div>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function Wallets() {
  const { data } = useSession();
  const query = useQuery({
    queryKey: ["wallets", data?.user?.id],
    queryFn: ({ signal }) => get<Wallet[]>("/wallets", signal),
  });
  const [edit, setEdit] = useState<Wallet | null | undefined>(undefined);
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/wallets", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      setEdit(undefined);
      toast("Carteira salva.");
    },
    onError: (e) => setError(message(e)),
  });
  return (
    <div className="container page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR COLLECTION, CONNECTED</span>
          <h1>
            Minhas carteiras<span>.</span>
          </h1>
        </div>
        <Button
          onClick={() => {
            setEdit(null);
            setError("");
          }}
        >
          <Plus size={16} />
          Adicionar carteira
        </Button>
      </div>
      <AccountNav />
      {query.isPending ? (
        <Skeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => query.refetch()} />
      ) : (
        <div className="account-columns">
          {query.data.map((w) => (
            <div key={w.id} className="panel wallet-card">
              <WalletIcon size={30} />
              <span className="tag">
                {w.primary ? "Principal" : "Secundária"} • {w.network}
              </span>
              <h2>{w.name}</h2>
              <code>{w.address}</code>
              <Button
                variant="outline"
                onClick={() => {
                  setEdit(w);
                  setError("");
                }}
              >
                Editar carteira
              </Button>
            </div>
          ))}
          {!query.data.length && (
            <Empty title="Sua coleção começa aqui">
              <p>Cadastre uma carteira fictícia para simular compras.</p>
            </Empty>
          )}
        </div>
      )}
      <Modal
        open={edit !== undefined}
        onOpenChange={() => setEdit(undefined)}
        title={edit ? "Editar carteira" : "Nova carteira"}
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const fields = Object.fromEntries(new FormData(e.currentTarget));
            mutation.mutate({
              ...fields,
              id: edit?.id || "",
              primary: fields.primary === "on",
            });
          }}
        >
          <label>
            Nome da carteira
            <input name="name" defaultValue={edit?.name} required />
          </label>
          <label>
            Endereço
            <input
              name="address"
              defaultValue={edit?.address}
              required
              pattern="0x[a-fA-F0-9]{40}"
              placeholder="0x + 40 caracteres hexadecimais"
              aria-describedby="address-help"
            />
          </label>
          <small id="address-help">Use apenas endereços fictícios.</small>
          <label>
            Rede
            <select
              aria-label="Rede"
              name="network"
              defaultValue={edit?.network || "Ethereum"}
            >
              <option>Ethereum</option>
              <option>Polygon</option>
            </select>
          </label>
          <label className="checkbox">
            <input
              name="primary"
              type="checkbox"
              defaultChecked={edit?.primary}
            />
            Carteira principal
          </label>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <Button disabled={mutation.isPending}>Salvar carteira</Button>
        </form>
      </Modal>
    </div>
  );
}
export function Favorites() {
  const { data } = useSession();
  const favorites = useQuery({
    queryKey: ["favorites", data?.user?.id],
    queryFn: ({ signal }) => get<string[]>("/favorites", signal),
  });
  const nfts = useQuery({
    queryKey: ["nfts", "favorites", favorites.data],
    queryFn: () =>
      Promise.all((favorites.data || []).map((id) => get<Nft>(`/nfts/${id}`))),
    enabled: !!favorites.data,
  });
  return (
    <div className="container page">
      <span className="eyebrow">SAVED FOR YOU</span>
      <h1>
        Suas próximas obsessões<span>.</span>
      </h1>
      <AccountNav />
      {favorites.isPending || nfts.isPending ? (
        <Skeleton cards />
      ) : favorites.isError || nfts.isError ? (
        <ErrorState
          error={favorites.error || nfts.error}
          retry={() => {
            favorites.refetch();
            nfts.refetch();
          }}
        />
      ) : nfts.data?.length ? (
        <div className="nft-grid">
          {nfts.data.map((n) => (
            <NftCard key={n.id} nft={n} />
          ))}
        </div>
      ) : (
        <Empty title="Ainda sem favoritos">
          <p>Salve as obras que despertam algo em você.</p>
          <Button asChild>
            <Link to="/">Explorar coleção</Link>
          </Button>
        </Empty>
      )}
    </div>
  );
}
