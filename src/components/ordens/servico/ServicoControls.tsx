
import { Button } from "@/components/ui/button";
import { Play, Pause, StopCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import PausaDialog from "../PausaDialog";

interface ServicoControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  temPermissao: boolean;
  concluido: boolean;
  onStartClick: () => void;
  onPauseClick: () => void;
  onResumeClick: () => void;
  onFinishClick: () => void;
  onMarcarConcluido: () => void;
}

export default function ServicoControls({
  isRunning,
  isPaused,
  temPermissao,
  concluido,
  onStartClick,
  onPauseClick,
  onResumeClick,
  onFinishClick,
  onMarcarConcluido,
}: ServicoControlsProps) {
  const [pausaDialogOpen, setPausaDialogOpen] = useState(false);
  
  const handlePauseClick = () => {
    setPausaDialogOpen(true);
  };
  
  const handlePausaConfirm = (motivo: string) => {
    onPauseClick();
    setPausaDialogOpen(false);
  };

  const handlePausaCancel = () => {
    setPausaDialogOpen(false);
  };

  if (!temPermissao) {
    return null;
  }
  
  return (
    <>
      <div className="py-3">
        <div className="flex space-x-2 my-2">
          {!isRunning && !isPaused && !concluido && (
            <Button
              onClick={onStartClick}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Play className="h-4 w-4 mr-1" />
              Iniciar Timer
            </Button>
          )}
          
          {isRunning && !isPaused && (
            <Button
              onClick={handlePauseClick}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pausar
            </Button>
          )}
          
          {isPaused && (
            <Button
              onClick={onResumeClick}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Play className="h-4 w-4 mr-1" />
              Retomar
            </Button>
          )}
          
          {(isRunning || isPaused) && (
            <Button
              onClick={onFinishClick}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              <StopCircle className="h-4 w-4 mr-1" />
              Terminar
            </Button>
          )}
        </div>
      </div>
      
      {!concluido && (
        <div className="pt-0 pb-4">
          <Button 
            variant="default" 
            size="sm" 
            onClick={onMarcarConcluido}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Marcar Concluído
          </Button>
        </div>
      )}
      
      <PausaDialog 
        isOpen={pausaDialogOpen}
        onClose={handlePausaCancel}
        onConfirm={handlePausaConfirm}
      />
    </>
  );
}
