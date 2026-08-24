import React from "react";
import { Info, AlertTriangle, AlertCircle, Lightbulb, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type MessageVariant = "info" | "warning" | "caution" | "key-point" | "success";

interface TakeHomeMessageProps {
  title?: string;
  children: React.ReactNode;
  variant?: MessageVariant;
  className?: string;
}

const variantStyles: Record<MessageVariant, {
  container: string;
  icon: React.ElementType;
  iconColor: string;
  titleColor: string;
}> = {
  info: {
    container: "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/50",
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
    titleColor: "text-blue-900 dark:text-blue-300",
  },
  warning: {
    container: "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800/50",
    icon: AlertCircle,
    iconColor: "text-red-600 dark:text-red-400",
    titleColor: "text-red-900 dark:text-red-300",
  },
  caution: {
    container: "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/50",
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-400",
    titleColor: "text-amber-900 dark:text-amber-300",
  },
  "key-point": {
    container: "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800/50",
    icon: Lightbulb,
    iconColor: "text-indigo-600 dark:text-indigo-400",
    titleColor: "text-indigo-900 dark:text-indigo-300",
  },
  success: {
    container: "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50",
    icon: CheckCircle2,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    titleColor: "text-emerald-900 dark:text-emerald-300",
  },
};

export function TakeHomeMessage({
  title = "Practical Take-Home Messages",
  children,
  variant = "key-point",
  className,
}: TakeHomeMessageProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        "my-6 rounded-xl border p-5 transition-all duration-200 shadow-sm",
        styles.container,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("mt-1 shrink-0", styles.iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          {title && (
            <h3 className={cn("font-heading text-lg font-bold leading-none tracking-tight", styles.titleColor)}>
              {title}
            </h3>
          )}
          <div className="text-sm leading-relaxed text-foreground/90 font-medium">
            {typeof children === "string" ? (
              <div className="space-y-2">
                {children.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="flex items-start gap-2">
                    {paragraph.startsWith("→") ? (
                      paragraph
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
