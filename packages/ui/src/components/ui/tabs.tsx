import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "../../lib/utils";

/*
 * Tabs read as ruled sections of a drawing: a 1px hairline baseline, mono
 * uppercase labels, and a 2px stone underline that settles onto the active
 * tab. No pill track, no shadow.
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
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col data-vertical:flex-row",
        className,
      )}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "group/tabs-list inline-flex w-fit items-stretch text-muted-foreground data-horizontal:gap-4 data-horizontal:border-b data-horizontal:border-hairline data-vertical:flex-col data-vertical:gap-1 data-vertical:border-l data-vertical:border-hairline",
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
        "relative inline-flex flex-1 items-center justify-center gap-1.5 border border-transparent px-1 pb-2 uppercase tracking-(--riprap-tracking-stamp) whitespace-nowrap [font:var(--riprap-mono-label)] text-muted-foreground transition-[color] duration-[160ms] ease-out outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:text-muted-soft data-active:text-ink",
        // the 2px stone rule settling under the active tab
        "after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-stone after:opacity-0 after:transition-opacity after:duration-[160ms] after:ease-out data-active:after:opacity-100",
        // vertical orientation: the rule settles on the right edge
        "group-data-vertical/tabs:after:right-[-1px] group-data-vertical/tabs:after:bottom-auto group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:left-auto group-data-vertical/tabs:after:w-0.5 group-data-vertical/tabs:after:h-auto",
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
      className={cn("flex-1 text-body outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
