import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { WalletForm, WALLETS_QUERY_KEY, type Wallet } from '@/domains/wallets'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'

export function SecondaryWalletSection({ primary, secondary }: { primary?: Wallet; secondary?: Wallet }) {
  const [adding, setAdding] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const queryClient = useQueryClient()

  if (!adding && !secondary) {
    return (
      <div className="flex items-center justify-between border-t border-border pt-6">
        <div>
          <h2 className="text-title font-bold">Carteira secundária</h2>
          <p className="text-muted-foreground">Você ainda não adicionou uma carteira secundária.</p>
        </div>
        <Button variant="link" onClick={() => setAdding(true)} disabled={!primary}>
          Adicionar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-title font-bold">Carteira secundária</h2>
        {!secondary && primary && (
          <label htmlFor="same-as-primary" className="flex cursor-pointer items-center gap-2 text-body">
            <Checkbox
              id="same-as-primary"
              checked={sameAsPrimary}
              onCheckedChange={(checked) => setSameAsPrimary(checked === true)}
            />
            Igual à carteira principal
          </label>
        )}
      </div>
      <WalletForm
        key={sameAsPrimary ? 'copy' : 'blank'}
        slot="secondary"
        wallet={secondary}
        defaultValues={sameAsPrimary && primary ? { label: primary.label, provider: primary.provider, address: primary.address, networks: primary.networks } : undefined}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: WALLETS_QUERY_KEY })
          setAdding(false)
        }}
      />
    </div>
  )
}
