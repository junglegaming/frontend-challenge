import { describe, expect, it } from 'vitest'

import {
  changePasswordRequestSchema,
  createWalletRequestSchema,
  updateProfileRequestSchema,
} from './account'

/** Primeira mensagem de erro de um campo, para checar o texto exibido na UI. */
function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message
}

describe('mensagens de validação de conta em pt-BR', () => {
  it('valida o nome do perfil', () => {
    const empty = updateProfileRequestSchema.safeParse({ name: '', avatarUrl: null })
    expect(firstMessage(empty)).toBe('Nome é obrigatório')

    const short = updateProfileRequestSchema.safeParse({ name: 'a', avatarUrl: null })
    expect(firstMessage(short)).toBe('Nome deve ter no mínimo 2 caracteres')
  })

  it('valida a troca de senha', () => {
    const missingCurrent = changePasswordRequestSchema.safeParse({
      currentPassword: '',
      newPassword: 'segredo123',
    })
    expect(firstMessage(missingCurrent)).toBe('Senha atual é obrigatória')

    const shortNew = changePasswordRequestSchema.safeParse({
      currentPassword: 'atual123',
      newPassword: '123',
    })
    expect(firstMessage(shortNew)).toBe('Nova senha deve ter no mínimo 6 caracteres')
  })

  it('valida os dados da carteira', () => {
    const missingNetwork = createWalletRequestSchema.safeParse({
      address: `0x${'a'.repeat(40)}`,
      network: '',
      label: 'Principal',
      provider: 'metamask',
      ensName: null,
      referralCode: null,
    })
    expect(firstMessage(missingNetwork)).toBe('Rede é obrigatória')

    const shortLabel = createWalletRequestSchema.safeParse({
      address: `0x${'a'.repeat(40)}`,
      network: 'Ethereum',
      label: 'a',
      provider: 'metamask',
      ensName: null,
      referralCode: null,
    })
    expect(firstMessage(shortLabel)).toBe('Apelido deve ter no mínimo 2 caracteres')
  })
})
