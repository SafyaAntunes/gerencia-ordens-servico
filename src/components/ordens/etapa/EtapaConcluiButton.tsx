
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface EtapaConcluiButtonProps {
  isConcluida: boolean;
  onClick: () => void;
}

export default function EtapaConcluiButton({
  isConcluida,
  onClick
}: EtapaConcluiButtonProps) {
  if (isConcluida) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <Button 
        variant="default" 
        size="sm" 
        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        onClick={onClick}
      >
        <CheckCircle2 className="h-4 w-4 mr-1" />
        Marcar Etapa como Concluída
      </Button>
    </div>
  );
}
