
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface EtapaConcluiButtonProps {
  isConcluida?: boolean; // Renamed from 'concluido' to match usage
  concluido?: boolean; // Keep both for backward compatibility
  todasSubatividadesConcluidas: boolean;
  onConcluir: () => void;
  temFuncionarioSelecionado: boolean;
}

export default function EtapaConcluiButton({
  isConcluida,
  concluido,
  todasSubatividadesConcluidas,
  onConcluir,
  temFuncionarioSelecionado
}: EtapaConcluiButtonProps) {
  // Use either isConcluida or concluido
  const etapaConcluida = isConcluida || concluido;
  
  if (etapaConcluida) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <Button 
        variant="default" 
        size="sm" 
        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        onClick={onConcluir}
        disabled={!temFuncionarioSelecionado || !todasSubatividadesConcluidas}
      >
        <CheckCircle2 className="h-4 w-4 mr-1" />
        Marcar Etapa como Concluída
      </Button>
    </div>
  );
}
