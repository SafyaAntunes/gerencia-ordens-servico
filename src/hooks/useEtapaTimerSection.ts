
import { EtapaOS, TipoServico } from "@/types/ordens";

interface UseEtapaTimerSectionProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  isEtapaConcluida: boolean;
  onEtapaConcluida: (tempoTotal: number) => void;
  onMarcarConcluido: () => void;
  onTimerStart: () => boolean;
  onCustomStart: () => boolean;
  onSaveResponsavel: () => void;
}

export default function useEtapaTimerSection({
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  tipoServico,
  isEtapaConcluida,
  onEtapaConcluida,
  onMarcarConcluido,
  onTimerStart,
  onCustomStart
}: UseEtapaTimerSectionProps) {
  // We can add additional logic here if needed in the future
  
  // Return required props for components
  return {
    timerProps: {
      ordemId,
      funcionarioId,
      funcionarioNome,
      etapa,
      tipoServico,
      isEtapaConcluida,
      onFinish: onEtapaConcluida,
      onTimerStart,
      onCustomStart
    },
    concluirButtonProps: {
      isConcluida: isEtapaConcluida,
      onClick: onMarcarConcluido,
      className: ""
    }
  };
}
