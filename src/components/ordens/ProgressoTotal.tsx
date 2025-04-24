
import { Progress } from "@/components/ui/progress";

interface ProgressoTotalProps {
  progressoTotal: number;
}

export const ProgressoTotal = ({ progressoTotal }: ProgressoTotalProps) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Progresso Total</span>
        <span className="text-sm font-medium">{progressoTotal}%</span>
      </div>
      <Progress value={progressoTotal} className="h-3" />
    </div>
  );
};
