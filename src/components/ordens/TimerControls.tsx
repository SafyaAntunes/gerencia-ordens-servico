
import { Button } from "@/components/ui/button";
import { Play, Pause, StopCircle } from "lucide-react";

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  usarCronometro: boolean;
  onStart: () => void;
  onPause: () => void;
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
  return (
    <div className="flex gap-2 mb-3">
      {!isRunning && (
        <Button
          onClick={onStart}
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          disabled={!usarCronometro && !onStart}
        >
          <Play className="mr-2 h-4 w-4" /> Iniciar
        </Button>
      )}
      
      {isRunning && !isPaused && (
        <Button
          onClick={onPause}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
          disabled={!usarCronometro && !onPause}
        >
          <Pause className="mr-2 h-4 w-4" /> Pausar
        </Button>
      )}
      
      {isRunning && isPaused && (
        <Button
          onClick={onResume}
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          disabled={!usarCronometro && !onResume}
        >
          <Play className="mr-2 h-4 w-4" /> Retomar
        </Button>
      )}
      
      {isRunning && (
        <Button
          onClick={onFinish}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!usarCronometro && !onFinish}
        >
          <StopCircle className="mr-2 h-4 w-4" /> Terminar
        </Button>
      )}
    </div>
  );
}
