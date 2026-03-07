import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "./card"

const GradientCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("gradient-border-bg", className)} {...props}>
    <div className="h-full w-full rounded-lg bg-card text-card-foreground">
        {children}
    </div>
  </div>
))
GradientCard.displayName = "GradientCard"

export { GradientCard }
