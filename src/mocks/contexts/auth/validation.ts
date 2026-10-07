/** Server-side validation rules shared by signup and profile (the API is the source of truth). */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const USERNAME = /^[a-z0-9_]{3,20}$/
const RESERVED_USERNAMES = new Set(['admin', 'root', 'suporte', 'support', 'nft'])

export function validateName(name: string) {
  const trimmed = name.trim()
  if (trimmed.length < 3) return 'Informe pelo menos 3 caracteres.'
  if (trimmed.length > 60) return 'Use no máximo 60 caracteres.'
  return null
}

export function validateEmail(email: string) {
  if (!EMAIL.test(email.trim())) return 'Informe um e-mail válido.'
  return null
}

export function validateUsername(username: string) {
  if (!USERNAME.test(username)) return 'Use de 3 a 20 caracteres: letras minúsculas, números ou _.'
  if (RESERVED_USERNAMES.has(username)) return 'Este nome de usuário é reservado.'
  return null
}

export function validatePassword(password: string) {
  if (password.length < 8) return 'A senha precisa de pelo menos 8 caracteres.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use letras e números na senha.'
  return null
}

/** Collects non-null messages into the `fields` map of a VALIDATION_ERROR. */
export function collect(checks: Record<string, string | null>) {
  return Object.fromEntries(Object.entries(checks).filter((entry): entry is [string, string] => entry[1] !== null))
}
