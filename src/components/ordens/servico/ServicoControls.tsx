
import { Button } from "@/components/ui/button";
import { Play, Pause, StopCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import PausaDialog from "../PausaDialog";
import { Servico } from "@/types/ordens";
import { toast } from "sonner";

interface ServicoControlsProps {
  isRunning?: boolean;
  isPaused?: boolean;
  temPermissao: boolean;
  concluido?: boolean;
  todasSubatividadesConcluidas?: boolean;
  subatividadesConcluidas?: number;
  subatividadesSelecionadas?: number;
  totalSubatividades?: number;
  servico?: Servico;
  onStartClick?: () => void;
  onPauseClick?: (motivo?: string) => void;
  onResumeClick?: () => void;
  onFinishClick?: () => void;
  onMarcarConcluido?: () => void;
  onServicoConcluidoToggle?: (checked: boolean) => Promise<void> | void;
}

export default function ServicoControls({
  isRunning = false,
  isPaused = false,
  temPermissao,
  concluido = false,
  todasSubatividadesConcluidas = false,
  subatividadesConcluidas = 0,
  subatividadesSelecionadas = 0,
  totalSubatividades = 0,
  servico,
  onStartClick,
  onPauseClick,
  onResumeClick,
  onFinishClick,
  onMarcarConcluido,
  onServicoConcluidoToggle
}: ServicoControlsProps) {
  const [pausaDialogOpen, setPausaDialogOpen] = useState(false);
  
  // Calculate if all selected subatividades are completed
  const allSelectedSubatividadesComplete = 
    subatividadesSelecionadas > 0 && 
    subatividadesConcluidas >= subatividadesSelecionadas;
    
  const handlePauseClick = () => {
    setPausaDialogOpen(true);
  };
  
  const handlePausaConfirm = (motivo: string) => {
    if (onPauseClick) onPauseClick(motivo);
    setPausaDialogOpen(false);
  };

  const handlePausaCancel = () => {
    setPausaDialogOpen(false);
  };
  
  const handleMarcarConcluido = () => {
    if (!allSelectedSubatividadesComplete && !todasSubatividadesConcluidas) {
      toast.error("Complete todas as subatividades antes de marcar o serviço como concluído.");
      return;
    }
    
    if (onServicoConcluidoToggle) {
      onServicoConcluidoToggle(true);
    } else if (onMarcarConcluido) {
      onMarcarConcluido();
    }
  };

  if (!temPermissao) {
    return null;
  }
  
  return (
    <>
      <div className="py-3">
        {(isRunning || isPaused || onStartClick) && (
          <div className="flex space-x-2 my-2">
            {!isRunning && !isPaused && !concluido && onStartClick && (
              <Button
                onClick={onStartClick}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Play className="h-4 w-4 mr-1" />
                Iniciar Timer
              </Button>
            )}
            
            {isRunning && !isPaused && onPauseClick && (
              <Button
                onClick={handlePauseClick}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </Button>
            )}
            
            {isPaused && onResumeClick && (
              <Button
                onClick={onResumeClick}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Play className="h-4 w-4 mr-1" />
                Retomar
              </Button>
            )}
            
            {(isRunning || isPaused) && onFinishClick && (
              <Button
                onClick={onFinishClick}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Terminar
              </Button>
            )}
          </div>
        )}
      </div>
      
      {!concluido && (onServicoConcluidoToggle || onMarcarConcluido) && (
        <>
          {subatividadesSelecionadas > 0 && (
            <div className="text-xs text-center mb-2">
              {subatividadesConcluidas}/{subatividadesSelecionadas} subatividades concluídas
            </div>
          )}
          <div className="pt-0 pb-4">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleMarcarConcluido}
              disabled={!allSelectedSubatividadesComplete && !todasSubatividadesConcluidas}
              className={`w-full ${
                allSelectedSubatividadesComplete || todasSubatividadesConcluidas
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400'
              } text-white`}
              title={
                !allSelectedSubatividadesComplete && !todasSubatividadesConcluidas
                  ? "Complete todas as subatividades primeiro"
                  : "Marcar como concluído"
              }
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Marcar Concluído
            </Button>
          </div>
        </>
      )}
      
      <PausaDialog 
        isOpen={pausaDialogOpen}
        onClose={handlePausaCancel}
        onConfirm={handlePausaConfirm}
      />
    </>
  );
}
