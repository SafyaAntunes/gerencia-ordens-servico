import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const {
    funcionariosFiltradosAtual,
    loading,
    funcionariosSelecionados,
    handleToggleFuncionario,
    handleConfirm
  } = useAtribuirFuncionariosDialog({
    funcionariosSelecionadosIds,
    especialidadeRequerida,
    apenasDisponiveis,
    onConfirm
  });

  // Memoize a função de toggle para evitar recriações desnecessárias
  const memoizedHandleToggle = useCallback((id: string) => {
    handleToggleFuncionario(id);
  }, [handleToggleFuncionario]);

  // Memoize a função de verificação de seleção
  const isFuncionarioSelected = useCallback((id: string) => {
    return funcionariosSelecionados.includes(id);
  }, [funcionariosSelecionados]);

  // Memoize a lista de funcionários filtrados
  const memoizedFuncionarios = useMemo(() => {
    return funcionariosFiltradosAtual;
  }, [funcionariosFiltradosAtual]);

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
          ) : memoizedFuncionarios.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {memoizedFuncionarios.map(funcionario => (
                  <FuncionarioCheckItem
                    key={funcionario.id}
                    id={funcionario.id}
                    nome={funcionario.nome}
                    status={funcionario.status}
                    especialidades={funcionario.especialidades}
                    isChecked={isFuncionarioSelected(funcionario.id)}
                    onToggle={memoizedHandleToggle}
                  />
                ))}
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
            <Button 
              onClick={() => {
                if (handleConfirm(onConfirm)) {
                  onOpenChange(false);
                }
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
