
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "success" | "warning" | "danger";
  trend?: "up" | "down" | "neutral";
  showTrend?: boolean;
}

export default function MetricCard({
  title,
  value,
  description,
  icon,
  className,
  onClick,
  variant = "default",
  trend,
  showTrend,
}: MetricCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all", 
        onClick ? "cursor-pointer hover:bg-muted/30" : "", 
        className,
        variant === "danger" && "border-red-200 dark:border-red-800"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn(
          "text-sm font-medium",
          variant === "danger" && "text-red-700 dark:text-red-400"
        )}>
          {title}
        </CardTitle>
        <div className={cn(
          "h-8 w-8 rounded-md p-1.5",
          variant === "default" && "bg-primary/10 text-primary",
          variant === "success" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          variant === "warning" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          variant === "danger" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          title === "OS's Atrasadas" && Number(value) > 0 && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-2xl font-bold",
          variant === "success" && "text-green-600 dark:text-green-400",
          variant === "warning" && "text-amber-600 dark:text-amber-400",
          variant === "danger" && "text-red-600 dark:text-red-400",
          title === "OS's Atrasadas" && Number(value) > 0 && "text-red-600 dark:text-red-400"
        )}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {showTrend && trend && (
          <div className={cn(
            "flex items-center text-xs mt-2",
            trend === "up" && "text-green-600",
            trend === "down" && "text-red-600"
          )}>
            {trend === "up" && "▲"}
            {trend === "down" && "▼"}
            <span className="ml-1">{trend === "up" ? "Aumento" : "Diminuição"}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
