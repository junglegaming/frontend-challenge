export type CollectorData = Record<string, string | undefined>;
export const usernamePattern = /^[a-zA-Z0-9._-]{2,30}$/;
export function collectorErrors(data: CollectorData) {
  const errors: Record<string, string> = {};
  if ((data.name?.trim().length ?? 0) < 2)
    errors.name = "Informe o nome completo com pelo menos 2 caracteres.";
  if (!usernamePattern.test(data.username ?? ""))
    errors.username =
      "Use de 2 a 30 caracteres no nome de usuário: letras, números, ponto, hífen ou sublinhado.";
  if ((data.profileName?.trim().length ?? 0) < 2)
    errors.profileName =
      "Informe o nome do perfil com pelo menos 2 caracteres.";
  if (!/^\S+@\S+\.\S+$/.test(data.email ?? ""))
    errors.email = "Informe um e-mail válido.";
  if ((data.note?.length ?? 0) > 500)
    errors.note = "A observação deve ter no máximo 500 caracteres.";
  if ((data.referral?.length ?? 0) > 50)
    errors.referral = "O código de indicação deve ter no máximo 50 caracteres.";
  return errors;
}
