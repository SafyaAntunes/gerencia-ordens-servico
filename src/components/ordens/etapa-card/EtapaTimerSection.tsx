import { EtapaOS, TipoServico } from "@/types/ordens";
import OrdemCronometro from "../OrdemCronometro";
import useEtapaTimerSection from "@/hooks/useEtapaTimerSection";
import { Button } from "@/components/ui/button";
import { CheckCircle2, User } from "lucide-react";

interface EtapaTimerSectionProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  isEtapaConcluida: boolean;
  onEtapaConcluida: (tempoTotal: number) => void;
  onMarcarConcluido: () => void;
  onTimerStart: () => void;
  onCustomStart: () => boolean;
  onSaveResponsavel: () => void;
  onRemoverResponsavel: () => void;
}

export function EtapaTimerSection({
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  tipoServico,
  isEtapaConcluida,
  onEtapaConcluida,
  onMarcarConcluido,
  onTimerStart,
  onCustomStart,
  onSaveResponsavel,
  onRemoverResponsavel
}: EtapaTimerSectionProps) {
  const { timerProps, concluirButtonProps } = useEtapaTimerSection({
    ordemId,
    funcionarioId,
    etapa,
    tipoServico,
    isEtapaConcluida,
    onEtapaConcluida,
    onMarcarConcluido,
    onTimerStart,
    onCustomStart,
    onSaveResponsavel
  });
  
  return (
    <div className="p-4 border rounded-md mb-4">
      <OrdemCronometro {...timerProps} />
      
      <div className="flex space-x-2 mt-4">
        {!concluirButtonProps.isConcluida && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={concluirButtonProps.onClick}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Marcar Etapa como Concluída
          </Button>
        )}
      </div>
      
      {funcionarioId && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm">
              Responsável: {funcionarioNome}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoverResponsavel}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            Remover
          </Button>
        </div>
      )}
    </div>
  );
}
