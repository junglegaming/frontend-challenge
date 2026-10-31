import { NFTCard } from "./nft-card";
import { useNftCarousel } from "../../features/market/hooks/use-nft-carousel";
import { useNftList } from "../../features/market/hooks/use-nft-list";

interface NftListProps {
  currentNftId?: string;
}

export function NftList({ currentNftId }: NftListProps) {
  const { filteredNfts, totalPages } = useNftList(currentNftId);

  const {
    containerRef,
    activePage,
    isDragging,
    changePage,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
    handleScroll,
  } = useNftCarousel(totalPages);

  return (
    <div>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onClickCapture={handleClickCapture}
        onScroll={handleScroll}
        className={`flex gap-4 overflow-x-auto pb-4 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {filteredNfts.map((nft) => (
          <div
            key={nft.id}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            className="w-[65%] shrink-0 sm:w-[40%] lg:w-[calc((100%-6rem)/5)]"
          >
            <NFTCard nft={nft} />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => changePage(index)}
              aria-label={`Ir para a posição ${index + 1}`}
              aria-current={activePage === index ? "true" : undefined}
              className={`h-2 rounded-full transition-[width,background-color] duration-300 ease-in-out ${
                activePage === index
                  ? "w-5 bg-primary"
                  : "w-2 bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
