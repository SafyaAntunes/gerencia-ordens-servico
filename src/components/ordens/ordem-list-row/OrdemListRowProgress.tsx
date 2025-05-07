
import { Progress } from "@/components/ui/progress";

interface OrdemListRowProgressProps {
  progresso: number;
  isOverdue?: boolean;
}

export default function OrdemListRowProgress({ 
  progresso,
  isOverdue = false
}: OrdemListRowProgressProps) {
  return (
    <div className="p-3 pt-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium">Progresso</span>
        <span className="text-xs">{progresso}%</span>
      </div>
      <Progress value={progresso} className={`h-2 ${isOverdue ? 'bg-red-200' : ''}`} />
    </div>
  );
}
