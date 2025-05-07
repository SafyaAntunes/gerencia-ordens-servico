
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
}

export default function MetricCard({
  title,
  value,
  description,
  icon,
  className,
  onClick,
}: MetricCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all", 
        onClick ? "cursor-pointer hover:bg-muted/30" : "", 
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn(
          "h-8 w-8 rounded-md p-1.5",
          title === "OS's Atrasadas" && Number(value) > 0 
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
            : "bg-primary/10 text-primary"
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-2xl font-bold",
          title === "OS's Atrasadas" && Number(value) > 0 ? "text-red-600 dark:text-red-400" : ""
        )}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
