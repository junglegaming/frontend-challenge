import type { Profile, UpdateProfileRequest } from '@/domains/profile'
import type { Clock } from '../../infra/store'
import { hashPassword, verifyPassword } from '../../infra/password'
import { errors } from '../../http/errors'
import type { UserRecord } from '../../state'
import type { UserRepository } from '../auth/repository'
import { collect, validateEmail, validateName, validatePassword, validateUsername } from '../auth/validation'

const AVATAR = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/
const MAX_AVATAR_BYTES = 1024 * 1024

const toProfile = (user: UserRecord): Profile => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  updatedAt: user.updatedAt,
})

export class ProfileService {
  private readonly users: UserRepository
  private readonly clock: Clock

  constructor(users: UserRepository, clock: Clock) {
    this.users = users
    this.clock = clock
  }

  get(userId: string): Profile {
    return toProfile(this.requireUser(userId))
  }

  update(userId: string, input: UpdateProfileRequest): Profile {
    const fields = collect({
      name: validateName(input.name),
      username: validateUsername(input.username),
      email: validateEmail(input.email),
      bio: input.bio.length <= 280 ? null : 'Use no máximo 280 caracteres.',
    })
    if (Object.keys(fields).length > 0) throw errors.validation(fields)

    const byEmail = this.users.findByEmail(input.email)
    const byUsername = this.users.findByUsername(input.username)
    const conflicts = collect({
      email: byEmail && byEmail.id !== userId ? 'Este e-mail já está em uso.' : null,
      username: byUsername && byUsername.id !== userId ? 'Este nome de usuário já está em uso.' : null,
    })
    if (Object.keys(conflicts).length > 0) throw errors.conflict('Dados já utilizados por outra conta.', conflicts)

    const updated = this.users.update(userId, {
      name: input.name.trim(),
      username: input.username,
      email: input.email.trim().toLowerCase(),
      bio: input.bio.trim(),
      updatedAt: this.now(),
    })
    if (!updated) throw errors.notFound('Usuário')
    return toProfile(updated)
  }

  updateAvatar(userId: string, dataUrl: string): Profile {
    if (!AVATAR.test(dataUrl)) throw errors.validation({ avatar: 'Envie uma imagem PNG, JPEG ou WebP.' })
    const bytes = Math.floor(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4)
    if (bytes > MAX_AVATAR_BYTES) throw errors.validation({ avatar: 'A imagem deve ter no máximo 1 MB.' })
    const updated = this.users.update(userId, { avatarUrl: dataUrl, updatedAt: this.now() })
    if (!updated) throw errors.notFound('Usuário')
    return toProfile(updated)
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = this.requireUser(userId)
    const strength = validatePassword(newPassword)
    if (strength) throw errors.validation({ newPassword: strength })
    if (!(await verifyPassword(currentPassword, user.passwordSalt, user.passwordHash))) {
      throw errors.validation({ currentPassword: 'A senha atual está incorreta.' })
    }
    if (currentPassword === newPassword) {
      throw errors.validation({ newPassword: 'A nova senha deve ser diferente da atual.' })
    }
    const { salt, hash } = await hashPassword(newPassword)
    this.users.update(userId, { passwordSalt: salt, passwordHash: hash, updatedAt: this.now() })
  }

  private requireUser(userId: string) {
    const user = this.users.findById(userId)
    if (!user) throw errors.notFound('Usuário')
    return user
  }

  private now() {
    return new Date(this.clock.now()).toISOString()
  }
}
