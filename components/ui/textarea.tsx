import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base transition-all duration-200 outline-none placeholder:text-neutral-400 focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:shadow-[0_0_0_2px_rgba(200,137,58,0.1)] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
