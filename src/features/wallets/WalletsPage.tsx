import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWalletRequestSchema } from '@/lib/http/schemas';
import { walletsOptions, createWallet, updateWallet } from './queries';
import {
  AccountLayout,
  AccountSkeleton,
} from '@/features/account/AccountLayout';
import {
  applyFormError,
  useServerErrorFocus,
} from '@/features/account/form-errors';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { FormTextField } from '@/components/shared/FormTextField';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { keyFactory } from '@/lib/query/keys';
import { getStoredSession } from '@/lib/session/storage';
import type { Wallet, CreateWalletRequest } from '@/types/api';

export function WalletsPage({ userId }: { userId: string }) {
  const query = useQuery(walletsOptions(userId));
  const client = useQueryClient();
  const [editor, setEditor] = useState<Wallet | 'new' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [promoting, setPromoting] = useState(false);
  const busy = useRef(false);
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: keyFactory.wallets(userId) });
    void client.invalidateQueries({ queryKey: keyFactory.profile(userId) });
  };
  async function promote(wallet: Wallet) {
    const session = getStoredSession();
    if (busy.current || session?.user.id !== userId) return;
    busy.current = true;
    setPromoting(true);
    setFeedback('');
    try {
      await updateWallet(wallet.id, { isPrimary: true });
      if (getStoredSession()?.token === session.token)
        setFeedback('Carteira promovida a principal.');
    } catch {
      if (getStoredSession()?.token === session.token)
        setFeedback('Não foi possível promover a carteira. Tente novamente.');
    } finally {
      busy.current = false;
      setPromoting(false);
      if (getStoredSession()?.token === session.token) invalidate();
    }
  }
  return (
    <AccountLayout>
      <h1>Carteiras</h1>
      {query.isError && query.data && (
        <ErrorState
          variant="compact"
          title="Não foi possível atualizar as carteiras"
          onRetry={() => void query.refetch()}
        />
      )}
      {query.isPending ? (
        <AccountSkeleton />
      ) : !query.data ? (
        <ErrorState
          title="Não foi possível carregar as carteiras"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          {!query.data.items.length && !editor && (
            <EmptyState
              title="Nenhuma carteira cadastrada"
              description="Cadastre sua carteira principal para comprar NFTs."
              actionLabel="Cadastrar carteira"
              onAction={() => setEditor('new')}
            />
          )}
          <div className="grid min-w-0 md:grid-cols-2">
            {[...query.data.items]
              .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
              .map((wallet) => (
                <article
                  key={wallet.id}
                  aria-label={wallet.label}
                  className="min-w-0"
                >
                  <h2>
                    {wallet.isPrimary
                      ? 'Carteira principal'
                      : 'Carteira secundária'}
                  </h2>
                  <p>{wallet.label}</p>
                  <p className="wrap-anywhere">{wallet.address}</p>
                  <p>
                    {wallet.network === 'ethereum' ? 'Ethereum' : 'Sepolia'}
                  </p>
                  {wallet.ensName && (
                    <p className="wrap-anywhere">{wallet.ensName}</p>
                  )}
                  {wallet.note && (
                    <p className="wrap-anywhere">{wallet.note}</p>
                  )}
                  <Button
                    disabled={!!editor || promoting}
                    onClick={() => setEditor(wallet)}
                  >
                    Editar
                  </Button>
                  {!wallet.isPrimary && (
                    <Button
                      disabled={!!editor || promoting}
                      aria-busy={promoting}
                      onClick={() => void promote(wallet)}
                    >
                      Tornar principal
                    </Button>
                  )}
                </article>
              ))}
          </div>
          {!!query.data.items.length && !editor && (
            <Button
              disabled={query.data.items.length >= 2 || promoting}
              onClick={() => setEditor('new')}
            >
              Cadastrar carteira
            </Button>
          )}
          {query.data.items.length >= 2 && (
            <p>Limite de duas carteiras atingido.</p>
          )}
          {editor && (
            <WalletForm
              key={editor === 'new' ? 'new' : editor.id}
              userId={userId}
              wallet={editor === 'new' ? undefined : editor}
              first={!query.data.items.length}
              onCancel={() => setEditor(null)}
              onSaved={() => {
                setEditor(null);
                setFeedback('Carteira salva.');
                invalidate();
              }}
            />
          )}
        </>
      )}
      <p role="status" aria-live="polite">
        {feedback}
      </p>
    </AccountLayout>
  );
}

function WalletForm({
  wallet,
  userId,
  first,
  onCancel,
  onSaved,
}: {
  wallet?: Wallet;
  userId: string;
  first: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const form = useForm<CreateWalletRequest>({
    resolver: zodResolver(createWalletRequestSchema),
    defaultValues: {
      label: wallet?.label ?? '',
      address: wallet?.address ?? '',
      network: wallet?.network ?? 'ethereum',
      isPrimary: wallet?.isPrimary ?? first,
      ensName: wallet?.ensName ?? '',
      note: wallet?.note ?? '',
    },
  });
  const [feedback, setFeedback] = useState('');
  useServerErrorFocus(form);
  const busy = useRef(false);
  const submit = async (data: CreateWalletRequest) => {
    const session = getStoredSession();
    if (busy.current || session?.user.id !== userId) return;
    busy.current = true;
    setFeedback('');
    try {
      if (wallet)
        await updateWallet(wallet.id, {
          label: data.label,
          network: data.network,
          ensName: data.ensName,
          note: data.note,
        });
      else await createWallet(data);
      if (getStoredSession()?.token === session.token) onSaved();
    } catch (error) {
      if (getStoredSession()?.token === session.token)
        setFeedback(
          applyFormError(form, error, {
            label: 'label',
            address: 'address',
            network: 'network',
            ensName: 'ensName',
            note: 'note',
          })
        );
    } finally {
      busy.current = false;
    }
  };
  return (
    <Form {...form}>
      <form
        aria-label={wallet ? 'Editar carteira' : 'Cadastrar carteira'}
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        noValidate
        aria-busy={form.formState.isSubmitting}
      >
        <h2>{wallet ? 'Editar carteira' : 'Cadastrar carteira'}</h2>
        <fieldset
          disabled={form.formState.isSubmitting}
          className="grid min-w-0 md:grid-cols-2"
        >
          <FormTextField
            control={form.control}
            name="label"
            label="Apelido da carteira"
            labelHidden={false}
            required
          />
          <FormTextField
            control={form.control}
            name="address"
            label="Endereço"
            labelHidden={false}
            required
            readOnly={!!wallet}
          />
          <FormField
            control={form.control}
            name="network"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rede</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="sepolia">Sepolia</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Rede da carteira cadastrada.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormTextField
            control={form.control}
            name="ensName"
            label="Nome ENS (opcional)"
            labelHidden={false}
          />
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Observação (opcional)</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormDescription>
                  Informação opcional sobre esta carteira.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" aria-busy={form.formState.isSubmitting}>
            Salvar carteira
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </fieldset>
        <p role="status" aria-live="polite">
          {feedback}
        </p>
      </form>
    </Form>
  );
}
