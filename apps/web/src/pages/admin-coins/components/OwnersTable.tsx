import { Link } from '@tanstack/react-router'
import type { OwnersPage } from '@/domains/coins-admin'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** Read-only list of owners; each one opens its detail through the router (a full page load would end the session). */
export function OwnersTable({ owners }: { owners: OwnersPage['owners'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-body">
        <caption className="sr-only">Donos de saldo de moedas</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-4 font-bold">
              Dono
            </th>
            <th scope="col" className="py-2 font-bold">
              Última movimentação
            </th>
          </tr>
        </thead>
        <tbody>
          {owners.map((owner) => (
            <tr key={owner.ownerId} className="border-b border-border">
              <td className="py-2 pr-4">
                <Link to="/admin/coins/$ownerId" params={{ ownerId: owner.ownerId }} className="text-primary underline">
                  {owner.ownerId}
                </Link>
              </td>
              <td className="py-2 text-muted-foreground">{dateFormat.format(new Date(owner.updatedAt))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
