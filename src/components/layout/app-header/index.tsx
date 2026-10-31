import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { HeaderActions } from "./header-actions";
import { HeaderNavigation } from "./header-navigation";

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function toggleMenu() {
    setIsMenuOpen((open) => !open);
  }

  return (
    <header className="sticky top-0 z-30 bg-background">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 border-b border-border px-5 sm:gap-4 sm:px-8 lg:px-10 xl:px-12">
        <Link
          to="/"
          aria-label="Kurio, página inicial"
          onClick={closeMenu}
          className="shrink-0 text-sm font-black tracking-[0.15em] text-foreground sm:tracking-[0.2em]"
        >
          KURIO
        </Link>

        <HeaderNavigation />

        <HeaderActions isMenuOpen={isMenuOpen} onMenuToggle={toggleMenu} />
      </div>

      {isMenuOpen && <HeaderNavigation mobile onNavigate={closeMenu} />}
    </header>
  );
}
