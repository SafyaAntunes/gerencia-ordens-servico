
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import OrdemCronometro from "../OrdemCronometro";
import { EtapaOS, TipoServico } from "@/types/ordens";

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
  return (
    <div className="p-4 border rounded-md mb-4">
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
      
      {!isEtapaConcluida && (
        <div className="mt-4">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={onMarcarConcluido}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Marcar Etapa como Concluída
          </Button>
        </div>
      )}
    </div>
  );
}
