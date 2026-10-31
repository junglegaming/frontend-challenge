import { AuthModal } from "@/features/auth/components/modal";
import { useSession } from "@/features/auth/hooks/use-session";
import { useCart } from "@/features/market/context/cart-provider";
import { useState } from "react";
import { DesktopHeaderActions } from "./desktop-header-actions";
import { MobileHeaderActions } from "./mobile-header-actions";

interface HeaderActionsProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export function HeaderActions({
  isMenuOpen,
  onMenuToggle,
}: HeaderActionsProps) {
  const { totalItems } = useCart();
  const { data, isLoading } = useSession();

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const isAuthenticated = Boolean(data?.user);

  function handleOpenAuth() {
    if (isMenuOpen) {
      onMenuToggle();
    }

    setIsAuthOpen(true);
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <DesktopHeaderActions
          totalItems={totalItems}
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          onOpenAuth={handleOpenAuth}
        />

        <MobileHeaderActions
          totalItems={totalItems}
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          isMenuOpen={isMenuOpen}
          onMenuToggle={onMenuToggle}
          onOpenAuth={handleOpenAuth}
        />
      </div>

      <AuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </>
  );
}
