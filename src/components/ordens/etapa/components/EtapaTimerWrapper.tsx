
import { EtapaOS, TipoServico } from "@/types/ordens";
import OrdemCronometro from "../../OrdemCronometro";

interface EtapaTimerWrapperProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  isEtapaConcluida: boolean;
  onEtapaConcluida: (tempoTotal: number) => void;
  onTimerStart: () => boolean;
  onCustomStart: () => boolean;
}

export default function EtapaTimerWrapper({
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  tipoServico,
  isEtapaConcluida,
  onEtapaConcluida,
  onTimerStart,
  onCustomStart
}: EtapaTimerWrapperProps) {
  return (
    <OrdemCronometro
      ordemId={ordemId}
      funcionarioId={funcionarioId}
      funcionarioNome={funcionarioNome}
      etapa={etapa}
      onFinish={onEtapaConcluida}
      isEtapaConcluida={isEtapaConcluida}
      onStart={onTimerStart}
      onCustomStart={onCustomStart}
      tipoServico={tipoServico}
    />
  );
}
