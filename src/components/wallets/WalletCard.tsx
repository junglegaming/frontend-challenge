import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { Wallet, WalletSlot } from '@/schemas/wallet'
import { WalletConnection } from './WalletConnection'
import { WalletForm } from './WalletForm'

type Mode = 'closed' | 'empty' | 'copy'

interface WalletCardProps {
  slot: WalletSlot
  title: string
  description?: string
  emptyMessage?: string
  wallet: Wallet | undefined
  /** Carteira principal, copiada pela opção "Igual à carteira principal" da secundária. */
  source?: Wallet
  onSaved: (wallet: Wallet) => void
}

export function WalletCard({ slot, title, description, emptyMessage, wallet, source, onSaved }: WalletCardProps) {
  const [mode, setMode] = useState<Mode>('closed')
  const titleId = `wallet-${slot}-title`
  const copyId = `wallet-${slot}-copy`
  const isPrimary = slot === 'primary'
  const isEmptySecondary = !isPrimary && !wallet
  const showForm = isPrimary || Boolean(wallet) || mode !== 'closed'

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h2 id={titleId} className="text-base font-bold">
              {title}
            </h2>
            {wallet && <WalletConnection wallet={wallet} />}
          </div>
          {isEmptySecondary && (
            <div className="flex flex-wrap items-center gap-4">
              <RadioGroup value={mode === 'copy' ? 'copy' : ''} onValueChange={() => setMode('copy')} className="flex flex-row items-center gap-2">
                <RadioGroupItem value="copy" id={copyId} disabled={!source} />
                <Label htmlFor={copyId} className="font-normal">
                  Igual à carteira principal
                </Label>
              </RadioGroup>
              <Button type="button" variant="link" onClick={() => setMode('empty')} className="h-auto px-0 text-accent-text">
                Adicionar
              </Button>
            </div>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {isEmptySecondary && <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
      </div>

      {showForm && (
        <WalletForm
          key={wallet?.id ?? mode}
          slot={slot}
          wallet={wallet}
          source={mode === 'copy' ? source : undefined}
          onSaved={onSaved}
          onCancel={isEmptySecondary ? () => setMode('closed') : undefined}
        />
      )}
    </section>
  )
}
