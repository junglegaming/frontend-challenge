/**
 * Simulated backend password storage: PBKDF2-SHA256 with a per-user salt.
 * The mock DB (persisted in localStorage) never contains plaintext passwords.
 */
const ITERATIONS = 60_000

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('')

async function derive(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: ITERATIONS },
    key,
    256,
  )
  return toHex(bits)
}

export async function hashPassword(password: string) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer)
  return { salt, hash: await derive(password, salt) }
}

export async function verifyPassword(password: string, salt: string, hash: string) {
  return (await derive(password, salt)) === hash
}
