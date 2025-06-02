
import { Progress } from "@/components/ui/progress";
import { OrdemServico } from "@/types/ordens";

interface OrderProgressProps {
  ordem: OrdemServico;
}

export default function OrderProgress({ ordem }: OrderProgressProps) {
  // Calculate progress based on completed services
  const calculateProgress = (): number => {
    if (!ordem.servicos || ordem.servicos.length === 0) {
      return 0;
    }

    // Count only completed services (concluido: true)
    const servicosConcluidos = ordem.servicos.filter(servico => servico.concluido).length;
    const totalServicos = ordem.servicos.length;
    
    return Math.round((servicosConcluidos / totalServicos) * 100);
  };

  const progresso = calculateProgress();

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
