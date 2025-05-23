
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TipoServico } from '@/types/ordens';
import { FuncionarioCheckItem } from "./components/FuncionarioCheckItem";
import { useAtribuirFuncionariosDialog } from "./hooks/useAtribuirFuncionariosDialog";
import { useState } from "react";

interface AtribuirFuncionariosDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (funcionariosIds: string[], funcionariosNomes: string[]) => void;
  onCancel: () => void;
  especialidadeRequerida?: TipoServico;
  funcionariosSelecionadosIds?: string[];
  title?: string;
  description?: string;
  apenasDisponiveis?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function AtribuirFuncionariosDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  especialidadeRequerida,
  funcionariosSelecionadosIds = [],
  title = "Atribuir Funcionário",
  description = "Selecione um funcionário para realizar este serviço.",
  apenasDisponiveis = true,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar"
}: AtribuirFuncionariosDialogProps) {
  const {
    funcionariosFiltradosAtual,
    loading,
    funcionariosSelecionados,
    handleToggleFuncionario,
    isFuncionarioSelected,
    handleConfirm
  } = useAtribuirFuncionariosDialog({
    funcionariosSelecionadosIds,
    especialidadeRequerida,
    apenasDisponiveis,
    onConfirm,
    isOpen
  });

  const handleConfirmAndClose = () => {
    if (handleConfirm(onConfirm)) {
      onOpenChange(false);
    }
  };

  const handleCancelAndClose = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : funcionariosFiltradosAtual.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {funcionariosFiltradosAtual.map((funcionario) => (
                  <FuncionarioCheckItem
                    key={funcionario.id}
                    id={funcionario.id}
                    nome={funcionario.nome}
                    status={funcionario.status}
                    especialidades={funcionario.especialidades}
                    isChecked={isFuncionarioSelected(funcionario.id)}
                    onToggle={() => handleToggleFuncionario(funcionario.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum funcionário {apenasDisponiveis ? "disponível" : ""} 
              {especialidadeRequerida ? (
                <> com especialidade em {especialidadeRequerida}</>
              ) : ""}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancelAndClose}>
            {cancelLabel}
          </Button>
          <Button onClick={handleConfirmAndClose}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
