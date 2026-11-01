import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useBodyScrollLock } from './useBodyScrollLock'

describe('useBodyScrollLock', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  it('não altera o estilo quando isLocked for falso', () => {
    document.body.style.overflow = 'visible'
    renderHook(() => useBodyScrollLock(false))
    expect(document.body.style.overflow).toBe('visible')
  })

  it('aplica overflow: hidden no body quando isLocked for verdadeiro e restaura ao desmontar', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = renderHook(() => useBodyScrollLock(true))
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('restaura o overflow quando isLocked muda de true para false', () => {
    document.body.style.overflow = 'scroll'
    const { rerender } = renderHook(({ locked }) => useBodyScrollLock(locked), {
      initialProps: { locked: true },
    })
    expect(document.body.style.overflow).toBe('hidden')

    rerender({ locked: false })
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('gerencia múltiplos bloqueios concorrentes corretamente', () => {
    document.body.style.overflow = ''
    const hook1 = renderHook(() => useBodyScrollLock(true))
    const hook2 = renderHook(() => useBodyScrollLock(true))

    expect(document.body.style.overflow).toBe('hidden')

    hook1.unmount()
    // Ainda há um hook ativo
    expect(document.body.style.overflow).toBe('hidden')

    hook2.unmount()
    // Todos desmontados, restaura
    expect(document.body.style.overflow).toBe('')
  })
})
