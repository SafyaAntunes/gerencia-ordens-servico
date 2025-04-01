
/**
 * Formats milliseconds into hours:minutes:seconds
 */
export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

/**
 * Generate a unique storage key for a timer
 */
export const generateTimerStorageKey = (
  ordemId: string, 
  etapa: string, 
  tipoServico?: string
): string => {
  return `cronometro-${ordemId}-${etapa}${tipoServico ? `-${tipoServico}` : ''}`;
};

export const tipoServicoLabels: Record<string, string> = {
  bloco: "Bloco",
  biela: "Biela",
  cabecote: "Cabeçote",
  virabrequim: "Virabrequim",
  eixo_comando: "Eixo de Comando"
};
