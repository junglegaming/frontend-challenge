import { useNavigate } from "@tanstack/react-router";

interface MarketSidebarProps {
  nftId: string;
  nftName: string;
  images: { id: string; image: string }[];
  selectedImage: string;
  onSelectImage: (image: string) => void;
}

export function MarketSidebar({
  nftId,
  nftName,
  images,
  onSelectImage,
}: MarketSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="hidden h-full w-28 shrink-0 flex-col gap-3 sm:flex">
      {images.map((item, index) => (
        <button
          key={`${item.id}-${index}`}
          type="button"
          onClick={() => {
            if (item.id !== nftId) {
              navigate({
                to: "/market",
                search: { nftId: item.id },
              });
              return;
            }

            onSelectImage(item.image);
          }}
          aria-label={`Ver ${nftName} - imagem ${index + 1}`}
          aria-pressed={nftId === item.id}
          className={`min-h-0 flex-1 overflow-hidden rounded-md border-2 transition-colors ${
            nftId === item.id
              ? "border-primary"
              : "border-border hover:border-primary/50"
          }`}
        >
          <img
            src={item.image}
            alt={`${nftName} - imagem ${index + 1}`}
            draggable={false}
            className="h-full w-full cursor-pointer object-cover"
          />
        </button>
      ))}
    </aside>
  );
}
