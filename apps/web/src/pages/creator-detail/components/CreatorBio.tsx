import type { Creator } from '@/domains/creators'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'

export function CreatorBio({ creator }: { creator: Creator }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
      <Avatar size="lg" className="size-20">
        <AvatarImage src={creator.avatarUrl} alt="" />
        <AvatarFallback>{creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-title font-bold">{creator.name}</h1>
        <p className="text-muted-foreground">{creator.bio}</p>
        <p className="mt-1 text-body text-muted-foreground">
          {creator.nftCount} {creator.nftCount === 1 ? 'NFT listado' : 'NFTs listados'}
        </p>
      </div>
    </div>
  )
}
