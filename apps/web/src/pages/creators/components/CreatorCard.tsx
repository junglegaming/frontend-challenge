import { Link } from '@tanstack/react-router'
import type { Creator } from '@/domains/creators'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'

export function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <Link
      to="/creators/$creatorId"
      params={{ creatorId: creator.id }}
      className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center hover:bg-muted focus-visible:outline-3 focus-visible:outline-ring"
    >
      <Avatar size="lg">
        <AvatarImage src={creator.avatarUrl} alt="" />
        <AvatarFallback>{creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-bold text-foreground">{creator.name}</p>
        <p className="text-body text-muted-foreground">
          {creator.nftCount} {creator.nftCount === 1 ? 'NFT' : 'NFTs'}
        </p>
      </div>
    </Link>
  )
}
