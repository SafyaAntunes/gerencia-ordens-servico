
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, StopCircle } from "lucide-react";
import PausaDialog from "./PausaDialog";

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  usarCronometro: boolean;
  onStart: () => void;
  onPause: (motivo?: string) => void;
  onResume: () => void;
  onFinish: () => void;
}

export default function TimerControls({
  isRunning,
  isPaused,
  usarCronometro,
  onStart,
  onPause,
  onResume,
  onFinish
}: TimerControlsProps) {
  const [pausaDialogOpen, setPausaDialogOpen] = useState(false);
  
  const handlePauseClick = () => {
    setPausaDialogOpen(true);
  };
  
  const handlePausaConfirm = (motivo: string) => {
    onPause(motivo);
    setPausaDialogOpen(false);
  };

  const handlePausaCancel = () => {
    setPausaDialogOpen(false);
  };
  
  return (
    <>
      <div className="flex space-x-2 my-3">
        {!isRunning && (
          <Button
            onClick={onStart}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            disabled={!usarCronometro && !onStart}
          >
            Iniciar
          </Button>
        )}
        
        {isRunning && !isPaused && (
          <Button
            onClick={handlePauseClick}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white"
            disabled={!usarCronometro && !onPause}
          >
            Pausar
          </Button>
        )}
        
        {isRunning && isPaused && (
          <Button
            onClick={onResume}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            disabled={!usarCronometro && !onResume}
          >
            Retomar
          </Button>
        )}
        
        {isRunning && (
          <Button
            onClick={onFinish}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            disabled={!usarCronometro && !onFinish}
          >
            Terminar
          </Button>
        )}
      </div>
      
      <PausaDialog 
        isOpen={pausaDialogOpen}
        onClose={handlePausaCancel}
        onConfirm={handlePausaConfirm}
      />
    </>
  );
}
