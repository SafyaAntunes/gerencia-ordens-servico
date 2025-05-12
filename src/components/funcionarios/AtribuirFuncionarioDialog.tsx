
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SimpleFuncionarioSelector } from './SimpleFuncionarioSelector';
import { TipoServico } from '@/types/ordens';
import { toast } from "sonner";

interface AtribuirFuncionarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (funcionarioId: string, funcionarioNome: string) => void;
  funcionarioAtualId?: string;
  funcionarioAtualNome?: string;
  especialidadeRequerida?: TipoServico;
  title?: string;
  description?: string;
  apenasDisponiveis?: boolean;
  confirmLabel?: string;
}

export function AtribuirFuncionarioDialog({
  open,
  onOpenChange,
  onConfirm,
  funcionarioAtualId,
  funcionarioAtualNome,
  especialidadeRequerida,
  title = "Atribuir Funcionário",
  description = "Selecione o funcionário para realizar este serviço.",
  apenasDisponiveis = false,
  confirmLabel = "Confirmar"
}: AtribuirFuncionarioDialogProps) {
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>(funcionarioAtualId || "");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>(funcionarioAtualNome || "");

  // Debug log
  console.log("AtribuirFuncionarioDialog - render", {
    funcionarioAtualId,
    funcionarioAtualNome,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome
  });

  // Atualizar o funcionário selecionado quando o diálogo abrir ou quando as props mudarem
  useEffect(() => {
    if (open) {
      console.log("AtribuirFuncionarioDialog - useEffect", {
        funcionarioAtualId,
        funcionarioAtualNome
      });
      setFuncionarioSelecionadoId(funcionarioAtualId || "");
      setFuncionarioSelecionadoNome(funcionarioAtualNome || "");
    }
  }, [open, funcionarioAtualId, funcionarioAtualNome]);

  const handleFuncionarioSelecionado = (id: string, nome: string) => {
    console.log("AtribuirFuncionarioDialog - handleFuncionarioSelecionado", {
      id,
      nome
    });
    setFuncionarioSelecionadoId(id);
    setFuncionarioSelecionadoNome(nome);
  };

  const handleConfirm = () => {
    if (!funcionarioSelecionadoId) {
      toast.error("Selecione um funcionário para continuar");
      return;
    }
    console.log("AtribuirFuncionarioDialog - handleConfirm", {
      id: funcionarioSelecionadoId,
      nome: funcionarioSelecionadoNome
    });
    onConfirm(funcionarioSelecionadoId, funcionarioSelecionadoNome);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <SimpleFuncionarioSelector
            especialidadeRequerida={especialidadeRequerida}
            funcionarioAtualId={funcionarioSelecionadoId}
            funcionarioAtualNome={funcionarioSelecionadoNome}
            onFuncionarioSelecionado={handleFuncionarioSelecionado}
            mostrarCancelar={false}
            apenasDisponiveis={apenasDisponiveis}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
