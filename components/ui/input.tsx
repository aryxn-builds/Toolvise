import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base transition-all duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-900 placeholder:text-neutral-400 focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:shadow-[0_0_0_2px_rgba(200,137,58,0.1)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm shadow-sm",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
