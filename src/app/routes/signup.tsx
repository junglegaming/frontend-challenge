import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SignupPage } from '@/pages/signup'

const signupSearchSchema = z.object({ redirect: z.string().optional() })

export const Route = createFileRoute('/signup')({
  validateSearch: signupSearchSchema,
  component: SignupRoute,
})

function SignupRoute() {
  const { redirect } = Route.useSearch()
  return <SignupPage redirect={redirect} />
}
