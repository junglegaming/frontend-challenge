import type { LoginRequest, Session, SessionUser, SignupRequest } from '@/domains/auth'
import type { Clock } from '../../infra/store'
import { hashPassword, verifyPassword } from '../../infra/password'
import { randomHex, randomId } from '../../infra/random'
import { errors } from '../../http/errors'
import type { UserRecord } from '../../state'
import type { SessionRepository, UserRepository } from './repository'
import { collect, validateEmail, validateName, validatePassword, validateUsername } from './validation'

export interface Identity {
  userId: string
  token: string
}

export const toSessionUser = (user: UserRecord): SessionUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  avatarUrl: user.avatarUrl,
})

export class AuthService {
  private readonly users: UserRepository
  private readonly sessions: SessionRepository
  private readonly clock: Clock
  private readonly sessionTtlMs: () => number

  constructor(users: UserRepository, sessions: SessionRepository, clock: Clock, sessionTtlMs: () => number) {
    this.users = users
    this.sessions = sessions
    this.clock = clock
    this.sessionTtlMs = sessionTtlMs
  }

  async signup(input: SignupRequest): Promise<Session> {
    const fields = collect({
      name: validateName(input.name),
      username: validateUsername(input.username),
      email: validateEmail(input.email),
      password: validatePassword(input.password),
    })
    if (Object.keys(fields).length > 0) throw errors.validation(fields)

    const conflicts = collect({
      email: this.users.findByEmail(input.email) ? 'Este e-mail já está cadastrado.' : null,
      username: this.users.findByUsername(input.username) ? 'Este nome de usuário já está em uso.' : null,
    })
    if (Object.keys(conflicts).length > 0) throw errors.conflict('Já existe uma conta com estes dados.', conflicts)

    const { salt, hash } = await hashPassword(input.password)
    const user: UserRecord = {
      id: randomId('usr'),
      name: input.name.trim(),
      username: input.username,
      email: input.email.trim().toLowerCase(),
      bio: '',
      avatarUrl: null,
      passwordSalt: salt,
      passwordHash: hash,
      updatedAt: new Date(this.clock.now()).toISOString(),
    }
    this.users.insert(user)
    return this.openSession(user)
  }

  async login(input: LoginRequest): Promise<Session> {
    const fields = collect({
      email: validateEmail(input.email),
      password: input.password ? null : 'Informe a senha.',
    })
    if (Object.keys(fields).length > 0) throw errors.validation(fields)

    const user = this.users.findByEmail(input.email)
    if (!user || !(await verifyPassword(input.password, user.passwordSalt, user.passwordHash))) {
      throw errors.invalidCredentials()
    }
    return this.openSession(user)
  }

  logout(token: string) {
    this.sessions.delete(token)
  }

  /** Validates a bearer token and slides its expiration. Throws UNAUTHENTICATED / SESSION_EXPIRED. */
  authenticate(token: string | null): Identity {
    if (!token) throw errors.unauthenticated()
    const session = this.sessions.find(token)
    if (!session) throw errors.unauthenticated()
    const now = this.clock.now()
    if (session.expiresAt <= now) {
      this.sessions.delete(token)
      throw errors.sessionExpired()
    }
    this.sessions.touch(token, now + this.sessionTtlMs())
    return { userId: session.userId, token }
  }

  /** Non-throwing variant used by the Socket.IO handshake. */
  resolveUserId(token: string | null) {
    if (!token) return null
    const session = this.sessions.find(token)
    return session && session.expiresAt > this.clock.now() ? session.userId : null
  }

  currentSession(identity: Identity): Session {
    const user = this.users.findById(identity.userId)
    const session = this.sessions.find(identity.token)
    if (!user || !session) throw errors.unauthenticated()
    return { token: session.token, user: toSessionUser(user), expiresAt: new Date(session.expiresAt).toISOString() }
  }

  expireAllSessions() {
    this.sessions.expireAll(this.clock.now())
  }

  private openSession(user: UserRecord): Session {
    const now = this.clock.now()
    const token = `tok_${randomHex(24)}`
    const expiresAt = now + this.sessionTtlMs()
    this.sessions.insert({ token, userId: user.id, createdAt: now, expiresAt })
    return { token, user: toSessionUser(user), expiresAt: new Date(expiresAt).toISOString() }
  }
}
