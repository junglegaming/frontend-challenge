import { http } from 'msw/core/http'

import { json } from '../http'
import { errorResponse } from '../utils'

const SUBSCRIBED_EMAILS = new Set<string>(['duplicado@kurio.test', 'cadastrado@kurio.test'])

export const newsletterHandlers = [
  http.post('/api/newsletter/subscribe', async ({ request }) => {
    let body: { email?: string }
    try {
      body = (await request.json()) as { email?: string }
    } catch {
      return errorResponse('INVALID_BODY', 'Corpo da requisição inválido', 400)
    }

    const email = body.email?.trim()

    if (!email) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Informe seu e-mail para assinar a newsletter',
        422,
        {
          email: 'E-mail é obrigatório',
        },
      )
    }

    // Basic RFC 5322 regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return errorResponse('VALIDATION_ERROR', 'Formato de e-mail inválido', 422, {
        email: 'Insira um e-mail válido',
      })
    }

    if (email === 'erro@kurio.test' || email === 'falha@kurio.test') {
      return errorResponse(
        'SERVER_ERROR',
        'Não foi possível registrar o e-mail no momento. Tente novamente mais tarde.',
        500,
      )
    }

    if (SUBSCRIBED_EMAILS.has(email.toLowerCase())) {
      return errorResponse(
        'ALREADY_SUBSCRIBED',
        'Este e-mail já está cadastrado na nossa newsletter',
        409,
        {
          email: 'E-mail já cadastrado',
        },
      )
    }

    SUBSCRIBED_EMAILS.add(email.toLowerCase())
    return json({
      success: true,
      message: 'Inscrição realizada com sucesso!',
      email,
    })
  }),
]
