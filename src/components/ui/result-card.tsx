import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface ResultCardProps {
  title: string
  value: string | number
  unit?: string
  description?: string
  severity?: "normal" | "warning" | "danger" | "info"
  children?: ReactNode
  className?: string
}

const severityStyles = {
  normal: "border-success/30 bg-success/5 text-success",
  warning: "border-warning/30 bg-warning/5 text-warning",
  danger: "border-destructive/30 bg-destructive/5 text-destructive",
  info: "border-primary/30 bg-primary/5 text-primary",
}

const valueColors = {
  normal: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-primary",
}

export function ResultCard({
  title,
  value,
  unit,
  description,
  severity = "info",
  children,
  className,
}: ResultCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border p-6 transition-all duration-300",
        "animate-[cardSlideUp_0.3s_ease-out]",
        severityStyles[severity],
        className
      )}
    >
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {title}
        </p>
        <div className="flex items-baseline justify-center gap-1">
          <span className={cn("text-5xl font-bold tracking-tight tabular-nums", valueColors[severity])}>
            {value}
          </span>
          {unit && (
            <span className="text-lg font-medium text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {children}
        </div>
      )}
    </div>
  )
}

interface ResultGridProps {
  children: ReactNode
  className?: string
}

export function ResultGrid({ children, className }: ResultGridProps) {
  return (
    <div className={cn("grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 stagger-children", className)}>
      {children}
    </div>
  )
}