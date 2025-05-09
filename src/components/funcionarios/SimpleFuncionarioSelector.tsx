
import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFuncionariosDisponibilidade } from '@/hooks/useFuncionariosDisponibilidade';
import { Funcionario } from '@/types/funcionarios';
import { TipoServico } from '@/types/ordens';
import { CircleCheck, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [funcionarioId, setFuncionarioId] = useState<string>("");
  const { funcionariosStatus, funcionariosDisponiveis, loading } = useFuncionariosDisponibilidade();

  // Debug logs
  console.log("SimpleFuncionarioSelector - render com ID:", funcionarioAtualId);
  console.log("SimpleFuncionarioSelector - estado interno:", funcionarioId);
  
  // Quando o funcionário atual mudar externamente
  useEffect(() => {
    if (funcionarioAtualId !== undefined) {
      console.log("SimpleFuncionarioSelector - funcionarioAtualId mudou:", funcionarioAtualId);
      setFuncionarioId(funcionarioAtualId);
    }
  }, [funcionarioAtualId]);

  // Filtrar funcionários elegíveis - memoizado para performance
  const funcionariosElegiveis = useCallback(() => {
    return apenasDisponiveis 
      ? funcionariosDisponiveis 
      : funcionariosStatus.filter(f => f.status !== 'inativo');
  }, [apenasDisponiveis, funcionariosDisponiveis, funcionariosStatus]);

  // Se tiver especialidade requerida, filtrar mais - memoizado para performance
  const funcionariosFiltrados = useCallback(() => {
    const elegiveis = funcionariosElegiveis();
    return especialidadeRequerida
      ? elegiveis.filter(f => 
          f.especialidades && f.especialidades.includes(especialidadeRequerida)
        )
      : elegiveis;
  }, [especialidadeRequerida, funcionariosElegiveis]);

  const handleChange = useCallback((id: string) => {
    console.log("SimpleFuncionarioSelector - handleChange:", id);
    setFuncionarioId(id);
    
    const funcionario = funcionariosStatus.find(f => f.id === id);
    if (funcionario) {
      onFuncionarioSelecionado(id, funcionario.nome);
    } else {
      console.warn("SimpleFuncionarioSelector - Funcionário não encontrado:", id);
    }
  }, [funcionariosStatus, onFuncionarioSelecionado]);

  // Memoize a lista de funcionários filtrados atual
  const funcionariosFiltradosAtual = funcionariosFiltrados();

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
              <SelectValue placeholder="Selecionar funcionário" />
            </SelectTrigger>
            <SelectContent>
              {funcionariosFiltradosAtual.map((funcionario) => (
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
              ))}

              {funcionariosFiltradosAtual.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {especialidadeRequerida 
                    ? `Nenhum funcionário com especialidade em ${especialidadeRequerida} disponível` 
                    : "Nenhum funcionário disponível"}
                </div>
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
