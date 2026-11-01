import { type RefObject, useEffect } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Mantém o foco do teclado dentro de um diálogo ou drawer.
 *
 * O primeiro elemento focável recebe o foco ao abrir, Tab e Shift+Tab circulam
 * apenas dentro do container e o foco anterior é restaurado ao fechar.
 *
 * @param ref - Referência para o container do diálogo.
 * @param active - Se o trap está ativo.
 * @example
 * const ref = useRef<HTMLDivElement>(null)
 * useFocusTrap(ref, isOpen)
 */
export function useFocusTrap<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
): void {
  useEffect(() => {
    const container = ref.current
    if (!active || !container) return

    const node = container
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    function focusableElements(): HTMLElement[] {
      return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.getAttribute('aria-hidden') !== 'true',
      )
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return
      const elements = focusableElements()
      if (elements.length === 0) {
        event.preventDefault()
        node.focus()
        return
      }

      const first = elements[0]!
      const last = elements[elements.length - 1]!
      const activeElement = document.activeElement

      if (event.shiftKey && (activeElement === first || activeElement === node)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    focusableElements()[0]?.focus()
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [active, ref])
}
