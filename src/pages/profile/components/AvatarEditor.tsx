import { useRef, useState, type ChangeEvent } from 'react'
import { isApiError } from '@/shared/api/http'
import { AvatarIcon } from '@/shared/icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { useRemoveAvatar, useUpdateAvatar, type Profile } from '@/domains/profile'

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 1024 * 1024

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export function AvatarEditor({ avatarUrl }: Pick<Profile, 'avatarUrl'>) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const update = useUpdateAvatar()
  const remove = useRemoveAvatar()
  const busy = update.isPending || remove.isPending

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!ACCEPTED.includes(file.type)) return setError('Envie uma imagem PNG, JPEG ou WebP.')
    if (file.size > MAX_BYTES) return setError('A imagem deve ter no máximo 1 MB.')
    setError(undefined)
    try {
      await update.mutateAsync({ dataUrl: await readAsDataUrl(file) })
    } catch (e) {
      setError(isApiError(e) ? (e.fields.avatar ?? e.message) : 'Não foi possível ler a imagem.')
    }
  }

  async function onRemove() {
    setError(undefined)
    try {
      await remove.mutateAsync()
    } catch (e) {
      setError(isApiError(e) ? e.message : 'Não foi possível remover o avatar.')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span id="avatar-label" className="text-body">
        Avatar
      </span>
      <div className="flex flex-wrap items-center gap-6" role="group" aria-labelledby="avatar-label">
        <Avatar className="size-[50px] bg-card text-primary">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="Seu avatar atual" /> : null}
          <AvatarFallback className="bg-card text-primary">
            <AvatarIcon strokeWidth={1.5} size={22} role="img" aria-label="Nenhum avatar definido" />
          </AvatarFallback>
        </Avatar>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED.join(',')}
          onChange={onFile}
          className="sr-only"
          tabIndex={-1}
          aria-label="Selecionar imagem de avatar"
        />
        <Button size="sm" disabled={busy} onClick={() => input.current?.click()}>
          {update.isPending ? 'Enviando…' : 'Alterar'}
        </Button>
        <Button variant="ghost" size="sm" disabled={busy || !avatarUrl} onClick={onRemove} className="px-0">
          Remover
        </Button>
      </div>
      <p role="status" className="sr-only">
        {update.isSuccess ? 'Avatar atualizado.' : remove.isSuccess ? 'Avatar removido.' : ''}
      </p>
      {error && (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
