
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

// This was likely intended to be part of the sidebar component, 
// but if it's meant to be a general UI separator used in the sidebar,
// it should be defined and exported here or used directly from sidebar.tsx.
// For now, exporting a simple Separator that can be styled by the sidebar.
const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, ...props }, ref) => (
  <Separator
    ref={ref}
    className={cn("my-1 bg-sidebar-border/70", className)} // Example sidebar-specific styling
    {...props}
  />
));
SidebarSeparator.displayName = "SidebarSeparator";


export { Separator, SidebarSeparator }
