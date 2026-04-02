"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  size?: "sm" | "default"
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, size = "default", ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false)
    const controlled = checked !== undefined
    const current = controlled ? checked : isChecked

    const handleClick = () => {
      const next = !current
      if (!controlled) setIsChecked(next)
      onCheckedChange?.(next)
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={current}
        data-slot="switch"
        data-size={size}
        data-state={current ? "checked" : "unchecked"}
        onClick={handleClick}
        className={cn(
          "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-all outline-none focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-card-hover duration-300",
          size === "default" ? "h-[18px] w-[32px]" : "h-[14px] w-[24px]",
          current ? "bg-amber-500" : "bg-neutral-300",
          className
        )}
        {...props}
      >
        <span
          data-slot="switch-thumb"
          className={cn(
            "pointer-events-none block rounded-full bg-white ring-0 transition-transform shadow-sm",
            size === "default" ? "size-4" : "size-3",
            current
              ? "translate-x-[calc(100%-2px)]"
              : "translate-x-0"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
