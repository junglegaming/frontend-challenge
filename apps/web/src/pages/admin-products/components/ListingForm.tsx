import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateListing } from '@/domains/admin'
import { CATEGORY_LABELS, NFT_CATEGORIES, type NftCategory } from '@/domains/catalog'
import { useGenerateImage } from '@/domains/media-generation'
import { isApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'

export function ListingForm() {
  const createListing = useCreateListing()
  const generateImage = useGenerateImage()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<NftCategory>(NFT_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [collection, setCollection] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageSrc, setImageSrc] = useState('')
  const [editionName, setEditionName] = useState('Standard')
  const [price, setPrice] = useState('')
  const [supply, setSupply] = useState('')
  const [maxPerOrder, setMaxPerOrder] = useState('')

  function onGenerateImage() {
    generateImage.mutate(
      { prompt: imagePrompt },
      {
        onSuccess: (image) => setImageSrc(image.src),
        onError: (error) => toast.error(isApiError(error) ? error.message : 'Não foi possível gerar a imagem.'),
      },
    )
  }

  function reset() {
    setName('')
    setDescription('')
    setCollection('')
    setImageSrc('')
    setEditionName('Standard')
    setPrice('')
    setSupply('')
    setMaxPerOrder('')
  }

  function onSubmit() {
    createListing.mutate(
      {
        name,
        category,
        description,
        collection,
        image: { src: imageSrc, alt: name, width: 600, height: 600 },
        edition: { name: editionName, price, supply: Number(supply), maxPerOrder: Number(maxPerOrder) },
      },
      {
        onSuccess: () => {
          toast.success(`${name} publicado no catálogo.`)
          reset()
        },
        onError: (error) => toast.error(isApiError(error) ? error.message : 'Não foi possível criar o anúncio.'),
      },
    )
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <h2 className="text-title font-bold">Novo anúncio</h2>

      <Field label="Nome do NFT" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Categoria" required>
        <Select value={category} onChange={(e) => setCategory(e.target.value as NftCategory)}>
          {NFT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Coleção" required>
        <Input value={collection} onChange={(e) => setCollection(e.target.value)} />
      </Field>

      <Field label="Descrição" required>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <Field label="Descrição da imagem (para gerar com IA)">
        <Input value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Ex.: paisagem futurista em tons de roxo" />
      </Field>
      <Button type="button" variant="outline" disabled={generateImage.isPending} onClick={onGenerateImage} className="self-start">
        {generateImage.isPending ? 'Gerando…' : 'Gerar imagem'}
      </Button>
      {imageSrc && <img src={imageSrc} alt="Pré-visualização da imagem gerada" className="h-32 w-32 rounded-md object-cover" />}
      <Field label="Imagem (URL)" required>
        <Input value={imageSrc} onChange={(e) => setImageSrc(e.target.value)} placeholder="/art/nft-001-1.svg" />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Edição" required>
          <Input value={editionName} onChange={(e) => setEditionName(e.target.value)} />
        </Field>
        <Field label="Preço (ETH)" required>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.10" />
        </Field>
        <Field label="Estoque" required>
          <Input type="number" min={1} value={supply} onChange={(e) => setSupply(e.target.value)} />
        </Field>
        <Field label="Limite por pedido" required>
          <Input type="number" min={1} value={maxPerOrder} onChange={(e) => setMaxPerOrder(e.target.value)} />
        </Field>
      </div>

      <Button type="submit" disabled={createListing.isPending} className="self-start">
        {createListing.isPending ? 'Criando…' : 'Criar anúncio'}
      </Button>
    </form>
  )
}
