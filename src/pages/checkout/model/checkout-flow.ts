import type { Quote } from '@/domains/cart'
import type { QuoteChange } from './quote-diff'

/**
 * Checkout steps (specs/003-checkout-payment/data-model.md). Pure reducer: every transition the
 * page can make lives here, so "changing the wallet invalidates the review" is a rule, not a hope.
 */
export type CheckoutState =
  | { step: 'form' }
  | { step: 'review'; reviewedQuote: Quote; change: QuoteChange | null; error: string | null }
  | { step: 'submitting'; reviewedQuote: Quote }
  | { step: 'pending'; orderId: string }
  | { step: 'declined'; orderId: string; reason: string }

export type CheckoutAction =
  | { type: 'NEXT'; quote: Quote }
  | { type: 'BACK' }
  | { type: 'WALLET_CHANGED' }
  | { type: 'NETWORK_CHANGED' }
  | { type: 'WALLET_DISCONNECTED' }
  | { type: 'CONFIRM' }
  | { type: 'QUOTE_CHANGED'; change: QuoteChange | null; quote: Quote }
  | { type: 'SUBMIT_FAILED'; message: string }
  | { type: 'ORDER_CREATED'; orderId: string }
  | { type: 'ORDER_CONFIRMED' }
  | { type: 'ORDER_DECLINED'; reason: string }
  | { type: 'RETRY' }
  | { type: 'RESUME_PENDING'; orderId: string }

export const initialCheckoutState: CheckoutState = { step: 'form' }

export function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'NEXT':
      return state.step === 'form' ? { step: 'review', reviewedQuote: action.quote, change: null, error: null } : state

    case 'BACK':
    case 'WALLET_CHANGED':
    case 'NETWORK_CHANGED':
    case 'WALLET_DISCONNECTED':
      return state.step === 'review' ? { step: 'form' } : state

    case 'CONFIRM':
      return state.step === 'review' ? { step: 'submitting', reviewedQuote: state.reviewedQuote } : state

    case 'QUOTE_CHANGED':
      if (state.step !== 'review' && state.step !== 'submitting') return state
      return {
        step: 'review',
        reviewedQuote: action.quote,
        change: action.change ?? (state.step === 'review' ? state.change : null),
        error: null,
      }

    case 'SUBMIT_FAILED':
      return state.step === 'submitting'
        ? { step: 'review', reviewedQuote: state.reviewedQuote, change: null, error: action.message }
        : state

    case 'ORDER_CREATED':
      return state.step === 'submitting' ? { step: 'pending', orderId: action.orderId } : state

    case 'RESUME_PENDING':
      return state.step === 'form' ? { step: 'pending', orderId: action.orderId } : state

    // Terminal outcomes only ever leave `pending`: duplicated or late events cannot regress them.
    case 'ORDER_CONFIRMED':
      return state
    case 'ORDER_DECLINED':
      return state.step === 'pending' ? { step: 'declined', orderId: state.orderId, reason: action.reason } : state

    case 'RETRY':
      return state.step === 'declined' ? { step: 'form' } : state
  }
}
