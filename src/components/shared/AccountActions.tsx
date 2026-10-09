import { Link, useRouter } from '@tanstack/react-router';
import { useSession } from '@/lib/session/state';
import { openAuth } from '@/features/auth/navigation';
import { toast } from 'sonner';
import SignIn from '@/assets/signin.svg?react';
import { Button } from '@/components/ui/button';

export function AccountActions() {
  const router = useRouter();
  const { session, logout } = useSession();
  return session ? (
    <div className="flex items-center gap-2">
      <Link
        to="/profile"
        aria-label={`Conta de ${session.user.name}`}
        className="text-caption max-w-24 truncate"
      >
        {session.user.name}
      </Link>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          void logout()
            .then(() => toast.success('Sessão encerrada.'))
            .catch(() =>
              toast.error(
                'Sessão encerrada neste dispositivo. Não foi possível avisar o servidor.'
              )
            )
        }
      >
        Sair
      </Button>
    </div>
  ) : (
    <Button
      size="sm"
      data-auth-trigger
      onClick={(event) =>
        void openAuth(router, 'login', undefined, event.currentTarget)
      }
      className="text-ink text-body-lg-medium flex items-center gap-1 px-2.25"
    >
      <SignIn aria-hidden="true" />
      Entrar
    </Button>
  );
}
