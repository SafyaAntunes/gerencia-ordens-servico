
import { EtapaOS, TipoServico } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import EtapaTimerWrapper from "./EtapaTimerWrapper";
import EtapaConcluirButton from "./EtapaConcluirButton";

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
  onSaveResponsavel: () => void;
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
      
      <div className="flex space-x-2 mt-4">
        <EtapaConcluirButton 
          isConcluida={isEtapaConcluida} 
          onClick={onMarcarConcluido} 
          className="flex-1"
        />
      </div>
    </div>
  );
}
