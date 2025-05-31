import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFuncionarios } from '@/services/funcionarioService';
import { getOrdens } from '@/services/ordemService';
import { StatusOS, OrdemServico, EtapaOS, TempoRegistro } from '@/types/ordens';
import { Funcionario } from '@/types/funcionarios';
import { format, isSameDay, parseISO } from 'date-fns';
import { toast } from 'sonner';

// Define um tipo para representar o status de atividade de um funcionário
export type FuncionarioStatus = Funcionario & {
  status: 'disponivel' | 'ocupado' | 'inativo';
  atividadeAtual?: {
    ordemId: string;
    ordemNome: string;
    etapa: string;
    servicoTipo?: string;
    inicio: Date;
  };
  tempoDisponivel?: number;
  statusOrigem: 'statusAtividade' | 'tempoRegistros' | 'inativo';
};

export const useFuncionariosDisponibilidade = () => {
  const [funcionariosStatus, setFuncionariosStatus] = useState<FuncionarioStatus[]>([]);
  const [isLoadingFuncionariosStatus, setIsLoadingFuncionariosStatus] = useState(false);
  const [errorFuncionariosStatus, setErrorFuncionariosStatus] = useState<Error | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch all funcionarios with shorter refetch interval
  const {
    data: funcionarios,
    isLoading: isLoadingFuncionarios,
    error: errorFuncionarios,
    refetch: refetchFuncionarios,
  } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: getFuncionarios,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Fetch all ordens with shorter refetch interval
  const {
    data: ordens,
    isLoading: isLoadingOrdens,
    error: errorOrdens,
    refetch: refetchOrdens,
  } = useQuery({
    queryKey: ['ordens'],
    queryFn: getOrdens,
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  useEffect(() => {
    const updateFuncionariosStatus = async () => {
      if (!funcionarios || !ordens) return;

      setIsLoadingFuncionariosStatus(true);
      setErrorFuncionariosStatus(null);

      try {
        const funcionariosComStatus = funcionarios.map(funcionario => {
          // PRIMEIRO: Verificar se o funcionário está inativo
          if (funcionario.ativo === false) {
            return {
              ...funcionario,
              status: 'inativo' as const,
              atividadeAtual: undefined,
              tempoDisponivel: 0,
              statusOrigem: 'inativo' as const,
            };
          }

          // SEGUNDO: Priorizar o campo statusAtividade do funcionário
          if (funcionario.statusAtividade === 'ocupado' && funcionario.atividadeAtual) {
            console.log(`📋 Funcionário ${funcionario.nome} marcado como ocupado pelo statusAtividade`);
            
            // Verificar se a ordem ainda existe
            const ordensArray = (ordens as OrdemServico[] || []);
            const ordemRelacionada = ordensArray.find(ordem => ordem.id === funcionario.atividadeAtual?.ordemId);
            
            if (ordemRelacionada) {
              return {
                ...funcionario,
                status: 'ocupado' as const,
                atividadeAtual: {
                  ordemId: funcionario.atividadeAtual.ordemId,
                  ordemNome: ordemRelacionada.nome || funcionario.atividadeAtual.ordemNome || 'Ordem Desconhecida',
                  etapa: funcionario.atividadeAtual.etapa,
                  servicoTipo: funcionario.atividadeAtual.servicoTipo,
                  inicio: funcionario.atividadeAtual.inicio ? new Date(funcionario.atividadeAtual.inicio) : new Date(),
                },
                tempoDisponivel: 0,
                statusOrigem: 'statusAtividade' as const,
              };
            } else {
              console.warn(`⚠️ Funcionário ${funcionario.nome} marcado como ocupado mas ordem ${funcionario.atividadeAtual.ordemId} não existe`);
              // A ordem não existe mais, mas ainda está marcado como ocupado - manter o status mas indicar problema
              return {
                ...funcionario,
                status: 'ocupado' as const,
                atividadeAtual: {
                  ordemId: funcionario.atividadeAtual.ordemId,
                  ordemNome: funcionario.atividadeAtual.ordemNome || 'Ordem Não Encontrada',
                  etapa: funcionario.atividadeAtual.etapa,
                  servicoTipo: funcionario.atividadeAtual.servicoTipo,
                  inicio: funcionario.atividadeAtual.inicio ? new Date(funcionario.atividadeAtual.inicio) : new Date(),
                },
                tempoDisponivel: 0,
                statusOrigem: 'statusAtividade' as const,
              };
            }
          }

          // TERCEIRO: Fallback para análise dos registros de tempo (lógica original)
          const ordensArray = (ordens as OrdemServico[] || []);
          const registrosDeTempoDoDia = ordensArray.flatMap(ordem =>
            ordem.tempoRegistros ? ordem.tempoRegistros.filter(
              registro =>
                registro.funcionarioId === funcionario.id &&
                isSameDay(new Date(registro.inicio), selectedDate)
            ) : []
          );

          // Ordenar os registros por data de início para encontrar o mais recente
          registrosDeTempoDoDia.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

          // Verificar se o funcionário tem um registro de tempo "aberto" (sem data de fim)
          const registroAberto = registrosDeTempoDoDia.find(registro => !registro.fim);

          if (registroAberto) {
            console.log(`⏱️ Funcionário ${funcionario.nome} ocupado pelos registros de tempo`);
            
            const ordemRelacionada = ordensArray.find(ordem =>
              ordem.tempoRegistros && ordem.tempoRegistros.some(tempo => 
                tempo.funcionarioId === registroAberto.funcionarioId && 
                tempo.inicio === registroAberto.inicio
              )
            );
            
            return {
              ...funcionario,
              status: 'ocupado' as const,
              atividadeAtual: {
                ordemId: registroAberto.ordemId || '',
                ordemNome: ordemRelacionada?.nome || 'Ordem Desconhecida',
                etapa: registroAberto.etapa,
                servicoTipo: registroAberto.servicoTipo,
                inicio: new Date(registroAberto.inicio),
              },
              tempoDisponivel: 0,
              statusOrigem: 'tempoRegistros' as const,
            };
          }

          // Verificar pausas não finalizadas
          const pausaMaisRecente = registrosDeTempoDoDia.find(registro =>
            registro.pausas && registro.pausas.length > 0 && !registro.pausas[registro.pausas.length - 1].fim
          );

          if (pausaMaisRecente) {
            console.log(`⏸️ Funcionário ${funcionario.nome} em pausa pelos registros de tempo`);
            
            const ordemRelacionada = ordensArray.find(ordem =>
              ordem.tempoRegistros && ordem.tempoRegistros.some(tempo => 
                tempo.funcionarioId === pausaMaisRecente.funcionarioId && 
                tempo.inicio === pausaMaisRecente.inicio
              )
            );
            
            return {
              ...funcionario,
              status: 'ocupado' as const,
              atividadeAtual: {
                ordemId: pausaMaisRecente.ordemId || '',
                ordemNome: ordemRelacionada?.nome || 'Ordem Desconhecida',
                etapa: pausaMaisRecente.etapa,
                servicoTipo: pausaMaisRecente.servicoTipo,
                inicio: new Date(pausaMaisRecente.inicio),
              },
              tempoDisponivel: 0,
              statusOrigem: 'tempoRegistros' as const,
            };
          }

          // QUARTO: Se não há evidência de atividade, marcar como disponível
          console.log(`✅ Funcionário ${funcionario.nome} disponível`);
          
          return {
            ...funcionario,
            status: 'disponivel' as const,
            atividadeAtual: undefined,
            tempoDisponivel: 8 * 60 * 60 * 1000, // 8 horas em milissegundos
            statusOrigem: 'tempoRegistros' as const,
          };
        });

        setFuncionariosStatus(funcionariosComStatus);
      } catch (error: any) {
        console.error('Erro ao atualizar o status dos funcionários:', error);
        setErrorFuncionariosStatus(error);
        toast.error('Erro ao atualizar o status dos funcionários');
      } finally {
        setIsLoadingFuncionariosStatus(false);
      }
    };

    updateFuncionariosStatus();
  }, [funcionarios, ordens, selectedDate]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Calculate convenient variables for consuming components
  const funcionariosDisponiveis = funcionariosStatus.filter(f => f.status === 'disponivel' && f.ativo !== false);
  const funcionariosOcupados = funcionariosStatus.filter(f => f.status === 'ocupado' && f.ativo !== false);
  const funcionariosInativos = funcionariosStatus.filter(f => f.ativo === false || f.status === 'inativo');

  const loading = isLoadingFuncionarios || isLoadingOrdens || isLoadingFuncionariosStatus;

  return {
    funcionariosStatus,
    funcionariosDisponiveis,
    funcionariosOcupados,
    funcionariosInativos,
    isLoading: loading,
    loading, // Added for backwards compatibility
    error: errorFuncionarios || errorOrdens || errorFuncionariosStatus,
    refetch: () => {
      refetchFuncionarios();
      refetchOrdens();
    },
    selectedDate,
    handleDateChange,
  };
};

export default useFuncionariosDisponibilidade;
