
import { ServicoStatus } from "../types/servicoTrackerTypes";
import { TipoServico } from "@/types/ordens";

export const formatTimeDisplay = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  return [h, m, s]
    .map(v => v < 10 ? `0${v}` : `${v}`)
    .join(':');
};

export const getServicoStatus = (
  isRunning: boolean,
  isPaused: boolean,
  concluido: boolean
): ServicoStatus => {
  if (concluido) {
    return "concluido";
  } else if (isRunning) {
    return "em_andamento";
  } else if (isPaused) {
    return "pausado";
  } else {
    return "nao_iniciado";
  }
};

export const formatTipoServico = (tipo: TipoServico): string => {
  const labels: Record<TipoServico, string> = {
    bloco: "Bloco",
    biela: "Biela",
    cabecote: "Cabeçote",
    virabrequim: "Virabrequim",
    eixo_comando: "Eixo de Comando",
    montagem: "Montagem",
    dinamometro: "Dinamômetro"
  };
  
  return labels[tipo] || tipo;
};
