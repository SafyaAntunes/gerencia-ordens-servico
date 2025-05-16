
import { Progress } from "@/components/ui/progress";

interface OrderProgressProps {
  progresso: number;
}

export default function OrderProgress({ progresso }: OrderProgressProps) {
  return (
    <div className="col-span-12 mt-2">
      <div className="flex items-center justify-between text-sm text-gray-500 px-6">
        <span>Progresso</span>
        <span>{progresso}%</span>
      </div>
      <Progress value={progresso} className="h-1.5 mt-1 mx-6" />
    </div>
  );
}
