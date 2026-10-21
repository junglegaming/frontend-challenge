import type { ReactNode } from 'react'
import * as Icons from '@/shared/icons'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { CountBadge } from '@/shared/ui/count-badge'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PageContainer } from '@/shared/ui/page-container'
import { PasswordInput } from '@/shared/ui/password-input'
import { Select } from '@/shared/ui/select'
import { Separator } from '@/shared/ui/separator'
import { SideMenu, SideMenuItem } from '@/shared/ui/side-menu'
import { Skeleton } from '@/shared/ui/skeleton'

/** Token names and their roles, mirroring specs/001-design-system-standards/contracts/design-tokens.md. */
const COLORS = [
  { token: 'background', cls: 'bg-background', role: 'Fundo da página' },
  { token: 'card', cls: 'bg-card', role: 'Superfícies (menu lateral, cards, navbar, dock)' },
  { token: 'primary', cls: 'bg-primary', role: 'Botão primário, item ativo, selo' },
  { token: 'muted-foreground', cls: 'bg-muted-foreground', role: 'Texto secundário, ícones inativos' },
  { token: 'foreground', cls: 'bg-foreground', role: 'Texto principal' },
  { token: 'ring', cls: 'bg-ring', role: 'Anel de foco' },
  { token: 'destructive', cls: 'bg-destructive', role: 'Erro e marcador de obrigatório' },
  { token: 'success', cls: 'bg-success', role: 'Sucesso' },
  { token: 'warning', cls: 'bg-warning', role: 'Aviso' },
] as const

const TYPE_SCALE = [
  { name: 'title', cls: 'text-title font-bold', spec: '16 px / 700', sample: 'Perfil do colecionador' },
  { name: 'body', cls: 'text-body', spec: '14 px / 400', sample: 'Nome de exibição' },
  { name: 'action', cls: 'text-action font-bold', spec: '14 px / 700', sample: 'Salvar' },
  { name: 'caption', cls: 'text-caption', spec: '12 px / 400', sample: 'Texto auxiliar' },
] as const

const SPACING = [
  { px: 4, cls: 'size-1' },
  { px: 8, cls: 'size-2' },
  { px: 12, cls: 'size-3' },
  { px: 16, cls: 'size-4' },
  { px: 24, cls: 'size-6' },
  { px: 32, cls: 'size-8' },
  { px: 48, cls: 'size-12' },
] as const

const RADII = [
  { name: 'sm', cls: 'rounded-sm', px: 4 },
  { name: 'md', cls: 'rounded-md', px: 8 },
  { name: 'lg', cls: 'rounded-lg', px: 20 },
] as const

const ICON_NAMES = Object.keys(Icons)
  .filter((name) => name.endsWith('Icon'))
  .sort()

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-title font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function DesignSystemPage() {
  return (
    <PageContainer className="flex flex-col gap-12 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-title font-bold">Design system Kurio</h1>
        <p className="text-muted-foreground">
          Catálogo de tokens, ícones e componentes. Qualquer cor, fonte, espaçamento ou componente fora daqui exige
          justificativa no PR.
        </p>
      </header>

      <Section id="ds-colors" title="Cores">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLORS.map(({ token, cls, role }) => (
            <li key={token} className="flex items-center gap-3">
              <span aria-hidden="true" className={`size-12 shrink-0 rounded-sm border border-input ${cls}`} />
              <span className="flex flex-col">
                <code className="text-body font-bold">--{token}</code>
                <span className="text-caption text-muted-foreground">{role}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ds-type" title="Tipografia">
        <ul className="flex flex-col gap-3">
          {TYPE_SCALE.map(({ name, cls, spec, sample }) => (
            <li key={name} className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <code className="w-20 text-caption text-muted-foreground">{name}</code>
              <span className={cls}>{sample}</span>
              <span className="text-caption text-muted-foreground">{spec}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ds-spacing" title="Espaçamento e raios">
        <ul className="flex flex-wrap items-end gap-4">
          {SPACING.map(({ px, cls }) => (
            <li key={px} className="flex flex-col items-center gap-2">
              <span aria-hidden="true" className={`bg-primary ${cls}`} />
              <span className="text-caption text-muted-foreground">{px}</span>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-4">
          {RADII.map(({ name, cls, px }) => (
            <li key={name} className="flex flex-col items-center gap-2">
              <span aria-hidden="true" className={`size-16 border border-input bg-card ${cls}`} />
              <span className="text-caption text-muted-foreground">
                {name} · {px}px
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ds-icons" title="Ícones">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ICON_NAMES.map((name) => {
            const Icon = Icons[name as keyof typeof Icons] as Icons.IconComponent
            return (
              <li key={name} className="flex items-center gap-3">
                <Icon aria-hidden="true" strokeWidth={1.5} size={24} className="text-primary" />
                <code className="text-caption">{name}</code>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section id="ds-buttons" title="Botões">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Primário</Button>
          <Button variant="ghost">Texto</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="destructive">Destrutivo</Button>
          <Button disabled>Desabilitado</Button>
          <Button size="icon" aria-label="Buscar">
            <Icons.SearchIcon aria-hidden="true" strokeWidth={1.5} />
          </Button>
          <Button disabled>
            <Icons.SpinnerIcon aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
            Carregando
          </Button>
        </div>
      </Section>

      <Section id="ds-forms" title="Campos">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Padrão" required>
            <Input placeholder="Digite aqui" />
          </Field>
          <Field label="Com erro" required error="Informe pelo menos 3 caracteres.">
            <Input defaultValue="ab" />
          </Field>
          <Field label="Desabilitado">
            <Input disabled defaultValue="Somente leitura" />
          </Field>
          <Field label="Senha">
            <PasswordInput />
          </Field>
          <div className="flex gap-2">
            <Select aria-label="Domínio ENS" className="w-[92px] shrink-0">
              <option>.eth</option>
            </Select>
            <Input aria-label="Nome ENS" placeholder="seunome" />
          </div>
        </div>
      </Section>

      <Section id="ds-navigation" title="Navegação e menu lateral">
        <div className="flex items-center gap-4">
          <span className="relative inline-flex">
            <Icons.CartIcon aria-hidden="true" strokeWidth={1.5} size={24} />
            <CountBadge count={6} className="absolute -right-2 -top-2" />
          </span>
          <span className="text-caption text-muted-foreground">Selo de contagem (1–99, 99+)</span>
          <CountBadge count={120} />
        </div>
        <SideMenu title="Meu perfil" aria-label="Exemplo de menu lateral" className="max-w-xs">
          <SideMenuItem icon={Icons.ProfileIcon} href="#ds-navigation" active>
            Item ativo
          </SideMenuItem>
          <SideMenuItem icon={Icons.WalletIcon} href="#ds-navigation">
            Item padrão
          </SideMenuItem>
          <SideMenuItem icon={Icons.SupportIcon} disabled>
            Item desabilitado
          </SideMenuItem>
        </SideMenu>
      </Section>

      <Section id="ds-surfaces" title="Superfícies e estados de carregamento">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card</CardTitle>
              <CardDescription>Superfície em --card com raio lg.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  <Icons.AvatarIcon aria-hidden="true" strokeWidth={1.5} size={20} />
                </AvatarFallback>
              </Avatar>
              <Badge>Selo</Badge>
              <Badge variant="outline">Contorno</Badge>
            </CardContent>
          </Card>
          <div role="status" className="flex flex-col gap-3" aria-busy="true" aria-label="Exemplo de carregamento">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <Separator />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Section>
    </PageContainer>
  )
}
