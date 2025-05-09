import { useState, useEffect, useCallback, useRef } from 'react';
import { useFuncionariosDisponibilidade } from '@/hooks/useFuncionariosDisponibilidade';
import { TipoServico } from '@/types/ordens';
import { toast } from "sonner";

interface UseAtribuirFuncionariosDialogProps {
  funcionariosSelecionadosIds?: string[];
  especialidadeRequerida?: TipoServico;
  apenasDisponiveis?: boolean;
  onConfirm?: (ids: string[], nomes: string[]) => void;
  isOpen?: boolean;
}

export function useAtribuirFuncionariosDialog({
  funcionariosSelecionadosIds = [],
  especialidadeRequerida,
  apenasDisponiveis = true,
  onConfirm,
  isOpen = false
}: UseAtribuirFuncionariosDialogProps) {
  const { funcionariosStatus, funcionariosDisponiveis, loading } = useFuncionariosDisponibilidade();
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<string[]>(funcionariosSelecionadosIds);
  const previousIdsRef = useRef<string[]>(funcionariosSelecionadosIds);

  // Sincronizar com os IDs passados como props apenas quando o diálogo abrir
  // ou quando os IDs mudarem significativamente
  useEffect(() => {
    if (!isOpen) return;

    const previousIds = previousIdsRef.current;
    const currentIds = funcionariosSelecionadosIds;

    // Verifica se os arrays são realmente diferentes em conteúdo
    const isDifferent = previousIds.length !== currentIds.length ||
      previousIds.some((id, index) => currentIds[index] !== id);

    if (isDifferent) {
      setFuncionariosSelecionados(currentIds);
      previousIdsRef.current = currentIds;
    }
  }, [isOpen, funcionariosSelecionadosIds]);

  // Filtrar funcionários com base nas condições
  const funcionariosFiltradosAtual = funcionariosStatus.filter(funcionario => {
    if (especialidadeRequerida && !funcionario.especialidades?.includes(especialidadeRequerida)) {
      return false;
    }
    if (apenasDisponiveis && funcionario.status !== 'disponivel') {
      return false;
    }
    return true;
  });

  const handleToggleFuncionario = useCallback((id: string) => {
    setFuncionariosSelecionados(prev => {
      const isSelected = prev.includes(id);
      const newSelection = isSelected 
        ? prev.filter(fid => fid !== id)
        : [...prev, id];
      console.log('Toggle funcionário:', { id, wasSelected: isSelected, newSelection });
      return newSelection;
    });
  }, []);

  const isFuncionarioSelected = useCallback((id: string) => {
    const isSelected = funcionariosSelecionados.includes(id);
    console.log('Checking funcionário selection:', { id, isSelected });
    return isSelected;
  }, [funcionariosSelecionados]);

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

    console.log('Confirmando seleção:', { ids: funcionariosSelecionados, nomes: funcionariosSelecionadosNomes });
    onConfirmFn(funcionariosSelecionados, funcionariosSelecionadosNomes);
    return true;
  }, [funcionariosSelecionados, funcionariosStatus, onConfirm]);

  return {
    funcionariosFiltradosAtual,
    loading,
    funcionariosSelecionados,
    handleToggleFuncionario,
    isFuncionarioSelected,
    handleConfirm
  };
}
