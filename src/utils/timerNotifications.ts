
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { formatTime } from "./timerUtils";

// Mapear para nomes amigáveis
const etapaNomes: Record<EtapaOS, string> = {
  lavagem: "Lavagem",
  inspecao_inicial: "Inspeção Inicial",
  retifica: "Retífica",
  montagem: "Montagem",
  dinamometro: "Dinamômetro",
  inspecao_final: "Inspeção Final"
};

const servicoNomes: Record<TipoServico, string> = {
  bloco: "Bloco",
  biela: "Biela",
  cabecote: "Cabeçote",
  virabrequim: "Virabrequim",
  eixo_comando: "Eixo de Comando",
  montagem: "Montagem"
};

export const notifyTimerStarted = (etapa: EtapaOS, tipoServico?: TipoServico) => {
  const etapaNome = etapaNomes[etapa] || etapa;
  const servicoNome = tipoServico ? servicoNomes[tipoServico] || tipoServico : null;
  
  if (servicoNome) {
    toast.success(`Cronômetro iniciado: ${servicoNome}`);
  } else {
    toast.success(`Cronômetro iniciado: ${etapaNome}`);
  }
};

export const notifyTimerPaused = () => {
  toast.info("Cronômetro pausado");
};

export const notifyTimerResumed = () => {
  toast.info("Cronômetro retomado");
};

export const notifyTimerFinished = (tempoTotal: number) => {
  toast.success(`Concluído! Tempo total: ${formatTime(tempoTotal)}`);
};
