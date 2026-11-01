import { type FormEvent, useState } from 'react'

import { Link, useRouterState } from '@tanstack/react-router'

import { toast } from 'sonner'

import { useSubscribeNewsletter } from '@/features/newsletter/api'
import { ApiError } from '@/shared/api/http-client'
import { DEFAULT_NFT_LIST_QUERY } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const linkClass = cn(
  'inline-block font-mono text-[14px] leading-[30px] text-foreground transition-colors duration-150 hover:text-primary cursor-pointer rounded-[3px]',
  focusRing,
)

/** Atalhos de coleção no rodapé (Figma): levam ao catálogo já filtrado. */
/** Seções fora do escopo: visíveis como no Figma, mas sem aparentar ação. */
const comingSoonClass =
  'cursor-default font-mono text-[14px] leading-[30px] font-normal text-foreground/60'

const FOOTER_COLLECTIONS = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] as const

/**
 * Rodapé global completo do Kurio, conforme o Figma:
 * - Bloco superior: 3 medalhões (W, C, D) com divisórias verticais + Newsletter
 * - Faixa institucional com slogan, e-mail e telefone (#38220F)
 * - 4 colunas de navegação (#241612) com redes sociais e carteiras compatíveis
 * - Copyright final centralizado
 */
export function Footer() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const isMobileAppScreen =
    pathname === '/' ||
    pathname.startsWith('/nft/') ||
    pathname === '/carrinho' ||
    pathname === '/pagamento' ||
    pathname === '/login' ||
    pathname === '/cadastro'

  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState<string | null>(null)
  const [newsletterSuccess, setNewsletterSuccess] = useState<string | null>(null)

  const subscribeMutation = useSubscribeNewsletter()

  function handleNewsletterSubmit(e: FormEvent) {
    e.preventDefault()
    setNewsletterSuccess(null)
    const trimmed = newsletterEmail.trim()

    if (!trimmed) {
      const err = 'Por favor, digite seu e-mail para assinar a newsletter.'
      setNewsletterError(err)
      toast.error(err)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      const err = 'Insira um endereço de e-mail válido (exemplo: usuario@dominio.com).'
      setNewsletterError(err)
      toast.error(err)
      return
    }

    setNewsletterError(null)
    subscribeMutation.mutate(
      { email: trimmed },
      {
        onSuccess: (data) => {
          const successMsg =
            data.message || 'E-mail cadastrado com sucesso! Você receberá os próximos lançamentos.'
          setNewsletterSuccess(successMsg)
          setNewsletterEmail('')
          toast.success(successMsg)
        },
        onError: (error) => {
          const msg =
            error instanceof ApiError
              ? error.message
              : 'Não foi possível cadastrar seu e-mail no momento. Tente novamente mais tarde.'
          setNewsletterError(msg)
          toast.error(msg)
        },
      },
    )
  }

  return (
    <footer
      className={cn(
        'mt-24 w-full bg-background pb-6 text-foreground',
        isMobileAppScreen && 'hidden md:block',
      )}
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col">
        {/* Frame 122: Medalhões (W, C, D) + Newsletter (1200px x 250px, bg: #241612, p: 32px) */}
        <div className="flex w-full max-w-[1200px] flex-col items-start bg-card p-6 sm:p-8 lg:p-[32px] xl:h-[250px] xl:w-[1200px]">
          {/* Frame 100: 1154px x 202px */}
          <div className="mx-auto grid w-full grid-cols-1 justify-between gap-6 md:grid-cols-2 lg:flex lg:flex-row lg:items-start lg:gap-0 xl:h-[202px] xl:w-[1154px]">
            {/* Coluna W (Frame 22: 264.67px x 202px, px: 16px) */}
            <div className="flex flex-col items-start gap-[10px] lg:min-w-0 lg:flex-1 lg:px-[16px] xl:h-[202px] xl:w-[264.67px] xl:flex-none">
              <div className="flex flex-col items-start gap-[12px] xl:h-[202px] xl:w-[232.67px]">
                {/* Frame 91: Círculo 74x74 com W */}
                <div className="flex size-[74px] shrink-0 items-center justify-center rounded-[37px] bg-primary font-mono text-[24px] leading-[32px] font-bold text-ink">
                  W
                </div>
                <h3 className="min-h-[16px] font-mono text-[17px] leading-[16px] font-bold text-foreground">
                  Segurança da carteira
                </h3>
                <p className="w-full max-w-[204px] font-mono text-[14px] leading-[22px] font-normal text-text-secondary">
                  Proteja sua carteira e colecione arte digital verificada com confiança.
                </p>
              </div>
            </div>

            {/* Rectangle 36: Divisória vertical 1 (1px x 202px, #D28A4C) */}
            <div
              aria-hidden="true"
              className="hidden w-[1px] shrink-0 self-stretch bg-primary lg:block xl:h-[202px]"
            />

            {/* Coluna C (Frame 21: 264.67px x 202px, px: 16px) */}
            <div className="flex flex-col items-start gap-[10px] lg:min-w-0 lg:flex-1 lg:px-[16px] xl:h-[202px] xl:w-[264.67px] xl:flex-none">
              <div className="flex flex-col items-start gap-[12px] xl:h-[202px] xl:w-[232.67px]">
                {/* Frame 93: Círculo 74x74 com C */}
                <div className="flex size-[74px] shrink-0 items-center justify-center rounded-[37px] bg-primary font-mono text-[24px] leading-[32px] font-bold text-ink">
                  C
                </div>
                <h3 className="min-h-[16px] font-mono text-[17px] leading-[16px] font-bold text-foreground">
                  Criadores em destaque
                </h3>
                <p className="w-full max-w-[204px] font-mono text-[14px] leading-[22px] font-normal text-text-secondary">
                  Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
                </p>
              </div>
            </div>

            {/* Rectangle 38: Divisória vertical 2 (1px x 202px, #D28A4C) */}
            <div
              aria-hidden="true"
              className="hidden w-[1px] shrink-0 self-stretch bg-primary lg:block xl:h-[202px]"
            />

            {/* Coluna D (Frame 20: 264.67px x 202px, px: 16px) */}
            <div className="flex flex-col items-start gap-[10px] lg:min-w-0 lg:flex-1 lg:px-[16px] xl:h-[202px] xl:w-[264.67px] xl:flex-none">
              <div className="flex flex-col items-start gap-[12px] xl:h-[202px] xl:w-[232.67px]">
                {/* Frame 95: Círculo 74x74 com D */}
                <div className="flex size-[74px] shrink-0 items-center justify-center rounded-[37px] bg-primary font-mono text-[24px] leading-[32px] font-bold text-ink">
                  D
                </div>
                <h3 className="min-h-[16px] font-mono text-[17px] leading-[16px] font-bold text-foreground">
                  Alertas de lançamentos
                </h3>
                <p className="w-full max-w-[204px] font-mono text-[14px] leading-[22px] font-normal text-text-secondary">
                  Receba calendários de cunhagem, novidades de listas de acesso e análises do
                  mercado.
                </p>
              </div>
            </div>

            {/* Rectangle 39: Divisória vertical 3 (1px x 202px, #D28A4C) */}
            <div
              aria-hidden="true"
              className="hidden w-[1px] shrink-0 self-stretch bg-primary lg:block xl:h-[202px]"
            />

            {/* Coluna Newsletter (Frame 99: 357px x 202px, px: 16px) */}
            <div className="flex flex-col items-start gap-[12px] lg:w-[357px] lg:shrink-0 lg:px-[16px] xl:h-[202px]">
              {/* Frame 102: 325px x 88px, gap: 16px */}
              <div className="flex flex-col items-start gap-[12px] lg:min-h-[88px] lg:w-[325px]">
                <h3 className="whitespace-pre-line font-mono text-[18px] leading-[16px] font-bold text-foreground">
                  Antecipe-se ao próximo{'\n'}lançamento
                </h3>
                {/* Frame 101 / Frame 98: 325px x 40px */}
                <form
                  className={cn(
                    'flex h-[40px] w-full max-w-[325px] flex-row items-center justify-between rounded-[6px] bg-surface-dark pl-[12px] shadow-[0px_0px_20px_rgba(10,6,4,0.45)] transition-colors',
                    newsletterError && 'border border-error/70 ring-1 ring-error/50',
                    newsletterSuccess && 'border border-primary/70 ring-1 ring-primary/50',
                  )}
                  onSubmit={handleNewsletterSubmit}
                  noValidate
                >
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value)
                      if (newsletterError) setNewsletterError(null)
                      if (newsletterSuccess) setNewsletterSuccess(null)
                    }}
                    disabled={subscribeMutation.isPending}
                    placeholder="digite seu e-mail..."
                    aria-label="Assinar newsletter"
                    aria-invalid={Boolean(newsletterError)}
                    aria-describedby={
                      newsletterError
                        ? 'newsletter-error'
                        : newsletterSuccess
                          ? 'newsletter-success'
                          : undefined
                    }
                    className="min-w-0 flex-1 bg-transparent font-mono text-[14px] leading-[16px] font-normal text-foreground placeholder:text-sand focus:outline-none disabled:opacity-50"
                  />
                  {/* Frame 97: Botão Enviar (85px x 40px) */}
                  <button
                    type="submit"
                    disabled={subscribeMutation.isPending}
                    className="flex h-[40px] w-[85px] shrink-0 cursor-pointer flex-row items-center justify-center gap-[10px] rounded-r-[6px] bg-primary px-[4px] font-mono text-[18px] leading-[16px] font-bold text-ink transition-colors duration-150 hover:bg-highlight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {subscribeMutation.isPending ? '...' : 'Enviar'}
                  </button>
                </form>

                {/* Inline Error Message */}
                {newsletterError && (
                  <p
                    id="newsletter-error"
                    role="alert"
                    className="w-full max-w-[325px] font-mono text-[12px] leading-4 text-error"
                  >
                    {newsletterError}
                  </p>
                )}

                {/* Inline Success Message */}
                {newsletterSuccess && (
                  <p
                    id="newsletter-success"
                    role="status"
                    className="w-full max-w-[325px] font-mono text-[12px] leading-4 text-primary"
                  >
                    {newsletterSuccess}
                  </p>
                )}
              </div>
              <p className="w-full max-w-[325px] font-mono text-[13px] leading-[22px] font-normal text-text-secondary">
                Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
              </p>
            </div>
          </div>
        </div>

        {/* Frame 121: 1200px x 360px */}
        <div className="flex w-full max-w-[1200px] flex-col items-start xl:h-[360px] xl:w-[1200px]">
          {/* Frame 120: Faixa institucional (1200px x 88px, padding: 32px, bg: #38220F) */}
          <div className="flex w-full flex-col justify-center bg-surface-dark p-6 sm:p-8 lg:h-[88px] lg:p-[32px] xl:w-[1200px]">
            {/* Frame 119: 1136px x 24px, gap: 92px */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:h-[24px] lg:gap-8 xl:w-[1136px] xl:gap-[92px]">
              {/* Logo: 210.67px x 34px, flex-grow: 1 */}
              <div className="flex items-center lg:h-[34px] lg:w-[210.67px] lg:flex-1">
                <Link
                  to="/"
                  search={DEFAULT_NFT_LIST_QUERY}
                  className={cn(
                    'w-[48px] font-mono text-[14px] leading-[18px] font-bold tracking-[0.1em] text-foreground transition-colors hover:text-primary cursor-pointer',
                    focusRing,
                  )}
                  aria-label="Kurio, página inicial"
                >
                  KURIO
                </Link>
              </div>

              {/* Frame 126: 210.67px x 24px, flex-grow: 1 */}
              <div className="flex items-center lg:h-[24px] lg:w-[210.67px] lg:flex-1">
                <p className="w-[219px] font-mono text-[14px] leading-[22px] font-normal text-foreground">
                  Feito para colecionadores,
                  <br />
                  criadores e cultura
                </p>
              </div>

              {/* Frame 124: 210.67px x 22px, flex-grow: 1 */}
              <div className="flex items-center lg:h-[22px] lg:w-[210.67px] lg:flex-1">
                <a
                  href="mailto:contato@email.com"
                  className="w-[143px] font-mono text-[14px] leading-[22px] font-normal text-foreground transition-colors hover:text-primary cursor-pointer"
                >
                  contato@email.com
                </a>
              </div>

              {/* Frame 125: 228px x 22px, flex-grow: 0 */}
              <div className="flex items-center lg:h-[22px] lg:w-[228px] lg:flex-none">
                <a
                  href="tel:+551140028922"
                  className="w-[135px] font-mono text-[14px] leading-[22px] font-normal text-foreground transition-colors hover:text-primary cursor-pointer"
                >
                  +55 11 4002 8922
                </a>
              </div>
            </div>
          </div>

          {/* Frame 118: 1200px x 272px, gap: 6px */}
          <div className="flex w-full flex-col items-center gap-[6px] xl:h-[272px] xl:w-[1200px]">
            {/* Frame 117: 1200px x 236px, padding: 32px, bg: #241612 */}
            <div className="flex w-full flex-col items-start bg-card p-6 sm:p-8 lg:p-[32px] xl:h-[236px] xl:w-[1200px]">
              {/* Frame 116: 1136px x 174px, gap: 124px */}
              <div className="flex w-full flex-col justify-between gap-8 sm:flex-row sm:flex-wrap lg:flex-nowrap lg:gap-12 xl:h-[174px] xl:w-[1136px] xl:gap-[124px]">
                {/* Frame 103: Coluna 1: Meu perfil (178.67px x 174px, gap: 8px) */}
                <div className="flex flex-col gap-[8px] lg:h-[174px] lg:w-[178.67px] lg:flex-1">
                  <h4 className="h-[16px] font-mono text-[18px] leading-[16px] font-bold text-foreground">
                    Meu perfil
                  </h4>
                  <ul className="flex h-[150px] flex-col">
                    <li className="h-[30px]">
                      <Link to="/perfil" className={linkClass}>
                        Meu perfil
                      </Link>
                    </li>
                    <li className="h-[30px]">
                      <Link to="/" search={DEFAULT_NFT_LIST_QUERY} className={linkClass}>
                        Minha coleção
                      </Link>
                    </li>
                    <li className="h-[30px]">
                      <span className={comingSoonClass} title="Em breve">
                        Atividade
                        <span className="sr-only"> (em breve)</span>
                      </span>
                    </li>
                    <li className="h-[30px]">
                      <span className={comingSoonClass} title="Em breve">
                        Estúdio do criador
                        <span className="sr-only"> (em breve)</span>
                      </span>
                    </li>
                    <li className="h-[30px]">
                      <span className={comingSoonClass} title="Em breve">
                        Lista de interesse
                        <span className="sr-only"> (em breve)</span>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Frame 104: Coluna 2: Central de ajuda (178.67px x 174px, gap: 8px) */}
                <div className="flex flex-col gap-[8px] lg:h-[174px] lg:w-[178.67px] lg:flex-1">
                  <h4 className="h-[16px] font-mono text-[18px] leading-[16px] font-bold text-foreground">
                    Central de ajuda
                  </h4>
                  <ul className="flex h-[150px] flex-col">
                    <li className="h-[30px]">
                      <span className={comingSoonClass} title="Em breve">
                        Central de ajuda
                        <span className="sr-only"> (em breve)</span>
                      </span>
                    </li>
                    <li className="h-[30px]">
                      <span className={comingSoonClass} title="Em breve">
                        Como comprar NFTs
                        <span className="sr-only"> (em breve)</span>
                      </span>
                    </li>
                    <li className="h-[30px]">
                      <Link to="/carteiras" className={linkClass}>
                        Carteira e segurança
                      </Link>
                    </li>
                    <li className="h-[30px]">
                      <span className={comingSoonClass} title="Em breve">
                        Política do mercado
                        <span className="sr-only"> (em breve)</span>
                      </span>
                    </li>
                    <li className="h-[30px]">
                      <span className={comingSoonClass} title="Em breve">
                        Denunciar item
                        <span className="sr-only"> (em breve)</span>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Frame 105: Coluna 3: Coleções (178.67px x 174px, gap: 8px) */}
                <div className="flex flex-col gap-[8px] lg:h-[174px] lg:w-[178.67px] lg:flex-1">
                  <h4 className="h-[16px] font-mono text-[18px] leading-[16px] font-bold text-foreground">
                    Coleções
                  </h4>
                  <ul className="flex h-[150px] flex-col">
                    {FOOTER_COLLECTIONS.map((collection) => (
                      <li key={collection} className="h-[30px]">
                        <Link
                          to="/"
                          search={{ ...DEFAULT_NFT_LIST_QUERY, collection }}
                          className={linkClass}
                        >
                          {collection}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Frame 115: Coluna 4: Redes sociais e Carteiras (228px x 152px, gap: 32px) */}
                <div className="flex flex-col gap-[32px] lg:h-[152px] lg:w-[228px] lg:flex-none">
                  {/* Frame 114: Redes sociais (190px x 66px, gap: 20px) */}
                  <div className="flex flex-col gap-[20px] lg:h-[66px] lg:w-[190px]">
                    <h4 className="h-[16px] font-mono text-[18px] leading-[16px] font-bold text-foreground">
                      Redes sociais
                    </h4>
                    {/* Frame 113: 190px x 30px, gap: 10px */}
                    <div className="flex h-[30px] w-[190px] items-center gap-[10px]">
                      {/* Frame 108: Facebook */}
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        aria-label="Facebook"
                        className="group flex size-[30px] cursor-pointer items-center justify-center rounded-[4px] border border-primary transition-colors duration-150 hover:bg-primary"
                      >
                        <svg
                          className="size-4 fill-primary transition-colors duration-150 group-hover:fill-ink"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.808C10.597 0 9 1.582 9 4.615V8z" />
                        </svg>
                      </a>
                      {/* Frame 109: Instagram */}
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        aria-label="Instagram"
                        className="group flex size-[30px] cursor-pointer items-center justify-center rounded-[4px] border border-primary transition-colors duration-150 hover:bg-primary"
                      >
                        <svg
                          className="size-4 fill-primary transition-colors duration-150 group-hover:fill-ink"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                      {/* Frame 110: Twitter */}
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        aria-label="Twitter"
                        className="group flex size-[30px] cursor-pointer items-center justify-center rounded-[4px] border border-primary transition-colors duration-150 hover:bg-primary"
                      >
                        <svg
                          className="size-4 fill-primary transition-colors duration-150 group-hover:fill-ink"
                          viewBox="0 0 24 24"
                        >
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z" />
                        </svg>
                      </a>
                      {/* Frame 111: LinkedIn */}
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        aria-label="LinkedIn"
                        className="group flex size-[30px] cursor-pointer items-center justify-center rounded-[4px] border border-primary transition-colors duration-150 hover:bg-primary"
                      >
                        <svg
                          className="size-4 fill-primary transition-colors duration-150 group-hover:fill-ink"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>
                      {/* Frame 112: YouTube */}
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        aria-label="YouTube"
                        className="group flex size-[30px] cursor-pointer items-center justify-center rounded-[4px] border border-primary transition-colors duration-150 hover:bg-primary"
                      >
                        <svg
                          className="size-4 fill-primary transition-colors duration-150 group-hover:fill-ink"
                          viewBox="0 0 24 24"
                        >
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Frame 107: Carteiras compatíveis (228px x 54px, gap: 12px) */}
                  <div className="flex flex-col gap-[12px] lg:h-[54px] lg:w-[228px]">
                    <h5 className="h-[16px] whitespace-nowrap font-mono text-[18px] leading-[16px] font-bold text-foreground">
                      Carteiras compatíveis
                    </h5>
                    {/* Frame 106: 228px x 26px */}
                    <div className="flex h-[26px] w-[228px] items-center justify-center rounded-[6px] border border-[#55321F] bg-surface-dark px-2 font-mono text-[9px] leading-[12px] font-bold tracking-[0.1px] text-highlight">
                      METAMASK • WALLETCONNECT • COINBASE
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright: 1200px x 30px */}
            <p className="h-[30px] w-full text-center font-mono text-[14px] leading-[30px] font-normal text-foreground">
              © 2026 Kurio. Propriedade digital para todos.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
