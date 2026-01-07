import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
