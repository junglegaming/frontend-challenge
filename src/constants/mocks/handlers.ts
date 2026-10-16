import { http, HttpResponse, delay } from "msw";
import { collectorErrors } from "../../lib/collector";
import { fromWei, toWei } from "../../domain";
import type { CartLine, Wallet, User } from "../../types";
import {
  cart,
  currentUser,
  finishOrder,
  getDB,
  hashPassword,
  publicUser,
  quote,
  reset,
  save,
  scenarios,
  setCart,
  type Scenario,
} from "./db";
import { emitNFT, emitOrder, disconnectClients } from "./realtime";
const json = (data: unknown, status = 200) =>
  HttpResponse.json(data as Record<string, unknown>, { status });
const error = (message: string, status = 400) => json({ message }, status);
const unauthorized = () =>
  error("Sua sessão expirou. Entre para continuar.", 401);
type Context = {
  request: Request;
  params: Record<string, string | readonly string[] | undefined>;
};
function route(
  method: "get" | "post" | "patch" | "delete",
  path: string,
  fn: (ctx: Context) => Promise<Response> | Response,
  privateRoute = false,
) {
  return http[method](`/api${path}`, async (ctx) => {
    const scenario = getDB().scenario;
    const url = new URL(ctx.request.url);
    await delay(
      scenario === "slow"
        ? 2200
        : scenario === "out-of-order"
          ? url.searchParams.get("q")?.length === 1
            ? 1500
            : 100
          : 150,
    );
    if (scenario === "offline") return HttpResponse.error();
    if (scenario === "server-error")
      return error(
        "Serviço temporariamente indisponível. Tente novamente.",
        503,
      );
    if (scenario === "expired" && privateRoute) {
      getDB().session = null;
      save();
    }
    if (privateRoute && !currentUser()) return unauthorized();
    try {
      return await fn(ctx);
    } catch (e) {
      return error(e instanceof Error ? e.message : "Operação inválida.", 409);
    }
  });
}
export const handlers = [
  http.post("/api/demo/reset", async ({ request }) => {
    const { scenario = "standard" } = (await request.json()) as {
      scenario: Scenario;
    };
    if (!scenarios.includes(scenario)) return error("Cenário inválido");
    await reset(scenario);
    disconnectClients();
    return json({ ok: true });
  }),
  http.get("/api/demo", () => json({ scenario: getDB().scenario, scenarios })),
  http.post("/api/demo/scenario", async ({ request }) => {
    const { scenario } = (await request.json()) as { scenario: Scenario };
    if (!scenarios.includes(scenario)) return error("Cenário inválido");
    getDB().scenario = scenario;
    save();
    return json({ ok: true });
  }),
  http.post("/api/demo/event", async ({ request }) => {
    const { type, nftId = "nft-1" } = (await request.json()) as {
      type: string;
      nftId: string;
    };
    const db = getDB();
    const nft = db.nfts.find((x) => x.id === nftId);
    if (type === "expire") {
      db.session = null;
      save();
      return json({ ok: true });
    }
    if (type === "disconnect") {
      disconnectClients();
      return json({ ok: true });
    }
    if (!nft) return error("NFT não encontrado", 404);
    if (type === "old") {
      emitNFT(nft, true);
      return json({ ok: true });
    }
    nft.version++;
    if (type === "stock") {
      nft.stock = 0;
      nft.editions.forEach((e) => (e.stock = 0));
    } else nft.price = fromWei(toWei(nft.price) + toWei("0.1"));
    save();
    emitNFT(nft);
    if (type === "duplicate") emitNFT(nft);
    return json({ ok: true });
  }),
  route("get", "/session", () =>
    currentUser() ? json(publicUser(currentUser()!)) : unauthorized(),
  ),
  route("post", "/login", async ({ request }) => {
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };
    const db = getDB();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user || user.passwordHash !== (await hashPassword(password)))
      return error("E-mail ou senha incorretos.", 422);
    for (const line of db.guest) {
      const existing = user.cart.find(
        (x) => x.nftId === line.nftId && x.edition === line.edition,
      );
      const stock = db.nfts
        .find((n) => n.id === line.nftId)!
        .editions.find((e) => e.id === line.edition)!.stock;
      if (existing)
        existing.quantity = Math.min(stock, existing.quantity + line.quantity);
      else
        user.cart.push({ ...line, quantity: Math.min(stock, line.quantity) });
    }
    user.cart = user.cart.filter((x) => x.quantity > 0);
    db.guest = [];
    db.session = { userId: user.id, expiresAt: Date.now() + 3600000 };
    save();
    return json(publicUser(user));
  }),
  route("post", "/register", async ({ request }) => {
    const b = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };
    if (
      !b.name?.trim() ||
      !/^\S+@\S+\.\S+$/.test(b.email) ||
      !/(?=.*[A-Z])(?=.*\d).{8,}/.test(b.password)
    )
      return error(
        "Informe nome, e-mail válido e senha com 8 caracteres, maiúscula e número.",
        422,
      );
    const db = getDB();
    if (db.users.some((u) => u.email.toLowerCase() === b.email.toLowerCase()))
      return error("Este e-mail já está cadastrado.", 409);
    const user = {
      id: crypto.randomUUID(),
      name: b.name,
      email: b.email,
      username: b.email.split("@")[0],
      ens: "",
      walletAlias: "",
      avatar: "/assets/ape-1.webp",
      wallets: [],
      passwordHash: await hashPassword(b.password),
      favorites: [],
      cart: [],
    };
    db.users.push(user);
    save();
    return json(publicUser(user), 201);
  }),
  route("post", "/logout", () => {
    getDB().session = null;
    save();
    disconnectClients();
    return json({ ok: true });
  }),
  route("get", "/nfts", ({ request }) => {
    if (getDB().scenario === "invalid-catalog")
      return json({ total: 0, pages: 1 });
    if (getDB().scenario === "invalid-response")
      return HttpResponse.html(
        "<!doctype html><title>Resposta inesperada</title>",
      );
    const p = new URL(request.url).searchParams;
    let list = [...getDB().nfts];
    if (getDB().scenario === "empty") list = [];
    if (p.get("q"))
      list = list.filter((n) =>
        n.name.toLowerCase().includes(p.get("q")!.toLowerCase()),
      );
    if (p.get("category"))
      list = list.filter((n) => n.category === p.get("category"));
    if (p.get("network"))
      list = list.filter((n) => n.network === p.get("network"));
    if (p.get("max"))
      list = list.filter((n) => toWei(n.price) <= toWei(p.get("max")!));
    if (p.get("favorites") === "true") {
      if (!currentUser()) return unauthorized();
      list = list.filter((n) => currentUser()!.favorites.includes(n.id));
    }
    if (p.get("sort") === "price-asc")
      list.sort((a, b) => (toWei(a.price) < toWei(b.price) ? -1 : 1));
    if (p.get("sort") === "price-desc")
      list.sort((a, b) => (toWei(a.price) > toWei(b.price) ? -1 : 1));
    if (p.get("sort") === "name")
      list.sort((a, b) => a.name.localeCompare(b.name));
    const page = Math.max(1, Number(p.get("page")) || 1);
    return json({
      items: list.slice((page - 1) * 9, page * 9),
      total: list.length,
      pages: Math.max(1, Math.ceil(list.length / 9)),
    });
  }),
  route("get", "/nfts/:id", ({ params }) => {
    const nft = getDB().nfts.find((n) => n.id === params.id);
    return nft ? json(nft) : error("NFT não encontrado.", 404);
  }),
  route("get", "/favorites", () => json(currentUser()!.favorites), true),
  route(
    "post",
    "/favorites/:id",
    ({ params }) => {
      if (getDB().scenario === "favorite-error")
        return error("Não foi possível salvar o favorito.", 503);
      if (!getDB().nfts.some((n) => n.id === params.id))
        return error("NFT não encontrado", 404);
      const u = currentUser()!;
      if (!u.favorites.includes(String(params.id)))
        u.favorites.push(String(params.id));
      save();
      return json(u.favorites);
    },
    true,
  ),
  route(
    "delete",
    "/favorites/:id",
    ({ params }) => {
      if (getDB().scenario === "favorite-error")
        return error("Não foi possível remover o favorito.", 503);
      const u = currentUser()!;
      u.favorites = u.favorites.filter((id) => id !== params.id);
      save();
      return json(u.favorites);
    },
    true,
  ),
  route("get", "/cart", () => json(cart())),
  route("post", "/cart", async ({ request }) => {
    const line = (await request.json()) as CartLine;
    const nft = getDB().nfts.find((n) => n.id === line.nftId);
    const edition = nft?.editions.find((e) => e.id === line.edition);
    const lines = cart();
    const entry = lines.find(
      (l) => l.nftId === line.nftId && l.edition === line.edition,
    );
    const quantity = (entry?.quantity ?? 0) + line.quantity;
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      !edition ||
      quantity > edition.stock ||
      quantity > nft!.stock
    )
      return error("Quantidade indisponível para esta edição.", 409);
    if (entry) entry.quantity = quantity;
    else lines.push(line);
    setCart(lines);
    return json(lines);
  }),
  route("patch", "/cart", async ({ request }) => {
    const line = (await request.json()) as CartLine;
    const nft = getDB().nfts.find((n) => n.id === line.nftId);
    const edition = nft?.editions.find((e) => e.id === line.edition);
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      !edition ||
      line.quantity > edition.stock ||
      line.quantity > nft!.stock
    )
      return error("Quantidade indisponível.", 409);
    const entry = cart().find(
      (l) => l.nftId === line.nftId && l.edition === line.edition,
    );
    if (!entry) return error("Item não encontrado.", 404);
    entry.quantity = line.quantity;
    setCart(cart());
    return json(cart());
  }),
  route("delete", "/cart", async ({ request }) => {
    const line = (await request.json()) as CartLine;
    setCart(
      cart().filter(
        (l) => l.nftId !== line.nftId || l.edition !== line.edition,
      ),
    );
    return json(cart());
  }),
  route("post", "/quote", async ({ request }) => {
    const { coupon = "" } = (await request.json()) as { coupon: string };
    if (coupon && coupon !== "KURIO10")
      return error(
        coupon === "EXPIRED" ? "Este cupom expirou." : "Cupom inválido.",
        422,
      );
    return json(quote(coupon));
  }),
  route(
    "get",
    "/orders",
    () => json(getDB().orders.filter((o) => o.userId === currentUser()!.id)),
    true,
  ),
  route(
    "post",
    "/orders",
    async ({ request }) => {
      const db = getDB();
      const b = (await request.json()) as {
        quoteId: string;
        walletId: string;
        network: string;
        name: string;
        email: string;
        provider?: string;
        username?: string;
        profileName?: string;
        note?: string;
        referral?: string;
      };
      const key = request.headers.get("Idempotency-Key");
      if (!key) return error("Chave de idempotência obrigatória.", 422);
      const serialized = JSON.stringify(b);
      const attempt = db.attempts[`${currentUser()!.id}:${key}`];
      if (attempt) {
        if (attempt.body !== serialized)
          return error("Chave já utilizada com outro conteúdo.", 409);
        return json(db.orders.find((o) => o.id === attempt.orderId));
      }
      const invalidFields = collectorErrors(b);
      if (Object.keys(invalidFields).length)
        return json(
          {
            message: Object.values(invalidFields).join(" "),
            fields: invalidFields,
          },
          422,
        );
      const wallet = currentUser()!.wallets.find((w) => w.id === b.walletId);
      if (!wallet || wallet.network !== b.network)
        return error("Selecione uma carteira compatível com a rede.", 422);
      if (
        b.provider &&
        !["WalletConnect", "MetaMask", "Coinbase Wallet"].includes(b.provider)
      )
        return error("Selecione um método de pagamento disponível.", 422);

      const previous = db.quotes[b.quoteId];
      if (!previous || previous.expiresAt < Date.now())
        return error("A cotação expirou. Revise os valores novamente.", 409);
      if (db.scenario === "price-change" || db.scenario === "sold-out") {
        const nft = db.nfts.find((n) => n.id === previous.items[0]?.nftId);
        if (nft) {
          nft.version++;
          if (db.scenario === "sold-out") {
            nft.stock = 0;
            nft.editions.forEach((e) => (e.stock = 0));
          } else nft.price = fromWei(toWei(nft.price) + toWei("0.1"));
          emitNFT(nft);
        }
        db.scenario = "standard";
        save();
      }
      const fresh = quote(previous.coupon);
      if (previous.fingerprint !== fresh.fingerprint)
        return error(
          "O preço ou a disponibilidade mudou. Revise e confirme a nova cotação.",
          409,
        );
      if (!fresh.items.length) return error("O carrinho está vazio.", 422);
      const order = {
        id: crypto.randomUUID(),
        userId: currentUser()!.id,
        status: "pending" as const,
        quote: structuredClone(fresh),
        version: 1,
        transaction: `0x${crypto.randomUUID().replaceAll("-", "")}`,
        createdAt: new Date().toISOString(),
        payment: {
          provider: b.provider ?? "WalletConnect",
          network: b.network,
          walletLabel: wallet.label,
          walletAddress: wallet.address,
        },
      };
      db.orders.push(order);
      db.attempts[`${order.userId}:${key}`] = {
        body: serialized,
        orderId: order.id,
      };
      save();
      setTimeout(() => {
        finishOrder(order);
        emitOrder(order);
        order.quote.items.forEach((l) =>
          emitNFT(getDB().nfts.find((n) => n.id === l.nftId)!),
        );
      }, 1800);
      if (db.scenario === "pending-disconnect")
        setTimeout(disconnectClients, 300);
      if (db.scenario === "order-timeout") {
        await delay(4500);
        return HttpResponse.error();
      }
      return json(order, 201);
    },
    true,
  ),
  route(
    "get",
    "/orders/:id",
    ({ params }) => {
      const order = getDB().orders.find((o) => o.id === params.id);
      if (!order) return error("Pedido não encontrado.", 404);
      if (order.userId !== currentUser()!.id)
        return error("Você não tem acesso a este pedido.", 403);
      if (
        order.status === "pending" &&
        Date.now() - Date.parse(order.createdAt) > 1800
      ) {
        finishOrder(order);
        emitOrder(order);
      }
      return json(order);
    },
    true,
  ),
  route("get", "/profile", () => json(publicUser(currentUser()!)), true),
  route(
    "patch",
    "/profile",
    async ({ request }) => {
      const b = (await request.json()) as Partial<User>;
      const u = currentUser()!;
      if (
        !b.name?.trim() ||
        !b.username?.trim() ||
        !/^\S+@\S+\.\S+$/.test(b.email ?? "")
      )
        return error("Confira nome, usuário e e-mail.", 422);
      if (
        getDB().users.some(
          (x) =>
            x.id !== u.id && (x.email === b.email || x.username === b.username),
        )
      )
        return error("E-mail ou usuário já está em uso.", 409);
      if (
        b.avatar &&
        !/^data:image\/(png|jpeg|webp);base64,/.test(b.avatar) &&
        !b.avatar.startsWith("/assets/")
      )
        return error("Avatar inválido.", 422);
      if (b.avatar && b.avatar.length > 1400000)
        return error("Avatar muito grande.", 422);
      for (const k of [
        "name",
        "username",
        "email",
        "ens",
        "walletAlias",
        "avatar",
      ] as const)
        if (b[k] !== undefined) u[k] = b[k]!;
      save();
      return json(publicUser(u));
    },
    true,
  ),
  route(
    "post",
    "/password",
    async ({ request }) => {
      const { currentPassword, password } = (await request.json()) as {
        currentPassword: string;
        password: string;
      };
      const u = currentUser()!;
      if ((await hashPassword(currentPassword)) !== u.passwordHash)
        return error("Senha atual incorreta.", 422);
      if (!/(?=.*[A-Z])(?=.*\d).{8,}/.test(password))
        return error("Use 8 caracteres, maiúscula e número.", 422);
      u.passwordHash = await hashPassword(password);
      save();
      return json({ ok: true });
    },
    true,
  ),
  route("get", "/wallets", () => json(currentUser()!.wallets), true),
  route(
    "post",
    "/wallets/connection",
    async ({ request }) => {
      const body = (await request.json()) as {
        walletId: string;
        network: string;
        provider: string;
        decision: string;
      };
      const wallet = currentUser()!.wallets.find(
        (item) => item.id === body.walletId,
      );
      if (!wallet || wallet.network !== body.network)
        return error(
          "A rede selecionada deve corresponder à rede da carteira.",
          422,
        );
      if (
        !["WalletConnect", "MetaMask", "Coinbase Wallet"].includes(
          body.provider,
        ) ||
        !["connect", "decline", "disconnect"].includes(body.decision)
      )
        return error("Método de conexão inválido.", 422);
      return json({
        status:
          body.decision === "connect"
            ? "connected"
            : body.decision === "decline"
              ? "declined"
              : "idle",
        provider: body.provider,
      });
    },
    true,
  ),
  route(
    "post",
    "/wallets",
    async ({ request }) => {
      const b = (await request.json()) as Wallet;
      const u = currentUser()!;
      if (
        (b.displayName !== undefined && b.displayName.trim().length < 2) ||
        (b.profileName !== undefined && b.profileName.trim().length < 2) ||
        (b.email !== undefined && !/^\S+@\S+\.\S+$/.test(b.email)) ||
        (b.provider !== undefined &&
          !["WalletConnect", "MetaMask", "Coinbase Wallet"].includes(
            b.provider,
          ))
      )
        return error("Confira nome, perfil, e-mail e tipo de carteira.", 422);
      if (
        !b.label?.trim() ||
        !/^0x[a-fA-F0-9]{40}$/.test(b.address) ||
        !["Ethereum", "Polygon", "Solana"].includes(b.network)
      )
        return error(
          "Informe apelido, rede e endereço simulado 0x com 40 caracteres hexadecimais.",
          422,
        );
      if (
        u.wallets.some(
          (w) =>
            w.address.toLowerCase() === b.address.toLowerCase() &&
            w.id !== b.id,
        )
      )
        return error("Carteira já cadastrada.", 409);
      const entry = {
        ...b,
        id: b.id || crypto.randomUUID(),
        primary: b.primary || !u.wallets.length,
      };
      if (entry.primary) u.wallets.forEach((w) => (w.primary = false));
      const index = u.wallets.findIndex((w) => w.id === entry.id);
      if (index >= 0) u.wallets[index] = entry;
      else u.wallets.push(entry);
      save();
      return json(u.wallets);
    },
    true,
  ),
];
