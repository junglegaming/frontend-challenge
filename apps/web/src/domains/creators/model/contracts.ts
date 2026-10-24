/** A read-only, derived profile for anyone who has listed at least one NFT (see data-model.md). */
export interface Creator {
  id: string
  name: string
  avatarUrl: string
  bio: string
  /** Count of currently-listed (not delisted) NFTs naming this creator as artist. */
  nftCount: number
}
