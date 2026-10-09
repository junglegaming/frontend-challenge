import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function GalleryDialog({
  image,
  name,
  onClose,
  onRestoreFocus,
}: {
  image: string;
  name: string;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="bg-surface-card sm:max-w-3xl"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <DialogTitle>{name}</DialogTitle>
        <DialogDescription>Imagem ampliada do NFT</DialogDescription>
        <img
          src={image}
          alt={name}
          className="max-h-[75dvh] w-full rounded-2xl object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
