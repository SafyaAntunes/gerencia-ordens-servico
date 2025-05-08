
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OrdemListRowProgressProps {
  progresso: number;
  isAtrasada?: boolean;
}

export default function OrdemListRowProgress({ progresso, isAtrasada = false }: OrdemListRowProgressProps) {
  // Ensure progresso is a valid number between 0-100
  const progressoValue = isNaN(progresso) ? 0 : Math.min(Math.max(progresso, 0), 100);
  
  return (
    <div className={`px-4 py-3 ${isAtrasada ? 'bg-red-100' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
        <span>Progresso</span>
        <span>{progressoValue}%</span>
      </div>
      <Progress 
        value={progressoValue} 
        className={`h-2 ${isAtrasada ? 'bg-red-200' : 'bg-gray-200'}`}
        indicatorClassName={cn(isAtrasada ? "bg-red-500" : "bg-blue-500")}
      />
    </div>
  );
}
