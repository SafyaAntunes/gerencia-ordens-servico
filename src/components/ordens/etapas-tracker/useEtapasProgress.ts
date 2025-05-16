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
  if (status === "autorizado") return 20; // Add autorizado status
  if (status === "executando_servico") return 50; // Changed from fabricacao
  if (status === "aguardando_peca_cliente") return 60;
  if (status === "aguardando_peca_interno") return 60;
  if (status === "finalizado") return 90;
  if (status === "entregue") return 100;
  return 0;
};
