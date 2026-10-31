import { AuthModal } from "@/features/auth/components/modal";
import { useSession } from "@/features/auth/hooks/use-session";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function useCartCheckout() {
  const navigate = useNavigate();
  const { data, isLoading } = useSession();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  useEffect(() => {
    if (!pendingCheckout || isLoading || !data?.user) return;

    setPendingCheckout(false);
    setIsAuthOpen(false);

    navigate({
      to: "/market",
      search: {
        view: "checkout",
      },
    });
  }, [pendingCheckout, isLoading, data?.user, navigate]);

  function handleCheckout() {
    if (isLoading) return;

    if (data?.user) {
      navigate({
        to: "/market",
        search: {
          view: "checkout",
        },
      });

      return;
    }

    setPendingCheckout(true);
    setIsAuthOpen(true);
  }

  function handleAuthSuccess() {
    setIsAuthOpen(false);
  }

  return {
    handleCheckout,
    isLoading,
    authModal: (
      <AuthModal
        open={isAuthOpen}
        onOpenChange={setIsAuthOpen}
        onSuccess={handleAuthSuccess}
      />
    ),
  };
}
