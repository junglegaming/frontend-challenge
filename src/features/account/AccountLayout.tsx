import type { ReactNode } from 'react';
import { ActiveLink } from '@/components/ui/active-link';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useSession } from '@/lib/session/state';
import { toast } from 'sonner';
import ProfileIcon from '@/assets/profile.svg?react';
import LocationIcon from '@/assets/location.svg?react';
import CartIcon from '@/assets/cart_small.svg?react';
import HeartIcon from '@/assets/heart.svg?react';
import OfferIcon from '@/assets/offer.svg?react';
import DownloadIcon from '@/assets/download.svg?react';
import DangerIcon from '@/assets/danger.svg?react';
import LogoutIcon from '@/assets/logout.svg?react';

const menuList = [
  [<CartIcon />, 'Atividade'],
  [<HeartIcon />, 'Lista de, interesse'],
  [<OfferIcon />, 'Ofertas'],
  [<DownloadIcon />, 'Arquivos, baixados'],
  [<DangerIcon />, 'Suporte'],
] as const;

export function AccountLayout({ children }: { children: ReactNode }) {
  const { logout } = useSession();
  return (
    <div className="grid min-w-0 items-start gap-7 lg:grid-cols-4">
      <aside className="min-w-0">
        <nav
          aria-label="Minha conta"
          className="bg-surface-card text-accent text-body grid grid-cols-2 items-start pt-2 lg:flex lg:flex-col"
        >
          <h2 className="text-body-18-bold mb-2.5 ml-2.5">Meu perfil</h2>
          <ActiveLink
            to="/profile"
            className="text-accent flex items-center gap-4 self-stretch pt-2 pb-2 pl-6 after:inset-y-0 after:h-auto after:w-1.5"
          >
            <ProfileIcon />
            Dados do perfil
          </ActiveLink>
          <ActiveLink
            to="/wallets"
            className="text-accent flex items-center gap-4 self-stretch pt-2 pb-2 pl-6 after:inset-y-0 after:h-auto after:w-1.5"
          >
            <LocationIcon />
            Carteiras
          </ActiveLink>
          {menuList.map(([icon, label]) => (
            <span
              key={label}
              aria-disabled="true"
              className="col-span-2 flex items-center gap-4 px-6 py-2"
            >
              {icon}
              {label}
            </span>
          ))}
          <button
            className="flex items-center gap-4 px-6 py-2"
            onClick={() =>
              void logout()
                .then(() => toast.success('Sessão encerrada.'))
                .catch(() => toast.error('Sessão encerrada neste dispositivo.'))
            }
          >
            <LogoutIcon /> Sair
          </button>
        </nav>
      </aside>
      <section className="min-w-0 lg:col-span-3">{children}</section>
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando conta"
      className="grid min-w-0 md:grid-cols-2"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i}>
          <span aria-hidden="true">Carregando campo…</span>
          <Input disabled aria-hidden="true" tabIndex={-1} />
        </Skeleton>
      ))}
    </div>
  );
}
