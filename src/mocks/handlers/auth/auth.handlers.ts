import { http, HttpResponse } from "msw";
import { toUser, type MockUser } from "../../data/users";
import {
  createToken,
  getAuthenticatedUser,
  getUsers,
  hashPassword,
  saveUsers,
} from "./auth.utils";

export const authHandlers = [
  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };

    const users = getUsers();
    const email = body.email.trim().toLowerCase();

    if (users.some((user) => user.email === email)) {
      return HttpResponse.json(
        { message: "Este e-mail já está cadastrado." },
        { status: 409 },
      );
    }

    const user: MockUser = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      username: email.split("@")[0],
      email,
      passwordHash: await hashPassword(body.password),
      avatar: null,
      ensName: "",
      walletName: "",
    };

    users.push(user);
    saveUsers(users);

    return HttpResponse.json(
      {
        user: toUser(user),
        token: createToken(user.id),
      },
      { status: 201 },
    );
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
    };

    const email = body.email.trim().toLowerCase();
    const passwordHash = await hashPassword(body.password);

    const user = getUsers().find(
      (item) => item.email === email && item.passwordHash === passwordHash,
    );

    if (!user) {
      return HttpResponse.json(
        { message: "E-mail ou senha inválidos." },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      user: toUser(user),
      token: createToken(user.id),
    });
  }),

  http.get("/api/auth/session", ({ request }) => {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return HttpResponse.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      user: toUser(user),
    });
  }),

  http.patch("/api/auth/password", async ({ request }) => {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return HttpResponse.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      currentPassword: string;
      newPassword: string;
    };

    if (!body.currentPassword || !body.newPassword) {
      return HttpResponse.json(
        { message: "Informe a senha atual e a nova senha." },
        { status: 400 },
      );
    }

    if (body.newPassword.length < 8) {
      return HttpResponse.json(
        { message: "A nova senha deve ter pelo menos 8 caracteres." },
        { status: 400 },
      );
    }

    if (body.currentPassword === body.newPassword) {
      return HttpResponse.json(
        { message: "A nova senha deve ser diferente da senha atual." },
        { status: 400 },
      );
    }

    const currentPasswordHash = await hashPassword(body.currentPassword);

    if (user.passwordHash !== currentPasswordHash) {
      return HttpResponse.json(
        { message: "A senha atual está incorreta." },
        { status: 400 },
      );
    }

    const newPasswordHash = await hashPassword(body.newPassword);
    const users = getUsers();

    const updatedUsers = users.map((item) =>
      item.id === user.id ? { ...item, passwordHash: newPasswordHash } : item,
    );

    saveUsers(updatedUsers);

    return HttpResponse.json({
      message: "Senha alterada com sucesso.",
    });
  }),

  http.patch("/api/auth/profile", async ({ request }) => {
    const user = getAuthenticatedUser(request);

    if (!user) {
      return HttpResponse.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      name: string;
      username: string;
      email: string;
      ensName: string;
      walletName: string;
      avatar: string | null;
    };

    if (
      !body.name?.trim() ||
      !body.username?.trim() ||
      !body.email?.trim() ||
      !body.walletName?.trim()
    ) {
      return HttpResponse.json(
        { message: "Preencha os campos obrigatórios." },
        { status: 400 },
      );
    }

    const users = getUsers();

    const emailAlreadyExists = users.some(
      (item) =>
        item.id !== user.id &&
        item.email.toLowerCase() === body.email.trim().toLowerCase(),
    );

    if (emailAlreadyExists) {
      return HttpResponse.json(
        { message: "Este e-mail já está sendo utilizado." },
        { status: 409 },
      );
    }

    const usernameAlreadyExists = users.some(
      (item) =>
        item.id !== user.id &&
        item.username.toLowerCase() === body.username.trim().toLowerCase(),
    );

    if (usernameAlreadyExists) {
      return HttpResponse.json(
        { message: "Este nome de usuário já está sendo utilizado." },
        { status: 409 },
      );
    }

    const updatedUsers = users.map((item) =>
      item.id === user.id
        ? {
            ...item,
            name: body.name.trim(),
            username: body.username.trim(),
            email: body.email.trim(),
            ensName: body.ensName.trim(),
            walletName: body.walletName.trim(),
            avatar: body.avatar,
          }
        : item,
    );

    saveUsers(updatedUsers);

    const updatedUser = updatedUsers.find((item) => item.id === user.id);

    if (!updatedUser) {
      return HttpResponse.json(
        { message: "Não foi possível atualizar o perfil." },
        { status: 500 },
      );
    }

    return HttpResponse.json({
      message: "Perfil atualizado com sucesso.",
      user: toUser(updatedUser),
    });
  }),
];
