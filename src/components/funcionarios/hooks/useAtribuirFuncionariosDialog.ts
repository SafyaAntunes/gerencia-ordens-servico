import { useState, useCallback, useEffect } from 'react';
import { useFuncionariosDisponibilidade } from '@/hooks/useFuncionariosDisponibilidade';
import { TipoServico } from '@/types/ordens';
import { toast } from "sonner";

interface UseAtribuirFuncionariosDialogProps {
  funcionariosSelecionadosIds?: string[];
  especialidadeRequerida?: TipoServico;
  apenasDisponiveis?: boolean;
}

export function useAtribuirFuncionariosDialog({
  funcionariosSelecionadosIds = [],
  especialidadeRequerida,
  apenasDisponiveis = true
}: UseAtribuirFuncionariosDialogProps) {
  const { funcionariosStatus, funcionariosDisponiveis, loading } = useFuncionariosDisponibilidade();
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<string[]>(funcionariosSelecionadosIds);

  // Debug logs para acompanhar mudanças de estado
  console.log("Dialog hook - funcionariosSelecionados:", funcionariosSelecionados);
  console.log("Dialog hook - props.funcionariosSelecionadosIds:", funcionariosSelecionadosIds);

  // Atualizar selecionados quando as props mudarem
  useEffect(() => {
    console.log("Dialog hook - syncing selected IDs:", funcionariosSelecionadosIds);
    setFuncionariosSelecionados(funcionariosSelecionadosIds);
  }, [funcionariosSelecionadosIds]);

  // Filtrar funcionários com base nas condições
  const funcionariosFiltradosAtual = funcionariosStatus.filter(funcionario => {
    // Filtrar por especialidade se necessário
    if (especialidadeRequerida) {
      if (!funcionario.especialidades?.includes(especialidadeRequerida)) {
        return false;
      }
    }

    // Filtrar por disponibilidade se necessário
    if (apenasDisponiveis && funcionario.status !== 'disponivel') {
      return false;
    }

    return true;
  });

  // Toggle de seleção de funcionário
  const handleToggleFuncionario = useCallback((id: string) => {
    console.log("Toggle funcionário:", id);
    setFuncionariosSelecionados(prev => {
      if (prev.includes(id)) {
        const newSelection = prev.filter(fid => fid !== id);
        console.log("Nova seleção após remover:", newSelection);
        return newSelection;
      } else {
        const newSelection = [...prev, id];
        console.log("Nova seleção após adicionar:", newSelection);
        return newSelection;
      }
    });
  }, []);

  // Verificar se um funcionário está selecionado
  const isFuncionarioSelected = useCallback((id: string) => {
    return funcionariosSelecionados.includes(id);
  }, [funcionariosSelecionados]);

  // Confirmar seleção
  const handleConfirm = useCallback((onConfirm: (ids: string[], nomes: string[]) => void) => {
    if (funcionariosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um funcionário para continuar");
      return false;
    }

    const funcionariosSelecionadosNomes = funcionariosSelecionados.map(id => {
      const funcionario = funcionariosStatus.find(f => f.id === id);
      return funcionario?.nome || id;
    });

    console.log("Confirmando seleção:", funcionariosSelecionados, funcionariosSelecionadosNomes);
    
    onConfirm(funcionariosSelecionados, funcionariosSelecionadosNomes);
    return true;
  }, [funcionariosSelecionados, funcionariosStatus]);

  return {
    funcionariosFiltradosAtual,
    loading,
    funcionariosSelecionados,
    handleToggleFuncionario,
    isFuncionarioSelected,
    handleConfirm
  };
}
