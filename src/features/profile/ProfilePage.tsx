import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  profilePatchSchema,
  passwordRequestSchema,
  ensNameSchema,
  patchWalletRequestSchema,
} from '@/lib/http/schemas';
import { profileOptions, updateProfile, changePassword } from './queries';
import { walletsOptions, updateWallet } from '@/features/wallets/queries';
import {
  AccountLayout,
  AccountSkeleton,
} from '@/features/account/AccountLayout';
import {
  applyFormError,
  useServerErrorFocus,
} from '@/features/account/form-errors';
import { Form } from '@/components/ui/form';
import { FormTextField } from '@/components/shared/FormTextField';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/shared/ErrorState';
import { keyFactory } from '@/lib/query/keys';
import { getStoredSession, storeSession } from '@/lib/session/storage';
import type { Profile, Wallet } from '@/types/api';

const schema = z
  .object({
    name: profilePatchSchema.shape.name.unwrap(),
    username: profilePatchSchema.shape.username.unwrap(),
    email: z.email('E-mail inválido'),
    label: z.string(),
    ensName: ensNameSchema,
    avatarUrl: profilePatchSchema.shape.avatarUrl,
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.currentPassword || value.newPassword || value.confirmPassword) {
      const result = passwordRequestSchema.safeParse(value);
      if (!result.success)
        result.error.issues.forEach((issue) =>
          context.addIssue({ ...issue, code: 'custom' })
        );
      if (value.newPassword !== value.confirmPassword)
        context.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: 'As senhas devem ser iguais',
        });
    }
  });
type Values = z.infer<typeof schema>;

export function ProfilePage({ userId }: { userId: string }) {
  const profile = useQuery(profileOptions(userId));
  const wallets = useQuery(walletsOptions(userId));
  return (
    <AccountLayout>
      <h1 className="text-body-lg-bold mb-8">Perfil do colecionador</h1>
      {(profile.isError || wallets.isError) && profile.data && wallets.data && (
        <ErrorState
          variant="compact"
          title="Não foi possível atualizar a conta"
          onRetry={() => {
            void profile.refetch();
            void wallets.refetch();
          }}
        />
      )}
      {profile.isPending || wallets.isPending ? (
        <AccountSkeleton />
      ) : !profile.data || !wallets.data ? (
        <ErrorState
          title="Não foi possível carregar a conta"
          onRetry={() => {
            void profile.refetch();
            void wallets.refetch();
          }}
        />
      ) : (
        <ProfileForm
          key={userId}
          userId={userId}
          profile={profile.data}
          wallet={wallets.data.items.find((item) => item.isPrimary)}
        />
      )}
    </AccountLayout>
  );
}

function ProfileForm({
  profile,
  wallet,
  userId,
}: {
  profile: Profile;
  wallet?: Wallet;
  userId: string;
}) {
  const [baseline, setBaseline] = useState({ profile, wallet });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      username: profile.username ?? '',
      email: profile.email,
      label: wallet?.label ?? '',
      ensName: wallet?.ensName ?? '',
      avatarUrl: undefined,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  const client = useQueryClient();
  useServerErrorFocus(form);
  useEffect(() => {
    form.register('avatarUrl');
  }, [form]);
  const reading = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [feedback, setFeedback] = useState('');
  const busy = useRef(false);
  const avatar = useWatch({ control: form.control, name: 'avatarUrl' });
  const preview = avatar === undefined ? baseline.profile.avatarUrl : avatar;
  const invalidate = () => {
    void client.invalidateQueries({ queryKey: keyFactory.profile(userId) });
    void client.invalidateQueries({ queryKey: keyFactory.wallets(userId) });
  };
  const submit = async (data: Values) => {
    const session = getStoredSession();
    if (
      !session ||
      session.user.id !== userId ||
      busy.current ||
      readingFile ||
      fileError
    )
      return;
    if (baseline.wallet) {
      const parsed = patchWalletRequestSchema.safeParse({
        label: data.label,
        ensName: data.ensName,
      });
      if (!parsed.success) {
        form.setError('label', { message: parsed.error.issues[0].message });
        form.setFocus('label');
        return;
      }
    }
    busy.current = true;
    setFeedback('');
    const saved: string[] = [];
    let target: Record<string, keyof Values> = {
      name: 'name',
      username: 'username',
      email: 'email',
      avatarUrl: 'avatarUrl',
    };
    const current = () => getStoredSession()?.token === session.token;
    try {
      if (
        data.name !== baseline.profile.name ||
        data.username !== (baseline.profile.username ?? '') ||
        data.email !== baseline.profile.email ||
        data.avatarUrl !== undefined
      ) {
        const updated = await updateProfile({
          name: data.name,
          username: data.username,
          email: data.email,
          ...(data.avatarUrl !== undefined
            ? { avatarUrl: data.avatarUrl }
            : {}),
        });
        if (!current()) return;
        setBaseline((previous) => ({ ...previous, profile: updated }));
        storeSession({
          ...session,
          user: {
            ...session.user,
            name: updated.name,
            username: updated.username,
            email: updated.email,
            avatarUrl: updated.avatarUrl,
          },
        });
        form.resetField('avatarUrl', { defaultValue: undefined });
        saved.push('Dados do perfil');
      }
      target = { label: 'label', ensName: 'ensName' };
      if (
        baseline.wallet &&
        (data.label !== baseline.wallet?.label ||
          data.ensName !== (baseline.wallet?.ensName ?? ''))
      ) {
        const updated = await updateWallet(baseline.wallet!.id, {
          label: data.label,
          ensName: data.ensName,
        });
        if (!current()) return;
        setBaseline((previous) => ({ ...previous, wallet: updated }));
        saved.push('Carteira principal');
      }
      target = {
        currentPassword: 'currentPassword',
        newPassword: 'newPassword',
      };
      if (data.currentPassword || data.newPassword || data.confirmPassword) {
        await changePassword(data);
        if (!current()) return;
        form.setValue('currentPassword', '');
        form.setValue('newPassword', '');
        form.setValue('confirmPassword', '');
        saved.push('Senha');
      }
      setFeedback(
        saved.length
          ? `${saved.join(', ')}: alterações salvas.`
          : 'Nenhuma alteração para salvar.'
      );
    } catch (error) {
      if (current())
        setFeedback(
          `${saved.length ? `${saved.join(', ')} já salvo(s). ` : ''}${applyFormError(form, error, target)}`
        );
    } finally {
      busy.current = false;
      if (current()) invalidate();
    }
  };
  return (
    <Form {...form}>
      <form
        aria-label="Editar perfil"
        noValidate
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        aria-busy={form.formState.isSubmitting}
        className="[&_label]:text-body [&_label>span[aria-hidden]]:text-title [&_label>span[aria-hidden]]:text-coral [&_label]:flex [&_label]:items-center"
      >
        <fieldset disabled={form.formState.isSubmitting} className="min-w-0">
          <div className="mb-8 grid min-w-0 gap-x-7 gap-y-6 md:grid-cols-2">
            <FormTextField
              control={form.control}
              name="name"
              label="Nome de exibição"
              required
              labelHidden={false}
              autoComplete="name"
            />
            <FormTextField
              control={form.control}
              name="username"
              label="Nome de usuário"
              required
              labelHidden={false}
              autoComplete="username"
            />
            <FormTextField
              control={form.control}
              name="email"
              label="E-mail"
              type="email"
              required
              labelHidden={false}
              autoComplete="email"
            />
            {wallet ? (
              <>
                <FormTextField
                  control={form.control}
                  name="ensName"
                  label="Nome ENS"
                  labelHidden={false}
                />
                <FormTextField
                  control={form.control}
                  name="label"
                  label="Apelido da carteira"
                  required
                  labelHidden={false}
                />
              </>
            ) : (
              <Link to="/wallets">Cadastre uma carteira principal</Link>
            )}
            <div className="min-w-0">
              <label htmlFor="profile-avatar">Avatar</label>
              {preview && (
                <img
                  src={preview}
                  alt="Preview do avatar"
                  width={64}
                  height={64}
                />
              )}
              <input
                ref={fileInput}
                id="profile-avatar"
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                aria-invalid={!!fileError || !!form.formState.errors.avatarUrl}
                aria-describedby={
                  fileError || form.formState.errors.avatarUrl
                    ? 'avatar-error'
                    : undefined
                }
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  const version = ++reading.current;
                  setReadingFile(false);
                  setFileError('');
                  if (!file) return;
                  if (
                    !['image/png', 'image/jpeg'].includes(file.type) ||
                    file.size > 512 * 1024
                  ) {
                    setFileError('Selecione PNG ou JPEG de até 512 KB.');
                    return;
                  }
                  const token = getStoredSession()?.token;
                  const reader = new FileReader();
                  setReadingFile(true);
                  reader.onload = () => {
                    if (
                      reading.current !== version ||
                      getStoredSession()?.token !== token
                    )
                      return;
                    setReadingFile(false);
                    form.setValue('avatarUrl', String(reader.result), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  };
                  reader.onerror = () => {
                    if (reading.current === version) {
                      setReadingFile(false);
                      setFileError('Não foi possível ler a imagem.');
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  aria-describedby={
                    fileError || form.formState.errors.avatarUrl
                      ? 'avatar-error'
                      : undefined
                  }
                  onClick={() => fileInput.current?.click()}
                >
                  Alterar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    ++reading.current;
                    setReadingFile(false);
                    setFileError('');
                    form.setValue('avatarUrl', null, { shouldDirty: true });
                  }}
                >
                  Remover
                </Button>
              </div>
              <p id="avatar-error" role="alert">
                {fileError || form.formState.errors.avatarUrl?.message}
              </p>
            </div>
          </div>
          <section className="grid min-w-0 md:grid-cols-2">
            <div className="min-w-0 space-y-6">
              <h2 className="text-body-combo mb-6">Alterar senha</h2>
              <FormTextField
                control={form.control}
                name="currentPassword"
                label="Senha atual"
                type="password"
                labelHidden={false}
                autoComplete="current-password"
              />
              <FormTextField
                control={form.control}
                name="newPassword"
                label="Nova senha"
                type="password"
                labelHidden={false}
                autoComplete="new-password"
              />
              <FormTextField
                control={form.control}
                name="confirmPassword"
                label="Confirmar nova senha"
                type="password"
                labelHidden={false}
                autoComplete="new-password"
              />
            </div>
          </section>
          <Button
            type="submit"
            disabled={readingFile || !!fileError}
            aria-busy={form.formState.isSubmitting}
            className="mt-8"
          >
            Salvar
          </Button>
        </fieldset>
        <p role="status" aria-live="polite">
          {feedback}
        </p>
      </form>
    </Form>
  );
}
