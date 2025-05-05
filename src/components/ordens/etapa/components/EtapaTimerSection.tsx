
import { EtapaOS, TipoServico } from "@/types/ordens";
import EtapaTimerWrapper from "./EtapaTimerWrapper";
import EtapaConcluirButton from "./EtapaConcluirButton";
import { User } from "lucide-react";

interface EtapaTimerSectionProps {
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
}

export default function EtapaTimerSection({
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
}: EtapaTimerSectionProps) {
  const handleTimerFinish = (tempoTotal: number) => {
    onEtapaConcluida(tempoTotal);
  };
  
  return (
    <div className="p-4 border rounded-md mb-4">
      <EtapaTimerWrapper
        ordemId={ordemId}
        funcionarioId={funcionarioId}
        funcionarioNome={funcionarioNome}
        etapa={etapa}
        tipoServico={tipoServico}
        isEtapaConcluida={isEtapaConcluida}
        onEtapaConcluida={handleTimerFinish}
        onTimerStart={onTimerStart}
        onCustomStart={onCustomStart}
      />
      
      <EtapaConcluirButton 
        isConcluida={isEtapaConcluida} 
        onClick={onMarcarConcluido} 
      />
    </div>
  );
}
