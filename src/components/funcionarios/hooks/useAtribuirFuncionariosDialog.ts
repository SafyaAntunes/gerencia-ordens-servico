
import { useState, useEffect, useCallback } from 'react';
import { useFuncionariosDisponibilidade } from '@/hooks/useFuncionariosDisponibilidade';
import { TipoServico } from '@/types/ordens';
import { toast } from "sonner";

interface UseAtribuirFuncionariosDialogProps {
  funcionariosSelecionadosIds: string[];
  especialidadeRequerida?: TipoServico;
  apenasDisponiveis?: boolean;
}

export function useAtribuirFuncionariosDialog({
  funcionariosSelecionadosIds,
  especialidadeRequerida,
  apenasDisponiveis = true
}: UseAtribuirFuncionariosDialogProps) {
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<string[]>([]);
  const { funcionariosStatus, funcionariosDisponiveis, loading } = useFuncionariosDisponibilidade();

  // Debug logs para acompanhar mudanças de estado
  console.log("Dialog hook - funcionariosSelecionados:", funcionariosSelecionados);
  console.log("Dialog hook - props.funcionariosSelecionadosIds:", funcionariosSelecionadosIds);

  // Sincronizar com o estado do pai quando os IDs mudam
  useEffect(() => {
    console.log("Dialog hook - syncing selected IDs:", funcionariosSelecionadosIds);
    // Importante: Crie uma nova referência do array para garantir que o React detecte a mudança
    setFuncionariosSelecionados([...funcionariosSelecionadosIds]);
  }, [funcionariosSelecionadosIds]);

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

  // Otimizar o toggle de funcionário com useCallback
  const handleToggleFuncionario = useCallback((id: string) => {
    console.log("Toggle funcionário:", id);
    setFuncionariosSelecionados(prev => {
      // Verificar se o ID já está selecionado
      const isSelected = prev.includes(id);
      console.log(`Funcionário ${id} está ${isSelected ? 'selecionado' : 'não selecionado'}`);
      
      // Criar uma nova referência do array para garantir que o React detecte a mudança
      if (isSelected) {
        const newSelection = prev.filter(funcionarioId => funcionarioId !== id);
        console.log("Nova seleção após remover:", newSelection);
        return newSelection;
      } else {
        const newSelection = [...prev, id];
        console.log("Nova seleção após adicionar:", newSelection);
        return newSelection;
      }
    });
  }, []);

  // Verificar se um funcionário está selecionado - melhorado para ser mais eficiente
  const isFuncionarioSelected = useCallback((id: string) => {
    return funcionariosSelecionados.includes(id);
  }, [funcionariosSelecionados]);

  // Otimize o handleConfirm para ser mais eficiente
  const handleConfirm = useCallback((onConfirm: (ids: string[], nomes: string[]) => void) => {
    if (funcionariosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um funcionário para continuar");
      return false;
    }
    
    // Obter nomes dos funcionários selecionados
    const funcionariosNomes = funcionariosSelecionados.map(id => {
      const funcionario = funcionariosStatus.find(f => f.id === id);
      return funcionario?.nome || '';
    }).filter(nome => nome !== '');
    
    console.log("Confirmando seleção:", funcionariosSelecionados, funcionariosNomes);
    
    // Chamar onConfirm apenas uma vez ao clicar no botão
    onConfirm(funcionariosSelecionados, funcionariosNomes);
    return true;
  }, [funcionariosSelecionados, funcionariosStatus]);

  return {
    funcionariosSelecionados,
    setFuncionariosSelecionados,
    funcionariosFiltradosAtual: funcionariosFiltrados(),
    isFuncionarioSelected,
    handleToggleFuncionario,
    handleConfirm,
    loading
  };
}
