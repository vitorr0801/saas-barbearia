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
    <div className={cn(
      "kpi-card group",
      highlight && "border-primary/30",
      className
    )}>
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl" />
      )}
      
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="kpi-label">{label}</span>
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
        
        <div className="kpi-value mb-2">{value}</div>
        
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
