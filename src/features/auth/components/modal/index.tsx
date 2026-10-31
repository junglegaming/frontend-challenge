import { useAuthModal } from "../../hooks/use-auth-modal";
import { AuthModalDesktop } from "./auth-modal-desktop";
import { AuthModalMobile } from "./auth-modal-mobile";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const auth = useAuthModal(() => {
    onSuccess?.();
    onOpenChange(false);
  });

  if (!open) return null;

  const handleClose = () => onOpenChange(false);

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-full">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onMouseDown={handleClose}
      />

      {/* Desktop */}
      <div className="pointer-events-none relative hidden h-full items-center justify-center overflow-y-auto p-5 sm:flex">
        <div className="pointer-events-auto">
          <AuthModalDesktop auth={auth} />
        </div>
      </div>

      {/* Mobile */}
      <div className="pointer-events-none relative h-full sm:hidden">
        <div className="pointer-events-auto h-full">
          <AuthModalMobile auth={auth} />
        </div>
      </div>
    </div>
  );
}
