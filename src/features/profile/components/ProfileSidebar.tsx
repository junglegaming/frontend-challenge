import {
  User,
  MapPin,
  ShoppingCart,
  Heart,
  TrendingUp,
  Download,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { Link } from "@tanstack/react-router";

export type ProfileNavItem =
  | "profile"
  | "wallets"
  | "activity"
  | "wishlist"
  | "offers"
  | "downloads"
  | "support";

interface ProfileSidebarProps {
  activeItem: ProfileNavItem;
  onNavigate?: (item: ProfileNavItem) => void;
}

const navItems: Array<{ id: ProfileNavItem; label: string; icon: typeof User; to?: "/profile" | "/profile/wallets" }> = [
  { id: "profile", label: "Dados do perfil", icon: User, to: "/profile" },
  { id: "wallets", label: "Carteiras", icon: MapPin, to: "/profile/wallets" },
  { id: "activity", label: "Atividade", icon: ShoppingCart },
  { id: "wishlist", label: "Lista de interesse", icon: Heart },
  { id: "offers", label: "Ofertas", icon: TrendingUp },
  { id: "downloads", label: "Arquivos baixados", icon: Download },
  { id: "support", label: "Suporte", icon: AlertTriangle },
];

export function ProfileSidebar({ activeItem, onNavigate }: ProfileSidebarProps) {
  const { logout } = useAuth();

  const handleItemClick = (id: ProfileNavItem) => {
    if (onNavigate) {
      onNavigate(id);
    }
  };

  return (
    <aside
      aria-label="Menu do perfil"
      className="w-full md:w-60 shrink-0 bg-[#241612] border border-[#3a2416] py-2 text-xs font-mono self-start"
    >
      <nav>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const className = `w-full flex items-center gap-3 px-4 py-2.5 text-left border-l-2 transition-colors ${
              isActive
                ? "border-[#d4893f] bg-[#1a100c] text-[#d4893f] font-medium"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#2b1b16]"
            }`;
            const content = <>
              <Icon className={`size-4 shrink-0 ${isActive ? "text-[#d4893f]" : "text-zinc-400"}`} aria-hidden="true" />
              <span>{item.label}</span>
            </>;

            return (
              <li key={item.id}>
                {item.to ? (
                  <Link to={item.to} className={className} aria-current={isActive ? "page" : undefined}>
                    {content}
                  </Link>
                ) : <button
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={className}
                >
                  {content}
                </button>}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="my-2 border-t border-[#3a2416]" />

      <button
        type="button"
        onClick={() => logout()}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-l-2 border-transparent text-zinc-400 hover:text-[#d4893f] hover:bg-[#2b1b16] transition-colors"
      >
        <LogOut className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <span>Sair</span>
      </button>
    </aside>
  );
}
