import { Link } from '@tanstack/react-router';
import type { CartItem as Item } from '@/types/api';
import type { ReactNode } from 'react';

export function CartItem({
  item,
  children,
}: {
  item: Pick<Item, 'nftId' | 'tokenId' | 'name' | 'image'>;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <img
        src={item.image}
        alt={`NFT ${item.name}`}
        width={70}
        height={70}
        className="shrink-0 rounded-md"
      />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 wrap-anywhere">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: item.nftId }}
          search={{ qty: 1 }}
          className="text-body-lg-bold"
        >
          {item.name}
        </Link>
        {children ?? (
          <p className="text-tiny text-secondary">
            ID do token: {item.tokenId ? `#${item.tokenId}` : item.nftId}
          </p>
        )}
      </div>
    </div>
  );
}
