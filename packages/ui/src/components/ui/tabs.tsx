import { cn } from "cn";
import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";

/*
 * Tabs — restyled to DESIGN.md (never ship shadcn default): one hairline
 * rule under the whole list, mono uppercase triggers, active = ink text
 * + 2px ink underline. No pill, no radius, no shadows, no accent — the
 * accent stays links/stamps/crest only.
 */

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      // the list sits ABOVE its body — hardcoded column (a data-orientation
      // variant hook silently no-ops if the variant isn't registered)
      className={cn("flex flex-col gap-(--riprap-space-lg)", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex w-full items-center gap-(--riprap-space-lg) border-b border-hairline",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative -mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 pt-1 pb-3 text-muted-foreground [font:var(--riprap-mono-label)] uppercase tracking-(--riprap-tracking-stamp) transition-colors duration-[160ms] ease-out select-none hover:text-body focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-ink data-[state=active]:text-ink [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 pt-(--riprap-space-lg) outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
