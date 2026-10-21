import type { Store } from '../../infra/store'
import type { MockState, SessionRecord, UserRecord } from '../../state'

export class UserRepository {
  private readonly store: Store<MockState>

  constructor(store: Store<MockState>) {
    this.store = store
  }

  findById(id: string) {
    return this.store.read((s) => s.users.find((u) => u.id === id) ?? null)
  }

  findByEmail(email: string) {
    const normalized = email.trim().toLowerCase()
    return this.store.read((s) => s.users.find((u) => u.email === normalized) ?? null)
  }

  findByUsername(username: string) {
    return this.store.read((s) => s.users.find((u) => u.username === username) ?? null)
  }

  insert(user: UserRecord) {
    this.store.write((s) => {
      s.users.push(user)
    })
  }

  update(id: string, patch: Partial<Omit<UserRecord, 'id'>>) {
    return this.store.write((s) => {
      const user = s.users.find((u) => u.id === id)
      if (!user) return null
      Object.assign(user, patch)
      return { ...user }
    })
  }
}

export class SessionRepository {
  private readonly store: Store<MockState>

  constructor(store: Store<MockState>) {
    this.store = store
  }

  find(token: string) {
    return this.store.read((s) => s.sessions.find((session) => session.token === token) ?? null)
  }

  insert(session: SessionRecord) {
    this.store.write((s) => {
      s.sessions.push(session)
    })
  }

  touch(token: string, expiresAt: number) {
    this.store.write((s) => {
      const session = s.sessions.find((x) => x.token === token)
      if (session) session.expiresAt = expiresAt
    })
  }

  delete(token: string) {
    this.store.write((s) => {
      s.sessions = s.sessions.filter((x) => x.token !== token)
    })
  }

  /** Marks every session as expired (they still exist, so the API answers SESSION_EXPIRED). */
  expireAll(now: number) {
    this.store.write((s) => {
      s.sessions.forEach((session) => {
        session.expiresAt = Math.min(session.expiresAt, now - 1)
      })
    })
  }
}
