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

// hooks
export { useInView } from "../hooks/useInView";
export { BadgeStamp } from "./chrome/BadgeStamp";
export { Container } from "./chrome/Container";
export type { CTABandProps } from "./chrome/CTABand";
export { CTABand } from "./chrome/CTABand";
export type { DissolutionBandProps } from "./chrome/DissolutionBand";
export { DissolutionBand } from "./chrome/DissolutionBand";
export type { FeatureCardProps } from "./chrome/FeatureCard";
export { FeatureCard } from "./chrome/FeatureCard";
export type { FooterBandProps, FooterColumn, FooterLink } from "./chrome/FooterBand";
export { FooterBand } from "./chrome/FooterBand";
// brand
export type { LogoLockupProps } from "./chrome/LogoLockup";
export { LogoLockup } from "./chrome/LogoLockup";
export type { LogomarkProps } from "./chrome/Logomark";
export { BLUE_INDEX, GAP_INDEX, Logomark, RING_SEEDS, slotPosition } from "./chrome/Logomark";
export type { MechanismCardProps } from "./chrome/MechanismCard";
export { MechanismCard } from "./chrome/MechanismCard";
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
export type { WordmarkProps } from "./chrome/Wordmark";
export { Wordmark } from "./chrome/Wordmark";
export type {
  WorkedExampleBandProps,
  WorkedExampleFigure,
} from "./chrome/WorkedExampleBand";
export { WorkedExampleBand } from "./chrome/WorkedExampleBand";

// ui (shadcn, restyled to DESIGN.md)
export {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "./ui/avatar";
export { Badge, badgeVariants } from "./ui/badge";
export { Button, buttonVariants } from "./ui/button";
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
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./ui/popover";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
export { Skeleton } from "./ui/skeleton";
export { Toaster } from "./ui/sonner";
export { Switch } from "./ui/switch";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
