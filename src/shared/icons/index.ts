/**
 * Official icon set (specs/001-design-system-standards/contracts/ui-components.md).
 * The only module allowed to import `lucide-react` (enforced by .oxlintrc.json).
 *
 * Conventions: outline style, stroke 1.5 (see `iconProps`), sizes 16 / 20 / 24 px, color via `currentColor`.
 * Decorative icons MUST be rendered with `aria-hidden="true"`; icons that carry meaning need an
 * accessible name on the parent control.
 */
export {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  User as ProfileIcon,
  MapPin as WalletIcon,
  ShoppingBasket as ActivityIcon,
  Heart as HeartIcon,
  LineChart as OffersIcon,
  Download as DownloadIcon,
  TriangleAlert as SupportIcon,
  LogOut as LogoutIcon,
  LogIn as LoginIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  ChevronDown as ChevronDownIcon,
  CircleUserRound as AvatarIcon,
  House as HomeIcon,
  Store as MarketIcon,
  Menu as MenuIcon,
  X as CloseIcon,
  Minus as MinusIcon,
  Plus as PlusIcon,
  Loader2 as SpinnerIcon,
  ImageUp as AvatarUploadIcon,
  TriangleAlert as AlertIcon,
} from 'lucide-react'

export type { LucideIcon as IconComponent } from 'lucide-react'

/** Default props every official icon should receive, so stroke and size stay uniform. */
export const iconProps = { strokeWidth: 1.5, 'aria-hidden': true } as const
export const iconSizes = { sm: 16, md: 20, lg: 24 } as const
