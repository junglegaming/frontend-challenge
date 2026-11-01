import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useRegister } from '@/features/auth/api'
import { nftsQueryOptions } from '@/features/catalog/api'
import { Hero } from '@/features/catalog/components/Hero'
import { ApiError } from '@/shared/api/http-client'
import { DEFAULT_NFT_LIST_QUERY, registerRequestSchema } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { formatEth } from '@/shared/lib/money'

export const Route = createFileRoute('/cadastro')({
  component: RegisterPage,
})

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const signUpSchema = registerRequestSchema
  .extend({
    confirmPassword: z
      .string({ error: 'Confirmação de senha é obrigatória' })
      .min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine(
    (data) => {
      if (!data.confirmPassword) return true
      return data.password === data.confirmPassword
    },
    {
      message: 'As senhas não coincidem',
      path: ['confirmPassword'],
    },
  )

type SignUpFormValues = z.infer<typeof signUpSchema>

function RegisterPage() {
  // Fundo do modal: prévia do catálogo real (decorativa, atrás do diálogo).
  const preview = useQuery(nftsQueryOptions({ ...DEFAULT_NFT_LIST_QUERY, pageSize: 3 }))
  const navigate = Route.useNavigate()
  const registerMutation = useRegister()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [mobileShowPassword, setMobileShowPassword] = useState(false)
  const [mobileShowConfirmPassword, setMobileShowConfirmPassword] = useState(false)

  // Desktop Form
  const desktopForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  // Mobile Form
  const mobileForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const apiErrorMessage =
    registerMutation.error instanceof ApiError
      ? registerMutation.error.message
      : registerMutation.error
        ? 'Erro ao criar conta. Tente novamente.'
        : null

  function onDesktopSubmit(values: SignUpFormValues) {
    registerMutation.mutate(
      {
        name: values.name,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => navigate({ to: '/', search: DEFAULT_NFT_LIST_QUERY }),
        onError: (err) => {
          if (err instanceof ApiError && err.fields) {
            Object.entries(err.fields).forEach(([field, msg]) => {
              desktopForm.setError(field as keyof SignUpFormValues, { message: msg })
            })
          }
        },
      },
    )
  }

  function onMobileSubmit(values: SignUpFormValues) {
    registerMutation.mutate(
      {
        name: values.name,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => navigate({ to: '/', search: DEFAULT_NFT_LIST_QUERY }),
        onError: (err) => {
          if (err instanceof ApiError && err.fields) {
            Object.entries(err.fields).forEach(([field, msg]) => {
              mobileForm.setError(field as keyof SignUpFormValues, { message: msg })
            })
          }
        },
      },
    )
  }

  function handleClose() {
    navigate({ to: '/', search: DEFAULT_NFT_LIST_QUERY })
  }

  function fillDesktopDemoData() {
    desktopForm.setValue('name', 'Colecionador Kurio', { shouldValidate: true })
    desktopForm.setValue('email', 'colecionador@kurio.test', { shouldValidate: true })
    desktopForm.setValue('password', 'kurio123', { shouldValidate: true })
    desktopForm.setValue('confirmPassword', 'kurio123', { shouldValidate: true })
    desktopForm.clearErrors()
    if (apiErrorMessage) registerMutation.reset()
  }

  function fillMobileDemoData() {
    mobileForm.setValue('name', 'Colecionador Kurio', { shouldValidate: true })
    mobileForm.setValue('email', 'colecionador@kurio.test', { shouldValidate: true })
    mobileForm.setValue('password', 'kurio123', { shouldValidate: true })
    mobileForm.setValue('confirmPassword', 'kurio123', { shouldValidate: true })
    mobileForm.clearErrors()
    if (apiErrorMessage) registerMutation.reset()
  }

  return (
    <>
      {/* Desktop / Cadastro (Modal over dimmed marketplace page) */}
      <div className="relative hidden min-h-[1400px] w-full overflow-hidden bg-background md:block">
        {/* Marketplace Page preview in the background (dimmed as in Figma spec) */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none opacity-20 filter blur-[0.5px]"
        >
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 pt-6">
            <Hero />

            {/* Catalog preview row */}
            <div className="flex gap-12">
              {/* Sidebar preview */}
              <div className="w-[310px] shrink-0 rounded-[8px] bg-card p-5">
                <h3 className="font-mono text-[18px] font-bold text-foreground">Coleções</h3>
                <div className="mt-4 flex flex-col gap-3 font-mono text-sm text-text-secondary">
                  {preview.data?.facets.collections.slice(0, 3).map((facet, index) => (
                    <div
                      key={facet.value}
                      className={cn('flex justify-between', index === 0 && 'text-highlight')}
                    >
                      <span>{facet.value}</span>
                      <span>({facet.count})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products preview */}
              <div className="grid flex-1 grid-cols-3 gap-6">
                {preview.data?.items.map((item) => (
                  <div key={item.id} className="rounded-[8px] bg-card p-3">
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-48 w-full rounded-[6px] object-cover"
                    />
                    <p className="mt-3 font-mono text-sm text-foreground">{item.name}</p>
                    <p className="font-mono text-sm font-bold text-highlight">
                      {formatEth(item.priceEth)} ETH
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dark Backdrop Overlay */}
        <div
          onClick={handleClose}
          className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px]"
        />

        {/* Centered Sign Up Modal (Figma: width 500px, height 656px, top 158px on desktop) */}
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
          className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto px-4 py-8 sm:py-16"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-modal-title"
            className="relative w-full max-w-[500px] overflow-hidden rounded-none border border-[#38220F] bg-card shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-in fade-in-0 zoom-in-95 duration-200"
          >
            {/* Close button X */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar"
              className="absolute top-4 right-4 z-30 flex size-8 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-raised hover:text-highlight"
            >
              <X className="size-5" strokeWidth={2} />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center pt-12 pb-2">
              {/* Frame 25: Entrar | Criar conta */}
              <div className="flex items-center justify-center gap-2">
                <Link
                  to="/login"
                  search={{}}
                  className="font-mono text-[20px] font-medium leading-4 text-foreground transition-colors hover:text-highlight"
                >
                  Entrar
                </Link>
                <div className="h-5 w-[1px] bg-[#F0805F]" />
                <span
                  id="register-modal-title"
                  className="font-mono text-[20px] font-medium leading-4 text-highlight"
                >
                  Criar conta
                </span>
              </div>

              {/* Subtitle */}
              <p className="mt-6 max-w-[404px] px-6 text-center font-mono text-[13px] font-normal leading-4 text-foreground">
                Crie seu perfil de colecionador e conecte uma carteira quando quiser.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={desktopForm.handleSubmit(onDesktopSubmit)}
              noValidate
              className="mt-4 flex flex-col items-center px-6 sm:px-[80px]"
            >
              {/* Username Field */}
              <div className="w-full max-w-[340px]">
                <label htmlFor="name" className="sr-only">
                  Nome de usuário
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nome de usuário"
                  aria-label="Nome de usuário"
                  autoComplete="name"
                  aria-invalid={Boolean(desktopForm.formState.errors.name)}
                  className={cn(
                    'h-[40px] w-full rounded-[5px] border border-[#3F2319] bg-transparent px-4 font-mono text-[14px] text-foreground placeholder:text-[#CFB28C] focus:border-primary focus:outline-none transition-colors',
                    desktopForm.formState.errors.name && 'border-error',
                  )}
                  {...desktopForm.register('name', {
                    onChange: () => {
                      if (desktopForm.formState.errors.name) desktopForm.clearErrors('name')
                      if (apiErrorMessage) registerMutation.reset()
                    },
                  })}
                />
                {desktopForm.formState.errors.name && (
                  <p role="alert" className="mt-1 font-mono text-xs text-error">
                    {desktopForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="mt-3 w-full max-w-[340px]">
                <label htmlFor="email" className="sr-only">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  aria-label="E-mail"
                  autoComplete="email"
                  aria-invalid={Boolean(desktopForm.formState.errors.email)}
                  className={cn(
                    'h-[40px] w-full rounded-[5px] border border-[#3F2319] bg-transparent px-4 font-mono text-[14px] text-foreground placeholder:text-[#CFB28C] focus:border-primary focus:outline-none transition-colors',
                    desktopForm.formState.errors.email && 'border-error',
                  )}
                  {...desktopForm.register('email', {
                    onChange: () => {
                      if (desktopForm.formState.errors.email) desktopForm.clearErrors('email')
                      if (apiErrorMessage) registerMutation.reset()
                    },
                  })}
                />
                {desktopForm.formState.errors.email && (
                  <p role="alert" className="mt-1 font-mono text-xs text-error">
                    {desktopForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="mt-3 w-full max-w-[340px]">
                <label htmlFor="password" className="sr-only">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    aria-label="Senha"
                    autoComplete="new-password"
                    aria-invalid={Boolean(desktopForm.formState.errors.password)}
                    className={cn(
                      'h-[40px] w-full rounded-[5px] border border-[#3F2319] bg-transparent pr-10 pl-4 font-mono text-[14px] text-foreground placeholder:text-[#CFB28C] focus:border-primary focus:outline-none transition-colors',
                      desktopForm.formState.errors.password && 'border-error',
                    )}
                    {...desktopForm.register('password', {
                      onChange: () => {
                        if (desktopForm.formState.errors.password)
                          desktopForm.clearErrors('password')
                        if (apiErrorMessage) registerMutation.reset()
                      },
                      onBlur: () => {
                        if (desktopForm.getValues('confirmPassword')) {
                          desktopForm.trigger('confirmPassword')
                        }
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#CFB28C] transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {desktopForm.formState.errors.password && (
                  <p role="alert" className="mt-1 font-mono text-xs text-error">
                    {desktopForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="mt-3 w-full max-w-[340px]">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmar senha"
                    aria-label="Confirmar senha"
                    autoComplete="new-password"
                    aria-invalid={Boolean(desktopForm.formState.errors.confirmPassword)}
                    className={cn(
                      'h-[40px] w-full rounded-[5px] border border-[#3F2319] bg-transparent pr-10 pl-4 font-mono text-[14px] text-foreground placeholder:text-[#CFB28C] focus:border-primary focus:outline-none transition-colors',
                      desktopForm.formState.errors.confirmPassword && 'border-error',
                    )}
                    {...desktopForm.register('confirmPassword', {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        if (desktopForm.formState.errors.confirmPassword)
                          desktopForm.clearErrors('confirmPassword')
                        if (apiErrorMessage) registerMutation.reset()
                        if (
                          e.target.value &&
                          e.target.value === desktopForm.getValues('password')
                        ) {
                          desktopForm.clearErrors('confirmPassword')
                        }
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#CFB28C] transition-colors hover:text-foreground"
                    aria-label={showConfirmPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {desktopForm.formState.errors.confirmPassword && (
                  <p role="alert" className="mt-1 font-mono text-xs text-error">
                    {desktopForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* API Error Message */}
              {apiErrorMessage && (
                <p
                  role="alert"
                  className="mt-3 w-full max-w-[340px] text-center font-mono text-xs text-error"
                >
                  {apiErrorMessage}
                </p>
              )}

              {/* Sign Up CTA Button */}
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className={cn(
                  'mt-6 flex h-[45px] w-full max-w-[340px] cursor-pointer items-center justify-center rounded-[5px] bg-primary font-mono text-[16px] font-bold text-ink transition-colors hover:bg-highlight disabled:opacity-50',
                  focusRing,
                )}
              >
                {registerMutation.isPending ? 'Criando…' : 'Criar conta'}
              </button>
            </form>

            {/* Social Divider */}
            <div className="mt-6 flex w-full items-center gap-3 px-6 sm:px-0">
              <div className="h-[1px] flex-1 bg-[#3F2319]" />
              <span className="whitespace-nowrap font-mono text-[13px] leading-4 text-foreground">
                Ou continue com
              </span>
              <div className="h-[1px] flex-1 bg-[#3F2319]" />
            </div>

            {/* Social Buttons */}
            <div className="mt-3 flex w-full flex-col items-center gap-3 px-6 pb-8 sm:px-[80px]">
              {/* Google Button */}
              <button
                type="button"
                onClick={fillDesktopDemoData}
                className="flex h-[40px] w-full max-w-[340px] cursor-pointer items-center justify-center gap-3 rounded-[5px] border border-[#3F2319] bg-transparent font-mono text-[13px] font-medium text-text-secondary transition-colors hover:border-primary/60 hover:text-foreground"
              >
                <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar com Google</span>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={fillDesktopDemoData}
                className="flex h-[40px] w-full max-w-[340px] cursor-pointer items-center justify-center gap-3 rounded-[5px] border border-[#3F2319] bg-transparent font-mono text-[13px] font-medium text-text-secondary transition-colors hover:border-primary/60 hover:text-foreground"
              >
                <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="#3B5999">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Continuar com Facebook</span>
              </button>

              {/* Test credentials helper */}
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1 font-mono text-[11px] text-text-secondary">
                <span>Conta de teste:</span>
                <button
                  type="button"
                  onClick={fillDesktopDemoData}
                  className="cursor-pointer font-bold text-foreground underline hover:text-highlight"
                >
                  colecionador@kurio.test
                </button>
                <span>• Senha:</span>
                <button
                  type="button"
                  onClick={fillDesktopDemoData}
                  className="cursor-pointer font-bold text-foreground underline hover:text-highlight"
                >
                  kurio123
                </button>
              </div>
            </div>

            {/* Bottom Accent Bar (Rectangle 55: 500px x 10px in #D28A4C) */}
            <div className="absolute bottom-0 right-0 left-0 h-[10px] bg-primary" />
          </div>
        </div>
      </div>

      {/* Mobile / Cadastro (Figma: width 414px, height 896px, padding: 80px 28px 24px, gap: 40px) */}
      <div className="relative flex min-h-screen w-full flex-col items-center bg-[#140D0A] px-[28px] pt-[80px] pb-[24px] md:hidden">
        {/* Fechar: volta para o catálogo (o mobile não tem o modal do desktop). */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full border border-[#3F2319] bg-[#2F1D15] text-[#CFB28C] transition-colors hover:border-[#D28A4C] hover:text-[#E89B55] active:scale-95"
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        <div className="flex w-full max-w-[358px] flex-col items-center gap-[40px]">
          {/* Logo (Frame: 358px x 136px) */}
          <div className="flex h-[136px] w-full items-center justify-center">
            <Link
              to="/"
              search={DEFAULT_NFT_LIST_QUERY}
              className="font-mono text-[32px] font-bold leading-[42px] tracking-[0.1em] text-[#F5F1EB] transition-colors hover:text-primary"
            >
              KURIO
            </Link>
          </div>

          {/* Title (358px x 16px) */}
          <div className="flex h-4 w-full items-start justify-center">
            <h1 className="text-center font-mono text-[18px] font-bold leading-4 text-[#F5F1EB]">
              Criar perfil de colecionador
            </h1>
          </div>

          {/* Form (4 fields = 236px + 40px gap + 60px CTA button) */}
          <form
            onSubmit={mobileForm.handleSubmit(onMobileSubmit)}
            noValidate
            className="flex w-full flex-col gap-[40px]"
          >
            {/* 4 input fields container: 50px each, gap 12px -> 4 * 50 + 3 * 12 = 236px */}
            <div className="flex w-full flex-col gap-3">
              {/* Username Field (Container: 358px x 50px, border 1px solid #3F2319, rounded 10px) */}
              <div>
                <label htmlFor="mobile-name" className="sr-only">
                  Nome do colecionador
                </label>
                <input
                  id="mobile-name"
                  type="text"
                  placeholder="Nome de usuário"
                  autoComplete="name"
                  aria-invalid={Boolean(mobileForm.formState.errors.name)}
                  className={cn(
                    'h-[50px] w-full rounded-[10px] border border-[#3F2319] bg-transparent px-4 font-mono text-[14px] text-[#F5F1EB] placeholder:text-[#B39463] focus:border-primary focus:outline-none transition-colors',
                    mobileForm.formState.errors.name && 'border-error',
                  )}
                  {...mobileForm.register('name', {
                    onChange: () => {
                      if (mobileForm.formState.errors.name) mobileForm.clearErrors('name')
                      if (apiErrorMessage) registerMutation.reset()
                    },
                  })}
                />
                {mobileForm.formState.errors.name && (
                  <p role="alert" className="mt-1 font-mono text-xs text-error">
                    {mobileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field (Frame 447: 358px x 50px, border 1px solid #3F2319, rounded 10px) */}
              <div>
                <label htmlFor="mobile-register-email" className="sr-only">
                  Contato de cadastro
                </label>
                <input
                  id="mobile-register-email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  autoComplete="email"
                  aria-invalid={Boolean(mobileForm.formState.errors.email)}
                  className={cn(
                    'h-[50px] w-full rounded-[10px] border border-[#3F2319] bg-transparent px-4 font-mono text-[14px] text-[#F5F1EB] placeholder:text-[#B39463] focus:border-primary focus:outline-none transition-colors',
                    mobileForm.formState.errors.email && 'border-error',
                  )}
                  {...mobileForm.register('email', {
                    onChange: () => {
                      if (mobileForm.formState.errors.email) mobileForm.clearErrors('email')
                      if (apiErrorMessage) registerMutation.reset()
                    },
                  })}
                />
                {mobileForm.formState.errors.email && (
                  <p role="alert" className="mt-1 font-mono text-xs text-error">
                    {mobileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field (Frame 449: 358px x 50px, border 1px solid #3F2319, rounded 10px) */}
              <div>
                <label htmlFor="mobile-register-password" className="sr-only">
                  Código secreto
                </label>
                <div
                  className={cn(
                    'relative flex h-[50px] w-full items-center justify-between rounded-[10px] border border-[#3F2319] bg-transparent px-4 transition-colors focus-within:border-primary',
                    mobileForm.formState.errors.password && 'border-error',
                  )}
                >
                  <input
                    id="mobile-register-password"
                    type={mobileShowPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    autoComplete="new-password"
                    aria-invalid={Boolean(mobileForm.formState.errors.password)}
                    className="h-full flex-1 bg-transparent font-mono text-[14px] text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none"
                    {...mobileForm.register('password', {
                      onChange: () => {
                        if (mobileForm.formState.errors.password) mobileForm.clearErrors('password')
                        if (apiErrorMessage) registerMutation.reset()
                      },
                      onBlur: () => {
                        if (mobileForm.getValues('confirmPassword')) {
                          mobileForm.trigger('confirmPassword')
                        }
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setMobileShowPassword((prev) => !prev)}
                    className="flex size-[18px] shrink-0 cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
                    aria-label={mobileShowPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {mobileShowPassword ? (
                      <Eye className="size-[18px] text-[#55321F]" strokeWidth={1.5} />
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-[18px]"
                        aria-hidden="true"
                      >
                        <path
                          d="M10.94 10.94A2.75 2.75 0 0 1 7.06 7.06"
                          stroke="#55321F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13.43 13.43C12.13 14.28 10.63 14.75 9 14.75C5.16 14.75 2.14 11.89 1.5 9C1.94 7.02 3.51 5.25 5.57 4.43"
                          stroke="#55321F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7.74 3.33C8.15 3.28 8.57 3.25 9 3.25C12.84 3.25 15.86 6.11 16.5 9C16.14 10.63 14.92 12.13 13.3 12.98"
                          stroke="#55321F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2.5 2.5L15.5 15.5"
                          stroke="#55321F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {mobileForm.formState.errors.password && (
                  <p role="alert" className="mt-1 font-mono text-xs text-error">
                    {mobileForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field (Frame 451: 358px x 50px, border 1px solid #3F2319, rounded 10px) */}
              <div>
                <label htmlFor="mobile-register-confirm-password" className="sr-only">
                  Código de confirmação
                </label>
                <div
                  className={cn(
                    'relative flex h-[50px] w-full items-center justify-between rounded-[10px] border border-[#3F2319] bg-transparent px-4 transition-colors focus-within:border-primary',
                    mobileForm.formState.errors.confirmPassword && 'border-error',
                  )}
                >
                  <input
                    id="mobile-register-confirm-password"
                    type={mobileShowConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmar senha"
                    autoComplete="new-password"
                    aria-invalid={Boolean(mobileForm.formState.errors.confirmPassword)}
                    className="h-full flex-1 bg-transparent font-mono text-[14px] text-[#F5F1EB] placeholder:text-[#B39463] focus:outline-none"
                    {...mobileForm.register('confirmPassword', {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        if (mobileForm.formState.errors.confirmPassword)
                          mobileForm.clearErrors('confirmPassword')
                        if (apiErrorMessage) registerMutation.reset()
                        if (e.target.value && e.target.value === mobileForm.getValues('password')) {
                          mobileForm.clearErrors('confirmPassword')
                        }
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setMobileShowConfirmPassword((prev) => !prev)}
                    className="flex size-[18px] shrink-0 cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
                    aria-label={mobileShowConfirmPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {mobileShowConfirmPassword ? (
                      <Eye className="size-[18px] text-[#55321F]" strokeWidth={1.5} />
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-[18px]"
                        aria-hidden="true"
                      >
                        <path
                          d="M10.94 10.94A2.75 2.75 0 0 1 7.06 7.06"
                          stroke="#55321F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13.43 13.43C12.13 14.28 10.63 14.75 9 14.75C5.16 14.75 2.14 11.89 1.5 9C1.94 7.02 3.51 5.25 5.57 4.43"
                          stroke="#55321F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7.74 3.33C8.15 3.28 8.57 3.25 9 3.25C12.84 3.25 15.86 6.11 16.5 9C16.14 10.63 14.92 12.13 13.3 12.98"
                          stroke="#55321F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2.5 2.5L15.5 15.5"
                          stroke="#55321F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {mobileForm.formState.errors.confirmPassword && (
                  <p role="alert" className="mt-1 font-mono text-xs text-error">
                    {mobileForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* API Error Message */}
            {apiErrorMessage && (
              <p role="alert" className="text-center font-mono text-xs text-error">
                {apiErrorMessage}
              </p>
            )}

            {/* Create Profile Button (358px x 60px, bg: #D28A4C, rounded 10px) */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="flex h-[60px] w-full cursor-pointer items-center justify-center rounded-[10px] bg-[#D28A4C] font-mono text-[16px] font-bold leading-4 text-[#140D0A] transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-50"
            >
              {registerMutation.isPending ? 'Criando…' : 'Criar perfil'}
            </button>
          </form>

          {/* Mobile Social Block (358px x 124px) */}
          <div className="flex w-full flex-col gap-3">
            {/* Divider */}
            <div className="flex h-4 w-full items-center gap-2.5">
              <div className="h-0 flex-1 border-t border-[#3F2319]" />
              <span className="shrink-0 font-mono text-[13px] leading-4 text-[#F5F1EB]">
                Ou continue com
              </span>
              <div className="h-0 flex-1 border-t border-[#3F2319]" />
            </div>

            {/* Social Buttons */}
            <div className="flex w-full flex-col gap-4">
              {/* Google Button */}
              <button
                type="button"
                onClick={fillMobileDemoData}
                className="flex h-[40px] w-full cursor-pointer items-center justify-center gap-3 rounded-[5px] border border-[#3F2319] bg-transparent font-mono text-[13px] font-medium leading-4 text-[#CFB28C] transition-colors hover:border-primary/60 hover:text-foreground"
              >
                <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar com Google</span>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={fillMobileDemoData}
                className="flex h-[40px] w-full cursor-pointer items-center justify-center gap-3 rounded-[5px] border border-[#3F2319] bg-transparent font-mono text-[13px] font-medium leading-4 text-[#CFB28C] transition-colors hover:border-primary/60 hover:text-foreground"
              >
                <svg
                  className="size-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="#3B5999"
                  aria-hidden="true"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Continuar com Facebook</span>
              </button>
            </div>
          </div>

          {/* Login Link (358px x 20px) */}
          <div className="flex h-5 w-full items-center justify-center">
            <Link
              to="/login"
              className="font-mono text-[15px] font-normal leading-5 text-[#CFB28C] transition-colors hover:text-highlight"
            >
              Já tem uma conta? Entre
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
