
import { useCallback, useEffect, useState } from "react";
import { OrdemServico } from "@/types/ordens";

interface ProgressData {
  total: number;
  completed: number;
  percentage: number;
}

export const getStatusPercent = (status: string): number => {
  if (status === "orcamento") return 5;
  if (status === "aguardando_aprovacao") return 10;
  if (status === "autorizado") return 20; 
  if (status === "executando_servico") return 50;
  if (status === "aguardando_peca_cliente") return 60;
  if (status === "aguardando_peca_interno") return 60;
  if (status === "finalizado") return 90;
  if (status === "entregue") return 100;
  return 0;
};

// Export the hook that was missing
export const useEtapasProgress = (ordem?: OrdemServico) => {
  const [progressData, setProgressData] = useState<ProgressData>({
    total: 0,
    completed: 0,
    percentage: 0
  });

  const calculateProgress = useCallback(() => {
    if (!ordem) return;
    
    // Simple implementation - use the status percent or etapas if available
    const percentFromStatus = getStatusPercent(ordem.status);
    
    setProgressData({
      total: 100,
      completed: percentFromStatus,
      percentage: percentFromStatus
    });
  }, [ordem]);

  useEffect(() => {
    calculateProgress();
  }, [calculateProgress, ordem]);

  return progressData;
};
