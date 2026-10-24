import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

// Format: scrypt$<salt hex>$<derived key hex>. Plaintext passwords are never stored or logged
// (constitution: "senhas MUST NOT ser armazenadas em claro").
const KEY_LENGTH = 64
const SALT_BYTES = 16

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => (error ? reject(error) : resolve(key)))
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const key = await derive(password, salt)
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split("$")
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false
  const expected = Buffer.from(keyHex, "hex")
  if (expected.length !== KEY_LENGTH) return false
  const actual = await derive(password, Buffer.from(saltHex, "hex"))
  return timingSafeEqual(actual, expected)
}

// Verified against when the e-mail is unknown, so "unknown e-mail" and "wrong password" cost the
// same time and cannot be told apart by timing.
let dummyHash: Promise<string> | undefined
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"))
  return dummyHash
}
