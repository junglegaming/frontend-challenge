import { http, HttpResponse, delay, ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";
import { db, save, reset, hash } from "./database";
import {
  eth,
  wei,
  type Cart,
  type Order,
  type Quote,
  type Scenario,
  type Collector,
  type CartItem,
} from "../domain";
// MSW normalizes the Socket.IO transport path to the server origin.
const live = ws.link(window.location.origin.replace(/^http/, "ws"));
type Peer = { emit: (name: string, data: unknown) => void; close: () => void };
const peers = new Map<Peer, string>();
export function emit(name: string, data: unknown, userId?: string) {
  for (const [peer, owner] of peers) {
    if (!userId || owner === userId) peer.emit(name, data);
  }
}
const error = (
  message: string,
  status = 400,
  fields?: Record<string, string>,
) => HttpResponse.json({ message, fields }, { status });
function user() {
  return db.users.find((u) => u.id === db.session && db.expires > Date.now());
}
function cart(): Cart {
  const id = user()?.id;
  return id ? (db.carts[id] ??= { items: [], coupon: "" }) : db.guest;
}
function quote(): Quote {
  const c = cart();
  const items = c.items.map((item) => {
    const nft = db.nfts.find((n) => n.id === item.id)!;
    return { ...item, name: nft.name, price: nft.price, image: nft.image };
  });
  const subtotal = items.reduce(
    (sum, item) => sum + wei(item.price) * BigInt(item.quantity),
    0n,
  );
  const discount = c.coupon === "JUNGLE10" ? subtotal / 10n : 0n;
  const fee = subtotal ? wei("0.002") : 0n;
  return {
    items,
    subtotal: eth(subtotal),
    discount: eth(discount),
    fee: eth(fee),
    total: eth(subtotal - discount + fee),
    coupon: c.coupon,
    fingerprint: JSON.stringify({
      items: items.map((i) => ({
        ...i,
        version: db.nfts.find((n) => n.id === i.id)?.version,
      })),
      coupon: c.coupon,
      total: eth(subtotal - discount + fee),
    }),
  };
}
function unavailable(items: CartItem[]) {
  return items.some((item) => {
    const nft = db.nfts.find((n) => n.id === item.id);
    return (
      !nft ||
      item.quantity > (nft.editionStock?.[item.edition] ?? nft.stock) ||
      items
        .filter((i) => i.id === item.id)
        .reduce((sum, i) => sum + i.quantity, 0) > nft.stock
    );
  });
}
function finish(order: Order) {
  if (order.status !== "pending" || !db.orders.some((o) => o.id === order.id))
    return;
  order.status =
    order.outcome === "refused" || unavailable(order.quote.items)
      ? "refused"
      : "confirmed";
  order.version++;
  if (order.status === "confirmed") {
    const c = db.carts[order.userId];
    for (const item of order.quote.items) {
      const nft = db.nfts.find((n) => n.id === item.id)!;
      nft.stock -= item.quantity;
      if (nft.editionStock) nft.editionStock[item.edition] -= item.quantity;
      nft.version++;
      if (c) {
        const owned = c.items.find(
          (i) => i.id === item.id && i.edition === item.edition,
        );
        if (owned) owned.quantity = Math.max(0, owned.quantity - item.quantity);
      }
      emit("nft.updated", { eventId: crypto.randomUUID(), ...nft });
    }
    if (c) c.items = c.items.filter((i) => i.quantity > 0);
  }
  save();
  emit(
    "order.updated",
    { eventId: crypto.randomUUID(), ...order },
    order.userId,
  );
}
function tick() {
  for (const o of db.orders) {
    if (
      o.status === "pending" &&
      Date.now() >= (o.settlesAt || Date.parse(o.createdAt) + 2000)
    )
      finish(o);
  }
}
const api = http.all("/api/*", async ({ request }) => {
  const url = new URL(request.url),
    path = url.pathname.slice(4),
    method = request.method;
  if (path === "/demo/reset") {
    const body = (await request.json()) as { scenario: Scenario };
    reset(body.scenario);
    return HttpResponse.json({ ok: true });
  }
  if (path === "/demo/scenario") {
    const { scenario } = (await request.json()) as { scenario: Scenario };
    db.scenario = scenario;
    save();
    return HttpResponse.json({ ok: true });
  }
  if (path === "/demo/event") {
    const { id, kind, duplicate, old } = (await request.json()) as {
      id: string;
      kind: string;
      duplicate?: boolean;
      old?: boolean;
    };
    const nft = db.nfts.find((n) => n.id === id) || db.nfts[0];
    if (kind === "expire") {
      db.expires = 0;
      save();
      return HttpResponse.json({ ok: true });
    }
    if (kind === "disconnect") {
      for (const peer of peers.keys()) peer.close();
      peers.clear();
      return HttpResponse.json({ ok: true });
    }
    if (!old) {
      nft.version++;
      if (kind === "stock") nft.stock = 0;
      else nft.price = eth(wei(nft.price) + wei("0.1"));
      save();
    }
    const event = {
      ...nft,
      eventId: crypto.randomUUID(),
      version: old ? nft.version - 1 : nft.version,
    };
    emit("nft.updated", event);
    if (duplicate) emit("nft.updated", event);
    return HttpResponse.json(event);
  }
  if (db.scenario === "slow") await delay(1800);
  else if (db.scenario === "variable")
    await delay(url.searchParams.get("q")?.length === 1 ? 1200 : 100);
  else await delay(120);
  if (db.scenario === "offline") return HttpResponse.error();
  if (db.scenario === "server-error")
    return error("Serviço temporariamente indisponível. Tente novamente.", 503);
  if (db.scenario === "expired") {
    db.expires = 0;
    save();
  }
  tick();
  if (path === "/nfts" && method === "GET") {
    let items = [...db.nfts];
    const q = (url.searchParams.get("q") || "").toLowerCase();
    if (q)
      items = items.filter((n) =>
        (n.name + " " + n.artist).toLowerCase().includes(q),
      );
    for (const key of ["category", "artist"] as const) {
      const value = url.searchParams.get(key);
      if (value) items = items.filter((n) => n[key] === value);
    }
    if (url.searchParams.get("available") === "true")
      items = items.filter((n) => n.stock > 0);
    const sort = url.searchParams.get("sort");
    if (sort === "price-asc" || sort === "price-desc")
      items.sort(
        (a, b) =>
          (wei(a.price) > wei(b.price) ? 1 : -1) *
          (sort === "price-asc" ? 1 : -1),
      );
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    return HttpResponse.json({
      items: items.slice((page - 1) * 8, page * 8),
      total: items.length,
      page,
      pages: Math.ceil(items.length / 8),
    });
  }
  if (path.startsWith("/nfts/"))
    return HttpResponse.json(
      db.nfts.find((n) => n.id === path.split("/")[2]) || {
        message: "NFT não encontrado",
      },
      { status: db.nfts.some((n) => n.id === path.split("/")[2]) ? 200 : 404 },
    );
  if (path === "/session" && method === "GET")
    return HttpResponse.json({ user: user() || null });
  if (path === "/auth/logout") {
    db.session = null;
    db.expires = 0;
    save();
    return HttpResponse.json({ ok: true });
  }
  if (path === "/auth/login" || path === "/auth/register") {
    const body = (await request.json()) as Record<string, string>;
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || "") ||
      !body.password ||
      body.password.length < 8
    )
      return error("Revise os campos.", 422, {
        email: "Informe um e-mail válido.",
        password: "Use pelo menos 8 caracteres.",
      });
    let account = db.users.find(
      (u) => u.email.toLowerCase() === body.email.toLowerCase(),
    );
    if (path.endsWith("register")) {
      if (account)
        return error("Este e-mail já está cadastrado.", 409, {
          email: "E-mail já cadastrado.",
        });
      if (!body.name?.trim()) return error("Informe seu nome.", 422);
      account = {
        id: crypto.randomUUID(),
        name: body.name,
        email: body.email,
        avatar: "",
        wallets: [],
        favorites: [],
      };
      db.users.push(account);
      db.hashes[account.id] = await hash(body.password);
    } else if (
      !account ||
      (await hash(body.password)) !==
        (db.hashes[account.id] || (await hash("Jungle123!")))
    )
      return error("E-mail ou senha incorretos.", 401);
    db.session = account!.id;
    db.expires = Date.now() + 60 * 60 * 1000;
    const c = (db.carts[account!.id] ??= { items: [], coupon: "" });
    for (const item of db.guest.items) {
      const existing = c.items.find(
        (i) => i.id === item.id && i.edition === item.edition,
      );
      const nft = db.nfts.find((n) => n.id === item.id)!;
      const max = Math.max(
        0,
        Math.min(
          nft.editionStock?.[item.edition] ?? nft.stock,
          nft.stock -
            c.items
              .filter((i) => i.id === item.id && i.edition !== item.edition)
              .reduce((sum, i) => sum + i.quantity, 0),
        ),
      );
      if (existing)
        existing.quantity = Math.min(max, existing.quantity + item.quantity);
      else c.items.push({ ...item, quantity: Math.min(max, item.quantity) });
    }
    db.guest = { items: [], coupon: "" };
    c.items = c.items.filter((i) => i.quantity > 0);
    save();
    return HttpResponse.json({ user: account });
  }
  if (path === "/cart" && method === "GET") return HttpResponse.json(cart());
  if (path === "/cart" && method !== "GET") {
    const body = (await request.json()) as {
      id: string;
      edition: string;
      quantity: number;
      coupon?: string;
    };
    const c = cart();
    if ("coupon" in body) {
      const code = body.coupon!.trim().toUpperCase();
      if (code && code !== "JUNGLE10")
        return error(
          code === "EXPIRED" ? "Cupom expirado." : "Cupom inválido.",
          422,
        );
      c.coupon = code;
    } else {
      const nft = db.nfts.find((n) => n.id === body.id);
      if (!nft) return error("NFT não encontrado.", 404);
      if (
        !Number.isInteger(body.quantity) ||
        body.quantity < 0 ||
        body.quantity > nft.stock ||
        body.quantity > (nft.editionStock?.[body.edition] ?? nft.stock) ||
        (body.quantity > 0 &&
          body.quantity +
            c.items
              .filter((i) => i.id === body.id && i.edition !== body.edition)
              .reduce((sum, i) => sum + i.quantity, 0) >
            nft.stock) ||
        !nft.editions.includes(body.edition)
      )
        return error("Quantidade ou edição indisponível.", 409);
      c.items = c.items.filter(
        (i) => !(i.id === body.id && i.edition === body.edition),
      );
      if (body.quantity)
        c.items.push({
          id: body.id,
          edition: body.edition,
          quantity: body.quantity,
        });
    }
    save();
    return HttpResponse.json(c);
  }
  if (path === "/quote") {
    if (unavailable(cart().items))
      return error("Uma edição esgotou. Atualize seu carrinho.", 409);
    return HttpResponse.json(quote());
  }
  const account = user();
  if (!account)
    return error("Sua sessão expirou. Entre novamente para continuar.", 401);
  if (path === "/favorites") {
    if (method === "GET") return HttpResponse.json(account.favorites);
    if (db.scenario === "favorite-error")
      return error("Não foi possível salvar o favorito.", 503);
    const { id } = (await request.json()) as { id: string };
    if (!db.nfts.some((n) => n.id === id))
      return error("NFT não encontrado.", 404);
    account.favorites = account.favorites.includes(id)
      ? account.favorites.filter((x) => x !== id)
      : [...account.favorites, id];
    save();
    return HttpResponse.json(account.favorites);
  }
  if (path === "/profile") {
    if (method === "GET") return HttpResponse.json(account);
    const body = (await request.json()) as Record<string, string>;
    if (body.password) {
      if (
        (await hash(body.currentPassword)) !==
        (db.hashes[account.id] || (await hash("Jungle123!")))
      )
        return error("Senha atual incorreta.", 422, {
          currentPassword: "Senha incorreta.",
        });
      if (body.password.length < 8)
        return error("Use ao menos 8 caracteres.", 422);
      db.hashes[account.id] = await hash(body.password);
    } else {
      if (!body.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
        return error("Nome e e-mail válidos são obrigatórios.", 422);
      if (db.users.some((u) => u.id !== account.id && u.email === body.email))
        return error("E-mail já utilizado.", 409);
      if (
        body.avatar &&
        !/^data:image\/(png|jpeg|webp);base64,/.test(body.avatar)
      )
        return error("Formato de avatar inválido.", 422);
      Object.assign(account, {
        name: body.name,
        email: body.email,
        avatar: body.avatar || "",
      });
    }
    save();
    return HttpResponse.json(account);
  }
  if (path === "/wallets") {
    if (method === "GET") return HttpResponse.json(account.wallets);
    const body = (await request.json()) as {
      id: string;
      name: string;
      address: string;
      network: string;
      primary: boolean;
    };
    if (
      !body.name?.trim() ||
      !/^0x[a-fA-F0-9]{40}$/.test(body.address) ||
      !["Ethereum", "Polygon"].includes(body.network)
    )
      return error(
        "Informe nome, rede e endereço válido (0x + 40 caracteres hexadecimais).",
        422,
      );
    if (
      account.wallets.some(
        (w) => w.address === body.address && w.id !== body.id,
      )
    )
      return error("Carteira já cadastrada.", 409);
    if (body.primary) account.wallets.forEach((w) => (w.primary = false));
    const index = account.wallets.findIndex((w) => w.id === body.id);
    const wallet = { ...body, id: body.id || crypto.randomUUID() };
    if (index >= 0) account.wallets[index] = wallet;
    else account.wallets.push(wallet);
    save();
    return HttpResponse.json(account.wallets);
  }
  if (path === "/orders" && method === "POST") {
    const body = (await request.json()) as {
      fingerprint: string;
      walletId: string;
      network: string;
      collector: Collector;
    };
    const key = account.id + ":" + request.headers.get("Idempotency-Key");
    if (!request.headers.get("Idempotency-Key"))
      return error("Chave de idempotência obrigatória.", 422);
    const cached = db.keys[key];
    if (cached) {
      if (cached.body !== JSON.stringify(body))
        return error("Chave já utilizada em outra compra.", 409);
      return HttpResponse.json(db.orders.find((o) => o.id === cached.order));
    }
    if (db.scenario === "price-change" || db.scenario === "sold-out") {
      const nft = db.nfts.find((n) => n.id === cart().items[0]?.id);
      if (nft) {
        nft.version++;
        if (db.scenario === "sold-out") nft.stock = 0;
        else nft.price = eth(wei(nft.price) + wei("0.1"));
        emit("nft.updated", { ...nft, eventId: crypto.randomUUID() });
      }
      db.scenario = "standard";
      save();
      return error(
        "Preço ou disponibilidade alterados. Revise a nova cotação.",
        409,
      );
    }
    const q = quote();
    if (
      !body.collector?.name?.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.collector?.email || "") ||
      !body.collector?.country ||
      !body.collector?.phone?.match(/^[+0-9 ()-]{8,20}$/)
    )
      return error("Revise os dados do colecionador.", 422);
    if (!q.items.length) return error("Seu carrinho está vazio.", 422);
    if (q.fingerprint !== body.fingerprint)
      return error(
        "Cotação desatualizada. Revise os valores e confirme novamente.",
        409,
      );
    if (unavailable(q.items)) return error("Edição indisponível.", 409);
    const wallet = account.wallets.find(
      (w) => w.id === body.walletId && w.network === body.network,
    );
    if (!wallet)
      return error("Selecione uma carteira compatível com a rede.", 422);
    const order: Order = {
      id: crypto.randomUUID(),
      userId: account.id,
      status: "pending",
      quote: structuredClone(q),
      wallet: structuredClone(wallet),
      collector: structuredClone(body.collector),
      createdAt: new Date().toISOString(),
      settlesAt: Date.now() + (db.scenario === "order-pending" ? 8000 : 2000),
      outcome: db.scenario === "payment-refused" ? "refused" : "confirmed",
      transaction: "0x" + crypto.randomUUID().replaceAll("-", ""),
      version: 1,
    };
    db.orders.push(order);
    db.keys[key] = { body: JSON.stringify(body), order: order.id };
    save();
    setTimeout(() => finish(order), order.settlesAt - Date.now());
    if (db.scenario === "order-timeout") {
      await delay(12000);
    }
    return HttpResponse.json(order, { status: 201 });
  }
  if (path.startsWith("/orders/")) {
    const order = db.orders.find(
      (o) => o.id === path.split("/")[2] && o.userId === account.id,
    );
    return order
      ? HttpResponse.json(order)
      : error("Pedido não encontrado.", 404);
  }
  return error("Recurso não encontrado.", 404);
});
export const handlers = [
  api,
  live.addEventListener("connection", (connection) => {
    const bound = toSocketIo(connection);
    const heartbeat = setInterval(() => connection.client.send("2"), 20000);
    const peer: Peer = {
      emit: (name, data) => bound.client.emit(name, data),
      close: () => connection.client.close(1011, "Simulated connection loss"),
    };
    bound.client.on("subscribe", (_event, payload) => {
      const owner = user()?.id || "guest";
      if ((payload || "guest") === owner) {
        peers.set(peer, owner);
        tick();
      }
    });
    connection.client.addEventListener("close", () => {
      clearInterval(heartbeat);
      peers.delete(peer);
    });
  }),
];
