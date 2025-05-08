
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OrdemListRowProgressProps {
  progresso: number;
  isAtrasada?: boolean;
}

export default function OrdemListRowProgress({ progresso, isAtrasada = false }: OrdemListRowProgressProps) {
  return (
    <div className={`px-4 py-3 ${isAtrasada ? 'bg-red-100' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
        <span>Progresso</span>
        <span>{progresso}%</span>
      </div>
      <Progress 
        value={progresso} 
        className={`h-2 ${isAtrasada ? 'bg-red-200' : 'bg-gray-200'}`}
        indicatorClassName={cn(isAtrasada ? "bg-red-500" : "bg-blue-500")}
      />
    </div>
  );
}
