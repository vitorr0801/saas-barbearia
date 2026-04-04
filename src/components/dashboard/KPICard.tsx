import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: ReactNode;
  className?: string;
  highlight?: boolean;
}

export function KPICard({ 
  label, 
  value, 
  subtitle, 
  trend, 
  icon,
  className,
  highlight = false 
}: KPICardProps) {
  return (
    <div
      className={cn(
        "dash-card group transition-colors hover:border-primary/25",
        highlight && "border-primary/35",
        className,
      )}
    >
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          {icon && (
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary [&_svg]:h-4 [&_svg]:w-4">
              {icon}
            </div>
          )}
        </div>

        <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">
          {value}
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
        
        {subtitle && !trend && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
