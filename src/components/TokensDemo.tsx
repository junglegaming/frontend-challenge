import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ThemeControls } from './ThemeControls';
import { Button } from './ui/button';
import { IconBadge } from './ui/icon-badge';
import CartIcon from '@/assets/cart.svg?react';
import { QuantityStepper } from './shared/QuantityStepper';

function CopyTypographyClass({ value }: { value: string }) {
  const [status, setStatus] = useState('');
  const copied = status === `Classe ${value} copiada.`;

  return (
    <span className="mt-1 flex items-center gap-1">
      <code className="min-w-0 break-words">{value}</code>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Copiar classe ${value}`}
        title={`Copiar ${value}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setStatus(`Classe ${value} copiada.`);
          } catch {
            setStatus('Não foi possível copiar. Tente novamente.');
          }
        }}
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </span>
  );
}

function QuantityStepperDemo() {
  const [quantity, setQuantity] = useState(2);
  return (
    <section aria-label="QuantityStepper size sm">
      <h2 className="text-body-lg-bold">QuantityStepper · size="sm"</h2>
      <QuantityStepper
        size="sm"
        value={quantity}
        max={5}
        onChange={setQuantity}
      />
    </section>
  );
}

export const TokensDemo = () => {
  return (
    <div /* className="bg-ink text-foreground mx-auto min-h-screen max-w-7xl space-y-12 p-6 font-mono md:p-12" */
    >
      {/* Header */}
      <header className="border-border space-y-2 border-b pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-micro text-primary border-primary/30 rounded-sm border px-2 py-0.5 font-medium tracking-wider uppercase">
            Design Tokens & Theme Foundation
          </span>
          <span className="text-tiny text-text-secondary">
            NFT Marketplace
          </span>
        </div>
        <h1 className="text-display">Design Tokens Showcase</h1>
        <p className="text-body text-text-secondary">
          Fonte única: <strong className="text-foreground">Roboto Mono</strong>{' '}
          · Paleta Dark Quente · Tokens Tailwind v4 & shadcn/ui
        </p>
      </header>

      <section
        className="border-border space-y-4 border-b py-6"
        aria-label="Badge de contador"
      >
        <h2 className="text-body-lg-bold">Badge de contador</h2>
        <IconBadge count={6}>
          <CartIcon aria-hidden="true" />
        </IconBadge>
      </section>
      {/* 1. Typography */}
      <QuantityStepperDemo />
      <section className="space-y-6">
        <h2 className="text-h2 text-text-accent border-border-soft border-b pb-2">
          1. Tipografia (Roboto Mono — 100% dos textos)
        </h2>
        <div className="bg-surface-card border-border grid gap-4 rounded-lg border p-6">
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Display / 43 Bold
              <CopyTypographyClass value="text-display" />
            </span>
            <span className="text-display">The NFT Marketplace NFT 43px</span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Display-2 / 32 Bold
              <CopyTypographyClass value="text-display-2" />
            </span>
            <span className="text-display-2">
              Discover Rare Digital Art 32px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              H1 / 28 Bold
              <CopyTypographyClass value="text-h1" />
            </span>
            <span className="text-h1">Featured Collections 28px</span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              H2 / 24 Bold
              <CopyTypographyClass value="text-h2" />
            </span>
            <span className="text-h2">Recent Transactions 24px</span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Title / 20 Regular
              <CopyTypographyClass value="text-title" />
            </span>
            <span className="text-title">Cyber Samurai #0492 — 20px</span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body / 18 Bold · lh 16 · tracking 0% · usos: 95
              <CopyTypographyClass value="text-body-18-bold" />
            </span>
            <span className="text-body-18-bold">
              Bold body text — 18px / 16px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body / 18 Regular · lh 16 · tracking 0% · usos: 10
              <CopyTypographyClass value="text-body-18-regular" />
            </span>
            <span className="text-body-18-regular">
              Regular body text — 18px / 16px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body / 17 Bold · lh 16 · tracking 0%
              <CopyTypographyClass value="text-body-17-bold" />
            </span>
            <span className="text-body-17-bold">
              Bold body text — 17px / 16px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body / 17 Regular · lh 24 · tracking 0%
              <CopyTypographyClass value="text-body-17-regular" />
            </span>
            <span className="text-body-17-regular">
              Regular body text — 17px / 24px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body-lg / 16 Bold
              <CopyTypographyClass value="text-body-lg-bold" />
            </span>
            <span className="text-body-lg-bold">
              Large body text for descriptions and highlights — 16px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body-lg / 16 Medium
              <CopyTypographyClass value="text-body-lg-medium" />
            </span>
            <span className="text-body-lg-medium">
              Large body text for descriptions and highlights — 16px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body-lg / 16 Regular
              <CopyTypographyClass value="text-body-lg" />
            </span>
            <span className="text-body-lg">
              Large body text for descriptions and highlights — 16px
            </span>
          </div>

          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body / 15 Regular
              <CopyTypographyClass value="text-body" />
            </span>
            <span className="text-body">
              Standard body text across the catalog and cards — 15px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body combo / 15 Medium · lh 16 · tracking 0% · usos: 6
              <CopyTypographyClass value="text-body-combo" />
            </span>
            <span className="text-body-combo">
              Medium body combo text — 15px / 16px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body / 14 Regular · lh 24
              <CopyTypographyClass value="text-body-regular" />
            </span>
            <span className="text-body-regular">
              Regular body text — 14px / 24px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body / 14 Medium · lh 16
              <CopyTypographyClass value="text-body-medium" />
            </span>
            <span className="text-body-medium">
              Medium body text — 14px / 16px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body / 14 Bold · lh 16 · tracking 0%
              <CopyTypographyClass value="text-body-bold" />
            </span>
            <span className="text-body-bold">Bold body text — 14px / 16px</span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Body-sm / 14 Regular
              <CopyTypographyClass value="text-body-sm" />
            </span>
            <span className="text-body-sm">
              Small body text for secondary details and metadata — 14px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Caption / 12 Bold · lh 14 · tracking 0%
              <CopyTypographyClass value="text-caption-bold" />
            </span>
            <span className="text-caption-bold">
              Bold caption text — 12px / 14px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Caption / 13
              <CopyTypographyClass value="text-caption" />
            </span>
            <span className="text-caption text-text-secondary">
              Caption notes, inputs helper labels — 13px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Tiny / 12
              <CopyTypographyClass value="text-tiny" />
            </span>
            <span className="text-tiny text-text-secondary">
              Tiny badges and tags — 12px
            </span>
          </div>
          <div className="border-border/50 flex flex-col justify-between gap-2 border-b pb-3 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Tiny / 9 Bold · lh 11.9 · tracking 0%
              <CopyTypographyClass value="text-tiny-bold" />
            </span>
            <span className="text-tiny-bold">
              Bold tiny text — 9px / 11.9px
            </span>
          </div>
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-baseline">
            <span className="text-tiny text-text-secondary w-44">
              Micro / 10 Medium
              <CopyTypographyClass value="text-micro" />
            </span>
            <span className="text-micro text-text-secondary font-medium">
              Micro timestamps and status tags — 10px
            </span>
          </div>
        </div>
      </section>

      {/* 2. Cores & Superfícies */}
      <section className="space-y-6">
        <h2 className="text-h2 text-text-accent border-border-soft border-b pb-2">
          2. Cores e Superfícies (Dark Quente)
        </h2>

        {/* Superfícies & Base */}
        <div className="space-y-3">
          <h3 className="text-body-lg text-foreground font-bold">
            Camadas de Superfície & Fundo
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-ink border-border rounded-md border p-4">
              <div className="text-micro text-text-secondary">Fundo Base</div>
              <div className="text-body-sm mt-1 font-bold">ink</div>
              <div className="text-tiny text-text-secondary">#140D0A</div>
            </div>
            <div className="bg-surface-card border-border rounded-md border p-4">
              <div className="text-micro text-text-secondary">
                Cards / Painéis
              </div>
              <div className="text-body-sm mt-1 font-bold">surface-card</div>
              <div className="text-tiny text-text-secondary">#241612</div>
            </div>
            <div className="bg-surface-raised border-border rounded-md border p-4">
              <div className="text-micro text-text-secondary">
                Hover / Dropdown
              </div>
              <div className="text-body-sm mt-1 font-bold">surface-raised</div>
              <div className="text-tiny text-text-secondary">#2F1D15</div>
            </div>
            <div className="bg-surface-dark border-border rounded-md border p-4">
              <div className="text-micro text-text-secondary">
                Áreas Internas
              </div>
              <div className="text-body-sm mt-1 font-bold">surface-dark</div>
              <div className="text-tiny text-text-secondary">#38220F</div>
            </div>
          </div>
        </div>

        {/* Primárias & Destaques */}
        <div className="space-y-3">
          <h3 className="text-body-lg text-foreground font-bold">
            Primárias & Destaques
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-primary text-ink rounded-md p-4">
              <div className="text-micro opacity-80">CTA Primário</div>
              <div className="text-body-sm mt-1 font-bold">primary</div>
              <div className="text-tiny opacity-80">#D28A4C</div>
            </div>
            <div className="bg-primary-light text-ink rounded-md p-4">
              <div className="text-micro opacity-80">Hover Primário</div>
              <div className="text-body-sm mt-1 font-bold">primary-light</div>
              <div className="text-tiny opacity-80">#DD9A5F</div>
            </div>
            <div className="bg-primary-dark text-ink rounded-md p-4">
              <div className="text-micro opacity-80">Active Primário</div>
              <div className="text-body-sm mt-1 font-bold">primary-dark</div>
              <div className="text-tiny opacity-80">#C47B3E</div>
            </div>
            <div className="bg-secondary text-ink rounded-md p-4">
              <div className="text-micro opacity-80">Secundária</div>
              <div className="text-body-sm mt-1 font-bold">secondary</div>
              <div className="text-tiny opacity-80">#B39463</div>
            </div>
          </div>
        </div>

        {/* Textos & Bordas */}
        <div className="space-y-3">
          <h3 className="text-body-lg text-foreground font-bold">
            Textos & Bordas
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-surface-card border-border rounded-md border p-4">
              <span className="text-foreground text-body-sm block font-bold">
                Foreground #F5F1EB
              </span>
              <span className="text-micro text-text-secondary">
                Texto principal
              </span>
            </div>
            <div className="bg-surface-card border-border rounded-md border p-4">
              <span className="text-text-secondary text-body-sm block font-bold">
                Secondary #CFB28C
              </span>
              <span className="text-micro text-text-secondary">
                Texto secundário
              </span>
            </div>
            <div className="bg-surface-card border-border rounded-md border p-4">
              <span className="text-text-accent text-body-sm block font-bold">
                Accent #E89B55
              </span>
              <span className="text-micro text-text-secondary">
                Links & destaques
              </span>
            </div>
            <div className="bg-surface-card border-border-soft rounded-md border p-4">
              <span className="text-body-sm text-foreground block font-bold">
                Borda Soft #55321F
              </span>
              <span className="text-micro text-text-secondary">
                Borda padrão é #3F2319
              </span>
            </div>
          </div>
        </div>

        {/* Cores de Status */}
        <div className="space-y-3">
          <h3 className="text-body-lg text-foreground font-bold">
            Status & Feedback
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-surface-card border-amber/40 text-amber rounded-md border p-4">
              <div className="text-body-sm font-bold">Amber (Em alta)</div>
              <div className="text-micro opacity-80">#E3A44E</div>
            </div>
            <div className="bg-surface-card border-coral/40 text-coral rounded-md border p-4">
              <div className="text-body-sm font-bold">Coral (Preços)</div>
              <div className="text-micro opacity-80">#EA6B4F</div>
            </div>
            <div className="bg-surface-card border-success/40 text-success rounded-md border p-4">
              <div className="text-body-sm font-bold">Success (Confirmado)</div>
              <div className="text-micro opacity-80">#00A66C</div>
            </div>
            <div className="bg-surface-card border-error/40 text-error rounded-md border p-4">
              <div className="text-body-sm font-bold">Error (Recusado)</div>
              <div className="text-micro opacity-80">#ED1B2E</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Componente Button */}
      <section className="space-y-6">
        <h2 className="text-h2 text-text-accent border-border-soft border-b pb-2">
          3. Componente Button (shadcn adaptado ao tema)
        </h2>
        <div className="bg-surface-card border-border space-y-6 rounded-lg border p-6">
          <div className="space-y-3">
            <h3 className="text-body-sm text-text-secondary font-bold uppercase">
              Variantes
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Primary (Default)</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="pill">Pill Variant</Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-body-sm text-text-secondary font-bold uppercase">
              Tamanhos
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="xsm">Extra Small (xsm) · 32px</Button>
              <Button size="sm">Small (sm) · 36px</Button>
              <Button size="default">Default / Medium · 40px</Button>
              <Button size="lg">Large (lg) · 48px</Button>
              <div className="flex flex-col items-center gap-2">
                <Button size="icon" aria-label="Ação">
                  ★
                </Button>
                <span className="text-tiny text-text-secondary">
                  Icon · 40px
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button size="icon-sm" aria-label="Ação pequena">
                  ★
                </Button>
                <span className="text-tiny text-text-secondary">
                  Icon Small · 32px
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-body-sm text-text-secondary font-bold uppercase">
              Estados
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button disabled>Disabled Button</Button>
              <Button variant="secondary" disabled>
                Disabled Secondary
              </Button>
              <Button variant="danger" disabled>
                Disabled Danger
              </Button>
            </div>
          </div>

          <div className="max-w-sm space-y-3">
            <h3 className="text-body-sm text-text-secondary font-bold uppercase">
              Full Width
            </h3>
            <Button size="full">Comprar Agora (Full Width) · 40px</Button>
          </div>
        </div>
      </section>

      {/* 4. Raios, Sombras e Efeitos */}
      <section className="space-y-6">
        <h2 className="text-h2 text-text-accent border-border-soft border-b pb-2">
          4. Raios de Borda, Sombras & Shimmer
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Raios */}
          <div className="bg-surface-card border-border space-y-4 rounded-lg border p-6">
            <h3 className="text-body-sm text-text-secondary font-bold uppercase">
              Raios de Borda
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-surface-raised border-border text-micro rounded-sm border px-3 py-1.5">
                sm (4px)
              </div>
              <div className="bg-surface-raised border-border text-micro rounded-md border px-3 py-1.5">
                md (8px)
              </div>
              <div className="bg-surface-raised border-border text-micro rounded-lg border px-3 py-1.5">
                lg (16px)
              </div>
              <div className="bg-surface-raised border-border text-micro rounded-xl border px-3 py-1.5">
                xl (20px)
              </div>
              <div className="bg-surface-raised border-border text-micro rounded-2xl border px-3 py-1.5">
                2xl (24px)
              </div>
              <div className="bg-surface-raised border-border rounded-pill text-micro border px-3 py-1.5">
                pill
              </div>
            </div>
          </div>

          {/* Sombras */}
          <div className="bg-surface-card border-border space-y-4 rounded-lg border p-6">
            <h3 className="text-body-sm text-text-secondary font-bold uppercase">
              Sombras Padrão
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="bg-surface-raised shadow-card border-border text-micro rounded-md border p-3">
                Card Shadow
              </div>
              <div className="bg-primary/20 shadow-cta border-primary/40 text-micro text-primary rounded-md border p-3">
                CTA Glow
              </div>
            </div>
          </div>

          {/* Skeleton Shimmer */}
          <div className="bg-surface-card border-border space-y-4 rounded-lg border p-6">
            <h3 className="text-body-sm text-text-secondary font-bold uppercase">
              Skeleton Shimmer
            </h3>
            <div className="space-y-2">
              <div className="animate-shimmer h-6 w-3/4 rounded-md" />
              <div className="animate-shimmer h-4 w-1/2 rounded-md" />
            </div>
          </div>
        </div>
      </section>
      <ThemeControls />
    </div>
  );
};
