
import { Button } from "@/components/ui/button";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";

interface EtapaConcluiButtonProps {
  isConcluida: boolean;
  todasSubatividadesConcluidas: boolean;
  onConcluir: () => void;
  temFuncionarioSelecionado: boolean;
  concluido?: boolean; // Para compatibilidade
}

export default function EtapaConcluiButton({
  isConcluida,
  todasSubatividadesConcluidas,
  onConcluir,
  temFuncionarioSelecionado,
  concluido
}: EtapaConcluiButtonProps) {
  // Usar isConcluida ou concluido (para retrocompatibilidade)
  const etapaConcluida = isConcluida || concluido;

  const handleClick = () => {
    if (etapaConcluida) {
      toast.info("Esta etapa já está concluída");
      return;
    }

    if (!todasSubatividadesConcluidas) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
      return;
    }

    if (!temFuncionarioSelecionado) {
      toast.error("É necessário selecionar um funcionário responsável");
      return;
    }

    onConcluir();
  };

  return (
    <div className="mt-4">
      <Button
        onClick={handleClick}
        disabled={etapaConcluida || !todasSubatividadesConcluidas || !temFuncionarioSelecionado}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <CircleCheck className="mr-2 h-4 w-4" />
        Concluir Etapa
      </Button>
    </div>
  );
}
