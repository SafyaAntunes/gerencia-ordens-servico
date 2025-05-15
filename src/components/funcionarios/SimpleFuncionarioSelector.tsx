
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFuncionariosDisponibilidade } from '@/hooks/useFuncionariosDisponibilidade';
import { Funcionario } from '@/types/funcionarios';
import { TipoServico } from '@/types/ordens';
import { CircleCheck, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface SimpleFuncionarioSelectorProps {
  especialidadeRequerida?: TipoServico;
  funcionarioAtualId?: string;
  funcionarioAtualNome?: string;
  onFuncionarioSelecionado: (id: string, nome: string) => void;
  onCancelar?: () => void;
  mostrarCancelar?: boolean;
  disabled?: boolean;
  label?: string;
  apenasDisponiveis?: boolean;
}

export function SimpleFuncionarioSelector({
  especialidadeRequerida,
  funcionarioAtualId,
  funcionarioAtualNome,
  onFuncionarioSelecionado,
  onCancelar,
  mostrarCancelar = true,
  disabled = false,
  label = "Selecionar Funcionário",
  apenasDisponiveis = false
}: SimpleFuncionarioSelectorProps) {
  const [funcionarioId, setFuncionarioId] = useState<string>(funcionarioAtualId || "");
  const { funcionariosStatus, loading } = useFuncionariosDisponibilidade();

  // Atualizar o estado quando o funcionário atual mudar
  useEffect(() => {
    console.log("funcionarioAtualId mudou:", funcionarioAtualId);
    if (funcionarioAtualId) {
      setFuncionarioId(funcionarioAtualId);
    }
  }, [funcionarioAtualId]);

  // Filtrar funcionários elegíveis - memoizado para performance
  const funcionariosElegiveis = useMemo(() => {
    // Se apenasDisponiveis=true, mostrar apenas funcionários disponíveis
    // Se apenasDisponiveis=false, mostrar disponíveis + o funcionário atual (se existir)
    return funcionariosStatus.filter(f => {
      // Sempre excluir inativos
      if (f.status === 'inativo' || f.ativo === false) {
        return false;
      }
      
      // Se pediu apenas disponíveis, filtrar por status 'disponivel'
      if (apenasDisponiveis) {
        return f.status === 'disponivel';
      }
      
      // Caso não tenha pedido apenas disponíveis, permite selecionar funcionários ocupados
      // mas sempre inclui o funcionário atual se ele existir
      return f.status === 'disponivel' || f.id === funcionarioAtualId;
    });
  }, [apenasDisponiveis, funcionariosStatus, funcionarioAtualId]);

  // Se tiver especialidade requerida, filtrar mais - memoizado para performance
  const funcionariosFiltrados = useMemo(() => {
    const elegiveis = funcionariosElegiveis;
    
    // Se tiver especialidade, filtra por ela, senão retorna todos
    if (especialidadeRequerida) {
      return elegiveis.filter(f => 
        f.especialidades && f.especialidades.includes(especialidadeRequerida)
      );
    }
    
    return elegiveis;
  }, [especialidadeRequerida, funcionariosElegiveis]);

  // Encontrar o funcionário selecionado atual
  const funcionarioSelecionado = useMemo(() => {
    return funcionariosStatus.find(f => f.id === funcionarioId);
  }, [funcionariosStatus, funcionarioId]);

  const handleChange = useCallback((id: string) => {
    setFuncionarioId(id);
    
    const funcionario = funcionariosStatus.find(f => f.id === id);
    
    if (funcionario) {
      console.log("Funcionário selecionado:", funcionario);
      
      // Verificar se o funcionário está ocupado e não é o atual
      if (funcionario.status === 'ocupado' && id !== funcionarioAtualId) {
        toast.warning(`${funcionario.nome} já está ocupado em outro serviço`);
      }
      
      onFuncionarioSelecionado(id, funcionario.nome);
    } else {
      console.error("Funcionário não encontrado:", id);
      toast.error("Funcionário não encontrado");
    }
  }, [funcionariosStatus, onFuncionarioSelecionado, funcionarioAtualId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm opacity-70">{label}</Label>
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm opacity-70">{label}</Label>
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <Select 
            disabled={disabled} 
            value={funcionarioId} 
            onValueChange={handleChange}
          >
            <SelectTrigger>
              <SelectValue>
                {funcionarioSelecionado ? (
                  <div className="flex items-center gap-2">
                    {funcionarioSelecionado.nome}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            {funcionarioSelecionado.status === 'disponivel' ? (
                              <Badge variant="success" className="ml-2 text-xs">
                                <CircleCheck className="h-3 w-3 mr-1" />
                                Disponível
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="ml-2 text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Ocupado
                              </Badge>
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {funcionarioSelecionado.status === 'disponivel' 
                            ? 'Funcionário disponível para atribuição' 
                            : 'Funcionário está trabalhando em outra tarefa'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : (
                  "Selecionar funcionário"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {funcionariosFiltrados.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {especialidadeRequerida 
                    ? `Nenhum funcionário com especialidade em ${especialidadeRequerida} disponível` 
                    : "Nenhum funcionário disponível"}
                </div>
              ) : (
                funcionariosFiltrados.map((funcionario) => (
                  <SelectItem 
                    key={funcionario.id} 
                    value={funcionario.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {funcionario.nome}
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              {funcionario.status === 'disponivel' ? (
                                <Badge variant="success" className="ml-2 text-xs">
                                  <CircleCheck className="h-3 w-3 mr-1" />
                                  Disponível
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="ml-2 text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Ocupado
                                </Badge>
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {funcionario.status === 'disponivel' 
                              ? 'Funcionário disponível para atribuição' 
                              : 'Funcionário está trabalhando em outra tarefa'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        {mostrarCancelar && onCancelar && (
          <Button variant="ghost" size="sm" onClick={onCancelar} type="button">
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
