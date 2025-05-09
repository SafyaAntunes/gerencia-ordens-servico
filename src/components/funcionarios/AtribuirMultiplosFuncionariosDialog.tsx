
import { useState, useEffect, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFuncionariosDisponibilidade } from '@/hooks/useFuncionariosDisponibilidade';
import { TipoServico } from '@/types/ordens';
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CircleCheck, Clock, CircleX } from "lucide-react";

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
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<string[]>(funcionariosSelecionadosIds);
  const { funcionariosStatus, funcionariosDisponiveis, loading } = useFuncionariosDisponibilidade();

  // Sincronizar com o estado do pai quando mudar
  useEffect(() => {
    if (open) {
      setFuncionariosSelecionados(funcionariosSelecionadosIds);
    }
  }, [funcionariosSelecionadosIds, open]);

  // REMOVIDO o useEffect que estava causando múltiplas chamadas para onConfirm
  // Isso evitará as notificações repetidas

  // Memoize funções e valores calculados para evitar recálculos desnecessários
  const funcionariosElegiveis = useCallback(() => {
    return apenasDisponiveis 
      ? funcionariosDisponiveis 
      : funcionariosStatus.filter(f => f.status !== 'inativo');
  }, [apenasDisponiveis, funcionariosDisponiveis, funcionariosStatus]);
  
  // Memoize a lista filtrada de funcionários
  const funcionariosFiltrados = useCallback(() => {
    const elegiveis = funcionariosElegiveis();
    return especialidadeRequerida
      ? elegiveis.filter(f => 
          f.especialidades && f.especialidades.includes(especialidadeRequerida)
        )
      : elegiveis;
  }, [especialidadeRequerida, funcionariosElegiveis]);

  // Otimize o toggle de funcionário com useCallback
  const handleToggleFuncionario = useCallback((id: string) => {
    setFuncionariosSelecionados(prev => {
      if (prev.includes(id)) {
        return prev.filter(funcionarioId => funcionarioId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // Otimize o handleConfirm para ser mais eficiente
  const handleConfirm = useCallback(() => {
    if (funcionariosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um funcionário para continuar");
      return;
    }
    
    // Obter nomes dos funcionários selecionados
    const funcionariosNomes = funcionariosSelecionados.map(id => {
      const funcionario = funcionariosStatus.find(f => f.id === id);
      return funcionario?.nome || '';
    }).filter(nome => nome !== '');
    
    // Chamar onConfirm apenas uma vez ao clicar no botão
    onConfirm(funcionariosSelecionados, funcionariosNomes);
    onOpenChange(false);
  }, [funcionariosSelecionados, funcionariosStatus, onConfirm, onOpenChange]);

  // Memoize a lista de funcionários filtrados atual
  const funcionariosFiltradosAtual = funcionariosFiltrados();

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
                  <div key={funcionario.id} className="flex items-center space-x-2 border p-3 rounded-lg">
                    <Checkbox 
                      id={`funcionario-${funcionario.id}`} 
                      checked={funcionariosSelecionados.includes(funcionario.id)}
                      onCheckedChange={() => handleToggleFuncionario(funcionario.id)}
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`funcionario-${funcionario.id}`}
                        className="flex justify-between cursor-pointer"
                      >
                        <span className="font-medium">{funcionario.nome}</span>
                        {funcionario.status === 'disponivel' ? (
                          <Badge variant="success" className="flex gap-1 items-center">
                            <CircleCheck className="h-3.5 w-3.5" />
                            Disponível
                          </Badge>
                        ) : funcionario.status === 'ocupado' ? (
                          <Badge variant="warning" className="flex gap-1 items-center">
                            <Clock className="h-3.5 w-3.5" />
                            Ocupado
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex gap-1 items-center">
                            <CircleX className="h-3.5 w-3.5" />
                            Inativo
                          </Badge>
                        )}
                      </Label>
                      {funcionario.especialidades && funcionario.especialidades.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {funcionario.especialidades.map(esp => (
                            <Badge key={esp} variant="secondary" className="text-xs">
                              {esp}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
            <Button onClick={handleConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
