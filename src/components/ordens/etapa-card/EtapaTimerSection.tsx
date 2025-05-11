
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
  onSaveResponsavel: () => void;
}

export default function EtapaTimerSection(props: EtapaTimerSectionProps) {
  const { timerProps, concluirButtonProps } = useEtapaTimerSection(props);
  
  return (
    <div className="p-4 border rounded-md mb-4">
      <OrdemCronometro {...timerProps} />
      
      <div className="flex space-x-2 mt-4">
        {!concluirButtonProps.isConcluida && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => {
              concluirButtonProps.onClick();
              return true;
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Marcar Etapa como Concluída
          </Button>
        )}
      </div>
    </div>
  );
}
