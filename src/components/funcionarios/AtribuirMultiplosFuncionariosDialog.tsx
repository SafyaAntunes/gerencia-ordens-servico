
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TipoServico } from '@/types/ordens';
import { useAtribuirFuncionariosDialog } from "./hooks/useAtribuirFuncionariosDialog";
import { FuncionarioCheckItem } from "./components/FuncionarioCheckItem";
import { useCallback, useMemo } from "react";

interface AtribuirMultiplosFuncionariosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (funcionariosIds: string[], funcionariosNomes: string[]) => void;
  funcionariosSelecionadosIds?: string[];
  especialidadeRequerida?: TipoServico;
  title?: string;
  description?: string;
  apenasDisponiveis?: boolean;
  confirmLabel?: string;
}

export function AtribuirMultiplosFuncionariosDialog({
  open,
  onOpenChange,
  onConfirm,
  funcionariosSelecionadosIds = [],
  especialidadeRequerida,
  title = "Atribuir Funcionários",
  description = "Selecione os funcionários para realizar este serviço.",
  apenasDisponiveis = true,
  confirmLabel = "Confirmar"
}: AtribuirMultiplosFuncionariosDialogProps) {
  console.log("Dialog render - funcionariosSelecionadosIds:", funcionariosSelecionadosIds);

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
    onConfirm
  });

  // Log funcionários selecionados no componente principal
  console.log("Dialog component - funcionariosSelecionados:", funcionariosSelecionados);

  // Memoize a função de toggle para evitar recriações desnecessárias
  const memoizedHandleToggle = useCallback((id: string) => {
    console.log("Dialog component - toggle funcionário:", id);
    handleToggleFuncionario(id);
  }, [handleToggleFuncionario]);

  // Renderização otimizada dos itens de funcionário
  const funcionarioItems = useMemo(() => {
    console.log("Rerenderizando lista de funcionários, total:", funcionariosFiltradosAtual.length);
    return funcionariosFiltradosAtual.map(funcionario => {
      const isSelected = isFuncionarioSelected(funcionario.id);
      console.log(`Renderizando item ${funcionario.id} (${funcionario.nome}): selecionado=${isSelected}`);
      
      return (
        <FuncionarioCheckItem
          key={funcionario.id}
          id={funcionario.id}
          nome={funcionario.nome}
          status={funcionario.status}
          especialidades={funcionario.especialidades}
          isChecked={isSelected}
          onToggle={memoizedHandleToggle}
        />
      );
    });
  }, [funcionariosFiltradosAtual, isFuncionarioSelected, memoizedHandleToggle]);

  // Handler para confirmar a seleção
  const handleConfirmSelection = useCallback(() => {
    console.log("Confirmando seleção no diálogo");
    if (handleConfirm(onConfirm)) {
      onOpenChange(false);
    }
  }, [handleConfirm, onConfirm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : funcionariosFiltradosAtual.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {funcionarioItems}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum funcionário disponível
              {especialidadeRequerida && (
                <> com especialidade em {especialidadeRequerida}</>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSelection}>
              {confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
