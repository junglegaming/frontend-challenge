import { AuthDialog } from '@/domains/auth'

export function LoginPage({ redirect }: { redirect?: string }) {
  return <AuthDialog defaultTab="login" redirect={redirect} />
}
