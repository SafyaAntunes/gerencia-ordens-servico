
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
          onClick={onPause}
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
          Iniciar
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
  );
}
