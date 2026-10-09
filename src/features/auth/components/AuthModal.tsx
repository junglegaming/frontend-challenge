import { useRouter, useRouterState } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { sanitizeRedirect, locationHref } from '@/lib/session/guards';
import {
  authLocation,
  authBackground,
  restoreAuthFocus,
  type AuthMode,
} from '../navigation';
import { parseAuthSearch } from '../search-params';
import { LoginForm, SignupForm } from './AuthForms';
import GoogleIcon from '@/assets/google.svg?react';
import FacebookFilled from '@/assets/facebook_filled.svg?react';

function UnavailableActions() {
  return (
    <div className="grid gap-3">
      <div className="text-caption text-foreground mt-6 flex items-center gap-3">
        <span className="border-border-soft text-caption flex-1 border-t" />
        Ou continue com
        <span className="border-border-soft flex-1 border-t" />
      </div>
      <Button
        variant="outline"
        disabled
        aria-describedby="auth-unavailable"
        className="text-text-secondary text-caption w-full"
      >
        <span aria-hidden="true" className="font-bold">
          <GoogleIcon />
        </span>
        Continuar com Google
      </Button>
      <Button
        variant="outline"
        disabled
        aria-describedby="auth-unavailable"
        className="text-text-secondary text-caption w-full"
      >
        <span aria-hidden="true" className="font-bold">
          <FacebookFilled />
        </span>
        Continuar com Facebook
      </Button>
    </div>
  );
}

export function AuthModal() {
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.location });
  const { auth, redirect } = parseAuthSearch(location.search);
  const background =
    location.state.authBackground ?? authBackground(locationHref(location));
  const close = () => {
    void router.navigate({ href: background, replace: true });
  };
  const switchMode = (mode: AuthMode) => {
    void router.navigate({
      ...authLocation(background, mode, redirect),
      replace: true,
    });
  };
  const onSuccess = async () => {
    toast.success(
      auth === 'signup'
        ? 'Conta criada com sucesso.'
        : 'Login realizado com sucesso.'
    );
    await router.invalidate();
    await router.navigate({ href: sanitizeRedirect(redirect), replace: true });
  };
  return (
    <Dialog
      open={!!auth}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        aria-describedby="auth-description"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLInputElement>('[role="dialog"] input')
              ?.focus()
          );
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreAuthFocus();
        }}
        className="bg-ink border-primary text-foreground md:bg-surface-card fixed inset-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-b-4 px-7 py-16 md:inset-auto md:top-20 md:left-1/2 md:h-auto md:max-h-[calc(100dvh-6rem)] md:w-125 md:max-w-none md:-translate-x-1/2 md:px-20 md:py-12"
      >
        {auth === 'login' && (
          <div className="mx-auto mb-4 md:hidden">
            <Logo className="text-display-2 w-auto" />
          </div>
        )}
        <div className="mb-10 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            aria-current={auth === 'login' ? 'page' : undefined}
            className={`text-title hidden cursor-pointer md:block ${auth === 'login' ? 'text-accent' : 'text-foreground'}`}
          >
            Entrar
          </button>
          <span aria-hidden="true" className="hidden md:block">
            |
          </span>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            aria-current={auth === 'signup' ? 'page' : undefined}
            className={`text-title hidden cursor-pointer md:block ${auth === 'signup' ? 'text-primary' : 'text-foreground'}`}
          >
            Criar conta
          </button>
          <DialogTitle className="text-h2 text-center md:sr-only">
            {auth === 'signup' ? 'Cadastro' : 'Login'}
          </DialogTitle>
        </div>
        <DialogDescription
          id="auth-description"
          className="text-text-foreground text-caption mb-6 text-center"
        >
          {auth === 'signup'
            ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
            : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
        </DialogDescription>
        {auth === 'signup' ? (
          <SignupForm key="signup" onSuccess={onSuccess} />
        ) : auth === 'login' ? (
          <LoginForm key="login" onSuccess={onSuccess} />
        ) : null}
        <UnavailableActions />
      </DialogContent>
    </Dialog>
  );
}
