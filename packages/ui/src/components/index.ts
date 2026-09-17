/**
 * @riprap/ui — UI chrome layer.
 *
 * Two shelves:
 *  - `./ui` — shadcn/Radix primitives restyled to DESIGN.md (radius 0,
 *    hairline depth, settle motion; zero default-state shadcn styling).
 *  - `./chrome` — the brand chrome components (bands, stamps, cards, nav).
 *
 * The parent `src/index.ts` wires this barrel into the public API.
 */
export type { AddressChipProps } from "./chrome/AddressChip";
export { AddressChip, shortenAddress } from "./chrome/AddressChip";

export { Container } from "./chrome/Container";
export type { CTABandProps } from "./chrome/CTABand";
export { CTABand } from "./chrome/CTABand";
export type { DissolutionBandProps } from "./chrome/DissolutionBand";
export { DissolutionBand } from "./chrome/DissolutionBand";
export type { FeatureCardProps } from "./chrome/FeatureCard";
export { FeatureCard } from "./chrome/FeatureCard";
export type { FooterBandProps, FooterColumn, FooterLink } from "./chrome/FooterBand";
export { FooterBand } from "./chrome/FooterBand";
export type { GlyphTileProps } from "./chrome/GlyphTile";
export { GlyphTile } from "./chrome/GlyphTile";
// brand
export type { LogoLockupProps } from "./chrome/LogoLockup";
export { LogoLockup } from "./chrome/LogoLockup";
export type { LogomarkProps } from "./chrome/Logomark";
export { BLUE_INDEX, GAP_INDEX, Logomark, RING_SEEDS, slotPosition } from "./chrome/Logomark";
export type { MechanismCardProps } from "./chrome/MechanismCard";
export { MechanismCard } from "./chrome/MechanismCard";
export { PlateTicks } from "./chrome/PlateTicks";
export type { SectionBandProps } from "./chrome/SectionBand";
export { SectionBand } from "./chrome/SectionBand";
export type { StampBadgeProps } from "./chrome/StampBadge";
export { StampBadge } from "./chrome/StampBadge";
export type { TextLinkProps } from "./chrome/TextLink";
export { TextLink } from "./chrome/TextLink";
export type { TierCardProps } from "./chrome/TierCard";
export { TierCard } from "./chrome/TierCard";
export type { TopNavLink, TopNavProps } from "./chrome/TopNav";
export { TopNav } from "./chrome/TopNav";
export type { TweetCardProps } from "./chrome/TweetCard";
export { TweetCard } from "./chrome/TweetCard";
export type { WalletConnector, WalletDialogProps } from "./chrome/WalletDialog";
export { WalletDialog } from "./chrome/WalletDialog";
export type { WordmarkProps } from "./chrome/Wordmark";
export { Wordmark } from "./chrome/Wordmark";
export type {
  WorkedExampleLine,
  WorkedExampleReceiptProps,
} from "./chrome/WorkedExampleReceipt";
export { WorkedExampleReceipt } from "./chrome/WorkedExampleReceipt";
export { Button, buttonVariants } from "./ui/button";
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
export { Input } from "./ui/input";
export { Label } from "./ui/label";
export { Separator } from "./ui/separator";
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
export { Slider } from "./ui/slider";
