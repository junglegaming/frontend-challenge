import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm, type Path } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { isApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PasswordInput } from '@/shared/ui/password-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useLogin, useSignup } from '../hooks/use-session'

const EMAIL_MESSAGE = 'Informe um e-mail válido.'
const USERNAME_MESSAGE = 'Use de 3 a 20 caracteres: letras minúsculas, números ou _.'

const loginSchema = z.object({
  email: z.email(EMAIL_MESSAGE),
  password: z.string().min(1, 'Informe a senha.'),
})
type LoginValues = z.infer<typeof loginSchema>

const signupSchema = z
  .object({
    username: z.string().regex(/^[a-z0-9_]{3,20}$/, USERNAME_MESSAGE),
    email: z.email(EMAIL_MESSAGE),
    password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'As senhas não coincidem.', path: ['confirmPassword'] })
type SignupValues = z.infer<typeof signupSchema>

/** The simulated social buttons never aim to look like a real OAuth success (constitution: no fake success). */
function notifySimulatedProvider(provider: string) {
  toast(`Login com ${provider} é simulado neste desafio.`)
}

function SocialButtons() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-caption text-muted-foreground">Ou continue com</p>
      <Button type="button" variant="outline" onClick={() => notifySimulatedProvider('Google')}>
        Continuar com Google
      </Button>
      <Button type="button" variant="outline" onClick={() => notifySimulatedProvider('Facebook')}>
        Continuar com Facebook
      </Button>
    </div>
  )
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginValues) {
    try {
      await login.mutateAsync(values)
      onSuccess()
    } catch (error) {
      setError('password', { type: 'server', message: isApiError(error) ? error.message : 'Não foi possível entrar.' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field label="E-mail" required error={errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="contato@email.com" {...register('email')} />
      </Field>
      <div className="flex flex-col gap-2">
        <Field label="Senha" required error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...register('password')} />
        </Field>
        <Button type="button" variant="link" size="sm" className="self-end" onClick={() => toast('Recuperação de senha em breve.')}>
          Esqueceu a senha?
        </Button>
      </div>
      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
      <SocialButtons />
    </form>
  )
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const signup = useSignup()
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) })

  async function onSubmit(values: SignupValues) {
    try {
      await signup.mutateAsync({ name: values.username, username: values.username, email: values.email, password: values.password })
      onSuccess()
    } catch (error) {
      if (isApiError(error) && Object.keys(error.fields).length > 0) {
        const known = Object.entries(error.fields).filter(([name]) => name === 'email' || name === 'username')
        known.forEach(([name, message]) => setError(name as Path<SignupValues>, { type: 'server', message }))
        if (known.length > 0) setFocus(known[0][0] as Path<SignupValues>)
      } else {
        setError('email', { type: 'server', message: isApiError(error) ? error.message : 'Não foi possível criar a conta.' })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field label="Nome de usuário" required error={errors.username?.message}>
        <Input autoComplete="username" {...register('username')} />
      </Field>
      <Field label="E-mail" required error={errors.email?.message}>
        <Input type="email" autoComplete="email" {...register('email')} />
      </Field>
      <Field label="Senha" required error={errors.password?.message}>
        <PasswordInput autoComplete="new-password" {...register('password')} />
      </Field>
      <Field label="Confirmar senha" required error={errors.confirmPassword?.message}>
        <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
      </Field>
      <Button type="submit" disabled={signup.isPending}>
        {signup.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
      <SocialButtons />
    </form>
  )
}

export function AuthDialog({ defaultTab, redirect }: { defaultTab: 'login' | 'signup'; redirect?: string }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState(defaultTab)

  function goToDestination() {
    void navigate({ to: redirect ?? '/' })
  }

  function handleOpenChange(open: boolean) {
    if (!open) void navigate({ to: redirect ?? '/' })
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'login' | 'signup')}>
          <DialogHeader>
            <TabsList>
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <DialogTitle className="sr-only">{tab === 'login' ? 'Entrar' : 'Criar conta'}</DialogTitle>
            <DialogDescription>
              {tab === 'login'
                ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
                : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
            </DialogDescription>
          </DialogHeader>
          <TabsContent value="login">
            <LoginForm onSuccess={goToDestination} />
          </TabsContent>
          <TabsContent value="signup">
            <SignupForm onSuccess={goToDestination} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
