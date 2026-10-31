import type { NFT } from "@/data/nfts";
import { Star } from "lucide-react";

interface NFTReviewsProps {
  nft: NFT;
}

export function NFTReviews({ nft }: NFTReviewsProps) {
  return (
    <section className="mt-2">
      <div className="space-y-4 py-5">
        {nft.reviews.map((review) => (
          <article
            key={review.id}
            className="border-b border-border pb-4 last:border-b-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {review.author}
              </h3>

              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={13}
                    className={
                      index < review.rating
                        ? "fill-primary text-primary"
                        : "text-muted"
                    }
                  />
                ))}
              </div>
            </div>

            <p className="mt-2 text-sm leading-6 text-muted">
              {review.comment}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
