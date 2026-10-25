import { FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

/**
 * Painel de cenários do backend simulado. Opera via window.__kurioMock (camada de mocks),
 * que altera o db e emite pelo Socket.IO mockado — nunca mexe no cache da UI.
 */
export function DevPanel() {
  const [open, setOpen] = useState(false)
  const mock = typeof window !== 'undefined' ? window.__kurioMock : undefined
  if (!mock) return null

  const firstItem = () => mock.cartFirstItem()
  const withCartItem = (action: (nftId: string, editionId: NonNullable<ReturnType<typeof firstItem>>['editionId']) => void) => () => {
    const item = firstItem()
    if (item) action(item.nftId, item.editionId)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-24 left-0 z-50 size-8 rounded-l-none bg-background opacity-70 hover:opacity-100 md:top-auto md:bottom-4 md:left-4 md:size-10 md:rounded-l-sm md:opacity-100" aria-label="Abrir painel de cenários (mocks)">
          <FlaskConical aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Cenários simulados</SheetTitle>
          <SheetDescription>Backend MSW + Socket.IO. Trocar cenário recarrega a página.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dev-scenario">Cenário</Label>
            <select
              id="dev-scenario"
              className="h-10 rounded-sm border border-input bg-background px-2"
              defaultValue={mock.getScenario()}
              onChange={(event) => {
                mock.setScenario(event.target.value as Parameters<typeof mock.setScenario>[0])
                window.location.reload()
              }}
            >
              {Object.entries(mock.scenarios).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={withCartItem((nftId, editionId) => mock.changePrice(nftId, editionId))}>
            Subir preço do 1º item do carrinho
          </Button>
          <Button variant="outline" onClick={withCartItem((nftId, editionId) => mock.sellOut(nftId, editionId))}>
            Esgotar 1º item do carrinho
          </Button>
          <Button variant="outline" onClick={() => mock.duplicateLastEvent()}>
            Reenviar último evento (duplicado)
          </Button>
          <Button variant="outline" onClick={withCartItem((nftId) => mock.emitStaleEvent(nftId))}>
            Enviar evento antigo
          </Button>
          <Button variant="outline" onClick={() => mock.dropSocket()}>
            Derrubar conexão do socket
          </Button>
          <Button variant="outline" onClick={() => mock.expireSessions()}>
            Expirar sessão
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              mock.reset()
              window.location.assign('/')
            }}
          >
            Resetar dados (cenário conhecido)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
