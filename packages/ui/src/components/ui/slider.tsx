import { Slider as SliderPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../../lib/utils";

/*
 * DESIGN.md § sliders — a 1px hairline rail with a square stone range fill
 * and a square warm-white thumb. Sharp geometry (rounded-none), settle
 * motion on hover/press, focus ring like every kit control. No shadows.
 */

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-none bg-stone data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full rounded-none bg-primary select-none data-[orientation=vertical]:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: thumb identity is positional — value keys remount the thumb every step and detach it mid-interaction
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={
            // biome-ignore lint/suspicious/noArrayIndexKey: positional thumb identity — value keys remount the thumb every step and detach it mid-interaction
            index
          }
          className="relative block size-3.5 shrink-0 rounded-none border border-ground bg-primary transition-[background-color,translate] duration-[160ms] ease-out select-none after:absolute after:-inset-2 hover:bg-primary-active focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-hidden active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
