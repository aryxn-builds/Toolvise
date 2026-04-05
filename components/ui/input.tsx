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
          "bg-transparent border-[rgba(240,246,252,0.10)] text-[#E6EDF3] rounded-xl focus:border-[#2EA043] focus:ring-1 focus:ring-[#4F8EF7] h-10 w-full min-w-0 px-3 py-2 text-sm text-[#E6EDF3] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
