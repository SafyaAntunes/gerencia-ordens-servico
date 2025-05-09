
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TipoServico } from '@/types/ordens';
import { useAtribuirFuncionariosDialog } from "./hooks/useAtribuirFuncionariosDialog";
import { FuncionarioCheckItem } from "./components/FuncionarioCheckItem";

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
  console.log("Dialog render - props.funcionariosSelecionadosIds:", funcionariosSelecionadosIds);
  console.log("Dialog open state:", open);
  
  const {
    funcionariosSelecionados,
    funcionariosFiltradosAtual,
    isFuncionarioSelected,
    handleToggleFuncionario,
    handleConfirm,
    loading
  } = useAtribuirFuncionariosDialog({
    funcionariosSelecionadosIds,
    especialidadeRequerida,
    apenasDisponiveis
  });

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
                {funcionariosFiltradosAtual.map(funcionario => (
                  <FuncionarioCheckItem
                    key={funcionario.id}
                    id={funcionario.id}
                    nome={funcionario.nome}
                    status={funcionario.status}
                    especialidades={funcionario.especialidades}
                    isChecked={isFuncionarioSelected(funcionario.id)}
                    onToggle={handleToggleFuncionario}
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
        
        <DialogFooter className="flex items-center justify-between">
          <div>
            <Badge variant="outline" className="mr-2">
              {funcionariosSelecionados.length} selecionados
            </Badge>
          </div>
          <div className="flex gap-2">
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
