import { AuthDialog } from '@/domains/auth'

export function SignupPage({ redirect }: { redirect?: string }) {
  return <AuthDialog defaultTab="signup" redirect={redirect} />
}
