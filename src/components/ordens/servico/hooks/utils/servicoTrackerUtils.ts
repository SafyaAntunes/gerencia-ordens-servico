
import { ServicoStatus } from "../types/servicoTrackerTypes";
import { TipoServico, EtapaOS } from "@/types/ordens";

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
    dinamometro: "Dinamômetro",
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    inspecao_final: "Inspeção Final"
  };
  
  return labels[tipo] || tipo;
};

// Mapping between service types and their corresponding etapas
export const servicoToEtapaMapping: Record<TipoServico, EtapaOS> = {
  bloco: "retifica",
  biela: "retifica",
  cabecote: "retifica",
  virabrequim: "retifica",
  eixo_comando: "retifica",
  montagem: "montagem",
  dinamometro: "dinamometro",
  lavagem: "lavagem",
  inspecao_inicial: "inspecao_inicial",
  inspecao_final: "inspecao_final"
};

// Get etapa for a specific service type
export const getEtapaForServico = (tipo: TipoServico): EtapaOS => {
  return servicoToEtapaMapping[tipo] || "retifica";
};

// Get all service types for a specific etapa
export const getServicosForEtapa = (etapa: EtapaOS): TipoServico[] => {
  return Object.entries(servicoToEtapaMapping)
    .filter(([_, etapaValue]) => etapaValue === etapa)
    .map(([tipoServico, _]) => tipoServico as TipoServico);
};
