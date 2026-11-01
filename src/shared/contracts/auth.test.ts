import { describe, expect, it } from 'vitest'

import { loginRequestSchema, registerRequestSchema } from './auth'

describe('loginRequestSchema', () => {
  it('valida mensagens de erro em português para campos vazios', () => {
    const result = loginRequestSchema.safeParse({ email: '', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('E-mail é obrigatório')
      expect(messages).toContain('Senha é obrigatória')
    }
  })

  it('valida formato de e-mail inválido em português', () => {
    const result = loginRequestSchema.safeParse({ email: 'invalido', password: '123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path.includes('email'))
      expect(emailIssue?.message).toBe('E-mail inválido')
    }
  })

  it('aceita credenciais válidas', () => {
    const result = loginRequestSchema.safeParse({
      email: 'usuario@kurio.test',
      password: 'senhaSegura123',
    })
    expect(result.success).toBe(true)
  })
})

describe('registerRequestSchema', () => {
  it('valida mensagens de campos obrigatórios em português quando vazios', () => {
    const result = registerRequestSchema.safeParse({ name: '', email: '', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Nome é obrigatório')
      expect(messages).toContain('E-mail é obrigatório')
      expect(messages).toContain('Senha é obrigatória')
    }
  })

  it('valida comprimento mínimo e formato com mensagens em português', () => {
    const result = registerRequestSchema.safeParse({
      name: 'A',
      email: 'not-an-email',
      password: '123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path.includes('name'))
      const emailIssue = result.error.issues.find((i) => i.path.includes('email'))
      const passwordIssue = result.error.issues.find((i) => i.path.includes('password'))

      expect(nameIssue?.message).toBe('Nome deve ter no mínimo 2 caracteres')
      expect(emailIssue?.message).toBe('E-mail inválido')
      expect(passwordIssue?.message).toBe('Senha deve ter no mínimo 6 caracteres')
    }
  })

  it('aceita dados válidos de cadastro', () => {
    const result = registerRequestSchema.safeParse({
      name: 'Colecionador Teste',
      email: 'colecionador@kurio.test',
      password: 'senhaForte123',
    })
    expect(result.success).toBe(true)
  })
})
