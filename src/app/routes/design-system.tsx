import { createFileRoute, notFound } from '@tanstack/react-router'
import { DesignSystemPage } from '@/pages/design-system'
import { env } from '@/shared/config/env'

/** Visual catalog: available in development and in the demo build (mocks enabled); hidden otherwise. */
export const Route = createFileRoute('/design-system')({
  beforeLoad: () => {
    if (!import.meta.env.DEV && !env.enableMocks) throw notFound()
  },
  component: DesignSystemPage,
})
