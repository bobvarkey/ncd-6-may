import { Info, AlertTriangle, Lightbulb, CheckCircle2, AlertCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TakeHomeVariant = "info" | "warning" | "caution" | "key-point" | "success";

interface TakeHomeMessageProps {
  title: string;
  children: React.ReactNode;
  variant?: TakeHomeVariant;
  className?: string;
}

const variantConfig: Record<TakeHomeVariant, { 
  container: string; 
  icon: LucideIcon; 
  iconColor: string;
  titleColor: string;
}> = {
  info: {
    container: "bg-primary/5 border-primary/20",
    icon: Info,
    iconColor: "text-primary",
    titleColor: "text-primary",
  },
  warning: {
    container: "bg-destructive/5 border-destructive/20",
    icon: AlertCircle,
    iconColor: "text-destructive",
    titleColor: "text-destructive",
  },
  caution: {
    container: "bg-warning/5 border-warning/20",
    icon: AlertTriangle,
    iconColor: "text-warning",
    titleColor: "text-warning",
  },
  "key-point": {
    container: "bg-indigo-500/5 border-indigo-500/20",
    icon: Lightbulb,
    iconColor: "text-indigo-500",
    titleColor: "text-indigo-500",
  },
  success: {
    container: "bg-emerald-500/5 border-emerald-500/20",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    titleColor: "text-emerald-500",
  },
};

export function TakeHomeMessage({ 
  title, 
  children, 
  variant = "info",
  className 
}: TakeHomeMessageProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      "p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300", 
      config.container,
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-5 w-5", config.iconColor)} />
        <h3 className={cn("font-display font-bold text-sm uppercase tracking-wider", config.titleColor)}>
          {title}
        </h3>
      </div>
      <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
        {children}
      </div>
    </div>
  );
}
