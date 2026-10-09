import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { FormTextField } from '@/components/shared/FormTextField';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { collectorFormSchema, type CollectorFormValues } from './form-schema';
import { restoreCheckoutDraft, saveCheckoutDraft } from './draft';
import { updateProfile } from '@/features/profile/queries';
import { updateWallet } from '@/features/wallets/queries';
import { getStoredSession, storeSession } from '@/lib/session/storage';
import { keyFactory } from '@/lib/query/keys';
import type { Profile, Wallet, AppError } from '@/types/api';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';

interface CollectorFormProps {
  profile: Profile;
  wallet: Wallet;
  userId: string;
  coupon?: string;
  children: ReactNode;
  onSaved: () => void;
  blocked: boolean;
  walletPicker: ReactNode;
  onState: (state: {
    ready: boolean;
    identity: string;
    network: Wallet['network'];
  }) => void;
}
const textFields = [
  ['name', 'Nome de exibição', true, 'name'],
  ['username', 'Nome de usuário', true, 'username'],
  ['profileName', 'Nome do perfil', true, 'off'],
  ['email', 'E-mail', true, 'email'],
  ['address', 'Endereço da carteira', true, 'off'],
  ['secondaryIdentity', 'ENS ou carteira secundária (opcional)', false, 'off'],
  ['referralCode', 'Código de indicação', true, 'off'],
] as const;
export function CollectorForm({
  profile,
  wallet,
  userId,
  coupon,
  onState,
  onSaved,
  children,
  blocked,
  walletPicker,
}: CollectorFormProps) {
  const [otherWallet, setOtherWallet] = useState(false);
  const [draft] = useState(() => restoreCheckoutDraft(userId));
  const defaults: CollectorFormValues = {
    name: draft?.collector?.name ?? profile.name,
    username: draft?.collector?.username ?? profile.username ?? 'colecionador',
    profileName:
      draft?.collector?.profileName ?? profile.profileName ?? profile.name,
    email: draft?.collector?.email ?? profile.email,
    referralCode:
      (draft?.collector?.referralCode ?? profile.referralCode) || 'NFT Marketplace',
    address: wallet.address,
    network: wallet.network,
    provider: wallet.provider ?? 'metamask',
    secondaryIdentity: wallet.secondaryIdentity ?? '',
    ensName: wallet.ensName || 'nft-marketplace.eth',
    note: wallet.note ?? '',
    ...(draft?.walletId === wallet.id ? draft.collector : {}),
  };
  const form = useForm<CollectorFormValues>({
    resolver: zodResolver(collectorFormSchema),
    defaultValues: defaults,
  });
  const values = useWatch({ control: form.control });
  const client = useQueryClient();
  const saving = useRef(false);
  const [feedback, setFeedback] = useState('');
  const [saved, setSaved] = useState(false);
  const identity = JSON.stringify([
    values.address,
    values.network,
    values.provider,
  ]);
  const dirty = form.formState.isDirty;
  const pending = form.formState.isSubmitting;
  useEffect(() => {
    const current = form.getValues();
    if (getStoredSession()?.user.id === userId)
      saveCheckoutDraft({
        userId,
        walletId: wallet.id,
        network: current.network,
        coupon,
        collector: current,
      });
    onState({
      ready:
        saved &&
        !dirty &&
        !pending &&
        collectorFormSchema.safeParse(current).success,
      identity,
      network: current.network,
    });
  }, [
    values,
    form,
    userId,
    wallet.id,
    coupon,
    onState,
    saved,
    dirty,
    pending,
    identity,
  ]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(async (data) => {
      const session = getStoredSession();
      if (session?.user.id !== userId || saving.current) return;
      saving.current = true;
      setFeedback('');
      form.clearErrors();
      try {
        const updated = await updateProfile({
          name: data.name,
          username: data.username,
          profileName: data.profileName,
          email: data.email,
          referralCode: data.referralCode,
        });
        if (getStoredSession()?.token !== session.token) return;
        client.setQueryData(keyFactory.profile(userId), updated);
        storeSession({
          ...session,
          user: {
            ...session.user,
            name: updated.name,
            username: updated.username,
            email: updated.email,
            profileName: updated.profileName,
            referralCode: updated.referralCode,
          },
        });
        await updateWallet(wallet.id, {
          address: data.address,
          network: data.network,
          provider: data.provider,
          secondaryIdentity: data.secondaryIdentity,
          ensName: data.ensName,
          note: data.note,
        });
        if (getStoredSession()?.token !== session.token) return;
        form.reset(data);
        setSaved(true);
        setFeedback('');
        onSaved();
      } catch (failure) {
        if (getStoredSession()?.token !== session.token) return;
        setSaved(false);
        const error = failure as AppError;
        if (error.kind === 'validation' || error.kind === 'http') {
          for (const [field, messages] of Object.entries(error.fields ?? {})) {
            if (field in data)
              form.setError(field as keyof CollectorFormValues, {
                type: 'server',
                message: messages[0],
              });
          }
        }
        setFeedback(
          'Não foi possível atualizar todos os dados da conta. Confira os campos e tente novamente. Alterações já aceitas pelo servidor foram mantidas.'
        );
      } finally {
        saving.current = false;
        if (getStoredSession()?.token === session.token) {
          void client.invalidateQueries({
            queryKey: keyFactory.profile(userId),
          });
          void client.invalidateQueries({
            queryKey: keyFactory.wallets(userId),
          });
        }
      }
    })(event);
  };
  const renderText = (names: readonly (typeof textFields)[number][0][]) =>
    names
      .map((name) => textFields.find((field) => field[0] === name)!)
      .map(([name, label, required, autoComplete]) => (
        <td key={name} className="align-top">
          <FormTextField
            control={form.control}
            name={name}
            label={label}
            labelHidden={false}
            required={required}
            autoComplete={autoComplete}
            type={name === 'email' ? 'email' : 'text'}
            placeholder={
              name === 'address' ? 'Endereço 0x da carteira' : undefined
            }
          />
        </td>
      ));
  return (
    <Form {...form}>
      <form
        aria-label="Perfil do colecionador"
        onSubmit={submit}
        noValidate
        aria-busy={pending}
        className="[&_label]:text-body [&_span[aria-hidden='true']]:text-coral [&_span[aria-hidden='true']]:text-title [&_label]:leading-7"
      >
        <fieldset disabled={pending} className="contents">
          <div className="grid min-w-0 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <legend className="text-body-17-bold">
                Perfil do colecionador
              </legend>
              <table
                role="presentation"
                className="w-full table-fixed border-separate border-spacing-x-0 border-spacing-y-3 [&_td+td]:pl-6"
              >
                <tbody>
                  <tr>{renderText(['name', 'username'])}</tr>
                  <tr>
                    <td className="align-top">
                      <FormField
                        control={form.control}
                        name="network"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Rede<span aria-hidden="true"> *</span>
                            </FormLabel>
                            <Select
                              required
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger
                                  ref={field.ref}
                                  onBlur={field.onBlur}
                                >
                                  <SelectValue placeholder="Selecione uma rede" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ethereum">
                                  Ethereum
                                </SelectItem>
                                <SelectItem value="sepolia">Sepolia</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    {renderText(['profileName'])}
                  </tr>
                  <tr>{renderText(['address', 'secondaryIdentity'])}</tr>
                  <tr>
                    <td className="align-top">
                      <FormField
                        control={form.control}
                        name="provider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Tipo de carteira<span aria-hidden="true"> *</span>
                            </FormLabel>
                            <Select
                              required
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger
                                  ref={field.ref}
                                  onBlur={field.onBlur}
                                >
                                  <SelectValue placeholder="Selecione uma carteira" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="metamask">
                                  MetaMask
                                </SelectItem>
                                <SelectItem value="walletconnect">
                                  WalletConnect
                                </SelectItem>
                                <SelectItem value="coinbase">
                                  Coinbase Wallet
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    {renderText(['referralCode'])}
                  </tr>
                  <tr>
                    {renderText(['email'])}
                    <td className="align-top">
                      <FormField
                        control={form.control}
                        name="ensName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Nome ENS<span aria-hidden="true"> *</span>
                            </FormLabel>
                            <Select
                              required
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger
                                  ref={field.ref}
                                  onBlur={field.onBlur}
                                >
                                  <SelectValue placeholder="Selecione o ENS" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from(
                                  new Set(
                                    [
                                      defaults.ensName,
                                      'nft-marketplace.eth',
                                      'colecionador.eth',
                                    ].filter(Boolean)
                                  )
                                ).map((name) => (
                                  <SelectItem key={name} value={name}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={2} className="align-top">
                      <FieldGroup>
                        <Field orientation="horizontal">
                          <Checkbox
                            id="terms-checkbox-basic"
                            name="terms-checkbox-basic"
                            checked={otherWallet}
                            onCheckedChange={(checked) => {
                              console.debug(checked);
                              setOtherWallet(!!checked);
                            }}
                          />
                          <FieldLabel htmlFor="terms-checkbox-basic">
                            Usar outra carteira?
                          </FieldLabel>
                        </Field>
                        {otherWallet && walletPicker}
                      </FieldGroup>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={1} className="align-top">
                      <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Observação do colecionador (opcional)
                            </FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={5} maxLength={280} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="min-w-0">
              {children}
              <Button
                type="submit"
                disabled={pending || blocked}
                aria-busy={pending}
                className="mt-6 w-full"
              >
                Confirmar compra
              </Button>
            </div>
          </div>
        </fieldset>
        <div role="status" aria-live="polite">
          {feedback}
        </div>
      </form>
    </Form>
  );
}
