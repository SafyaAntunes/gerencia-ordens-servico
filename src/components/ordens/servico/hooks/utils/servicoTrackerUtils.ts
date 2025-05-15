
import { ServicoStatus } from "@/types/ordens";

export const getServicoStatus = (
  concluido: boolean, 
  emAndamento: boolean = false, 
  pausado: boolean = false
): ServicoStatus => {
  if (concluido) return "concluido";
  if (pausado) return "pausado";
  if (emAndamento) return "em_andamento";
  return "nao_iniciado";
};
