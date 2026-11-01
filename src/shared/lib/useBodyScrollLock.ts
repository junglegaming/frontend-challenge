import { useEffect } from 'react'

let activeLocks = 0
let originalOverflow = ''
let originalPaddingRight = ''

/**
 * Trava o scroll do body enquanto `isLocked` for verdadeiro.
 * Restaura o estilo de overflow anterior ao fechar ou desmontar.
 *
 * @param isLocked - Se o scroll da página deve ser desabilitado.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return

    if (activeLocks === 0) {
      originalOverflow = document.body.style.overflow
      originalPaddingRight = document.body.style.paddingRight

      // Evita salto de layout (layout shift) quando a barra de rolagem é ocultada no desktop
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`
      }

      document.body.style.overflow = 'hidden'
    }
    activeLocks++

    return () => {
      activeLocks--
      if (activeLocks <= 0) {
        activeLocks = 0
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [isLocked])
}
