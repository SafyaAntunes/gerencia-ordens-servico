
import { useState, useCallback, useEffect } from 'react';
import { useFuncionariosDisponibilidade } from '@/hooks/useFuncionariosDisponibilidade';
import { TipoServico } from '@/types/ordens';
import { toast } from "sonner";

interface UseAtribuirFuncionariosDialogProps {
  funcionariosSelecionadosIds?: string[];
  especialidadeRequerida?: TipoServico;
  apenasDisponiveis?: boolean;
  onConfirm?: (ids: string[], nomes: string[]) => void;
}

export function useAtribuirFuncionariosDialog({
  funcionariosSelecionadosIds = [],
  especialidadeRequerida,
  apenasDisponiveis = true,
  onConfirm
}: UseAtribuirFuncionariosDialogProps) {
  const { funcionariosStatus, funcionariosDisponiveis, loading } = useFuncionariosDisponibilidade();
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastToggleId, setLastToggleId] = useState<string | null>(null);

  // Inicialização do estado com os IDs passados como props
  useEffect(() => {
    if (!isInitialized || JSON.stringify(funcionariosSelecionadosIds) !== JSON.stringify(funcionariosSelecionados)) {
      console.log("Dialog hook - Inicializando selecionados:", funcionariosSelecionadosIds);
      setFuncionariosSelecionados(funcionariosSelecionadosIds || []);
      setIsInitialized(true);
    }
  }, [funcionariosSelecionadosIds, isInitialized, funcionariosSelecionados]);

  // Debug logs para acompanhar mudanças de estado
  console.log("Dialog hook - funcionariosSelecionados atual:", funcionariosSelecionados);
  console.log("Dialog hook - props.funcionariosSelecionadosIds:", funcionariosSelecionadosIds);

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

  // Toggle de seleção de funcionário - otimizado para forçar atualização visual
  const handleToggleFuncionario = useCallback((id: string) => {
    console.log("Toggle funcionário:", id);
    setLastToggleId(id); // Armazena o ID do último funcionário a ser toggled
    
    setFuncionariosSelecionados(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) {
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
    const isSelected = funcionariosSelecionados.includes(id);
    console.log(`Verificando seleção do funcionário ${id}: ${isSelected}`);
    return isSelected;
  }, [funcionariosSelecionados]);

  // Confirmar seleção
  const handleConfirm = useCallback((dialogOnConfirm?: (ids: string[], nomes: string[]) => void) => {
    const onConfirmFn = dialogOnConfirm || onConfirm;

    if (!onConfirmFn) {
      console.error("Função onConfirm não fornecida");
      return false;
    }

    if (funcionariosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um funcionário para continuar");
      return false;
    }

    const funcionariosSelecionadosNomes = funcionariosSelecionados.map(id => {
      const funcionario = funcionariosStatus.find(f => f.id === id);
      return funcionario?.nome || id;
    });

    console.log("Confirmando seleção:", funcionariosSelecionados, funcionariosSelecionadosNomes);
    
    onConfirmFn(funcionariosSelecionados, funcionariosSelecionadosNomes);
    return true;
  }, [funcionariosSelecionados, funcionariosStatus, onConfirm]);

  return {
    funcionariosFiltradosAtual,
    loading,
    funcionariosSelecionados,
    lastToggleId,
    handleToggleFuncionario,
    isFuncionarioSelected,
    handleConfirm
  };
}
