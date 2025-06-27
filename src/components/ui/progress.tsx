"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { gradient?: string }
>(({ className, value, gradient, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-[#EFEDE7]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full flex-1 transition-all"
      style={{
        background: gradient || "var(--primary)",
        width: `${value || 0}%`,
        minWidth: 0,
        maxWidth: '100%',
        transform: undefined
      }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
