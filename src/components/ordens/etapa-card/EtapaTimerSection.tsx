
import { EtapaOS, TipoServico } from "@/types/ordens";
import OrdemCronometro from "../OrdemCronometro";
import useEtapaTimerSection from "@/hooks/useEtapaTimerSection";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

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

export default function EtapaTimerSection(props: EtapaTimerSectionProps) {
  const { timerProps, concluirButtonProps } = useEtapaTimerSection(props);
  
  return (
    <div className="p-4 border rounded-md mb-4">
      <OrdemCronometro {...timerProps} />
      
      {!concluirButtonProps.isConcluida && (
        <div className="mt-4">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={concluirButtonProps.onClick}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Marcar Etapa como Concluída
          </Button>
        </div>
      )}
    </div>
  );
}
