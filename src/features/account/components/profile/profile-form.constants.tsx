import {
  AlertTriangle,
  CircleDollarSign,
  Download,
  Heart,
  MapPin,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type ProfileSection =
  | "profile"
  | "wallets"
  | "activity"
  | "favorites"
  | "offers"
  | "downloads"
  | "support";

interface ProfileMenuItem {
  id: ProfileSection;
  label: string;
  icon: LucideIcon;
}

export const profileMenuItems: ProfileMenuItem[] = [
  { id: "profile", label: "Dados do perfil", icon: UserRound },
  { id: "wallets", label: "Carteiras", icon: MapPin },
  { id: "activity", label: "Atividade", icon: ShoppingCart },
  { id: "favorites", label: "Lista de interesse", icon: Heart },
  { id: "offers", label: "Ofertas", icon: CircleDollarSign },
  { id: "downloads", label: "Arquivos baixados", icon: Download },
  { id: "support", label: "Suporte", icon: AlertTriangle },
];
