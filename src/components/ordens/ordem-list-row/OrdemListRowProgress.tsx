
import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OrdemListRowProgressProps {
  progresso: number;
}

export default function OrdemListRowProgress({ progresso }: OrdemListRowProgressProps) {
  // Define a cor do indicador de progresso baseado no valor
  const getProgressColor = () => {
    return "bg-blue-500"; // Mantém a parte concluída da barra de progresso azul
  };

  return (
    <div className="px-4 py-3 bg-gray-50">
      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
        <span>Progresso</span>
        <span>{progresso}%</span>
      </div>
      <Progress 
        value={progresso} 
        className="h-2 bg-gray-200"
        indicatorClassName={cn(getProgressColor())}
      />
    </div>
  );
}
