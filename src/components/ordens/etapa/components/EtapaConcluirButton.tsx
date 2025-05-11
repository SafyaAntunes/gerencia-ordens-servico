
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface EtapaConcluirButtonProps {
  isConcluida: boolean;
  onClick: () => void;
  className?: string;
  todasSubatividadesConcluidas?: boolean;
  temFuncionarioSelecionado?: boolean;
  onConcluir?: (concluir: boolean) => Promise<boolean>;
}

export default function EtapaConcluirButton({
  isConcluida,
  onClick,
  className = "",
  todasSubatividadesConcluidas,
  temFuncionarioSelecionado
}: EtapaConcluirButtonProps) {
  if (isConcluida) {
    return null;
  }
  
  return (
    <Button 
      variant="default" 
      size="sm" 
      className={`w-full bg-blue-500 hover:bg-blue-600 text-white ${className}`}
      onClick={onClick}
      disabled={todasSubatividadesConcluidas === false || !temFuncionarioSelecionado}
    >
      <CheckCircle2 className="h-4 w-4 mr-1" />
      Marcar Etapa como Concluída
    </Button>
  );
}
