
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
};

export const useFuncionariosDisponibilidade = () => {
  const [funcionariosStatus, setFuncionariosStatus] = useState<FuncionarioStatus[]>([]);
  const [isLoadingFuncionariosStatus, setIsLoadingFuncionariosStatus] = useState(false);
  const [errorFuncionariosStatus, setErrorFuncionariosStatus] = useState<Error | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch all funcionarios
  const {
    data: funcionarios,
    isLoading: isLoadingFuncionarios,
    error: errorFuncionarios,
    refetch: refetchFuncionarios,
  } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: getFuncionarios,
  });

  // Fetch all ordens
  const {
    data: ordens,
    isLoading: isLoadingOrdens,
    error: errorOrdens,
    refetch: refetchOrdens,
  } = useQuery({
    queryKey: ['ordens'],
    queryFn: getOrdens,
  });

  useEffect(() => {
    const updateFuncionariosStatus = async () => {
      if (!funcionarios || !ordens) return;

      setIsLoadingFuncionariosStatus(true);
      setErrorFuncionariosStatus(null);

      try {
        // Mapear os funcionários para incluir o status de atividade
        const funcionariosComStatus = funcionarios.map(funcionario => {
          const funcionarioComStatus: FuncionarioStatus = {
            ...funcionario,
            status: 'disponivel', // Inicialmente, todos estão disponíveis
            atividadeAtual: undefined,
            tempoDisponivel: 0,
          };
          return funcionarioComStatus;
        });

        // Encontrar a atividade atual de cada funcionário
        const funcionariosAtualizados = funcionariosComStatus.map(funcionario => {
          // Filtrar registros de tempo para o funcionário e para o dia selecionado
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
            // Se houver um registro aberto, o funcionário está "ocupado"
            funcionario.status = 'ocupado';
            // Find the corresponding ordem
            const ordemRelacionada = ordensArray.find(ordem =>
              ordem.tempoRegistros && ordem.tempoRegistros.some(tempo => 
                tempo.funcionarioId === registroAberto.funcionarioId && 
                tempo.inicio === registroAberto.inicio
              )
            );
            
            funcionario.atividadeAtual = {
              ordemId: registroAberto.ordemId || '',
              ordemNome: ordemRelacionada?.nome || 'Ordem Desconhecida',
              etapa: registroAberto.etapa,
              servicoTipo: registroAberto.servicoTipo,
              inicio: new Date(registroAberto.inicio),
            };

            // Calcular o tempo total gasto na etapa atual
            const tempoTotalNaEtapa = registrosDeTempoDoDia.reduce((total, registro) => {
              const inicio = new Date(registro.inicio).getTime();
              const fim = registro.fim ? new Date(registro.fim).getTime() : new Date().getTime(); // Use a data atual se não houver data de fim
              return total + (fim - inicio);
            }, 0);

            funcionario.tempoDisponivel = tempoTotalNaEtapa;
          } else {
            // Se não houver registro aberto, verificar se há pausas
            const pausaMaisRecente = registrosDeTempoDoDia.find(registro =>
              registro.pausas && registro.pausas.length > 0 && !registro.pausas[registro.pausas.length - 1].fim
            );

            if (pausaMaisRecente) {
              // Se houver uma pausa não finalizada, o funcionário ainda está "ocupado"
              funcionario.status = 'ocupado';
              // Find the corresponding ordem
              const ordemRelacionada = ordensArray.find(ordem =>
                ordem.tempoRegistros && ordem.tempoRegistros.some(tempo => 
                  tempo.funcionarioId === pausaMaisRecente.funcionarioId && 
                  tempo.inicio === pausaMaisRecente.inicio
                )
              );
              
              funcionario.atividadeAtual = {
                ordemId: pausaMaisRecente.ordemId || '',
                ordemNome: ordemRelacionada?.nome || 'Ordem Desconhecida',
                etapa: pausaMaisRecente.etapa,
                servicoTipo: pausaMaisRecente.servicoTipo,
                inicio: new Date(pausaMaisRecente.inicio),
              };

              // Calcular o tempo total gasto na etapa atual (antes da pausa)
              const tempoTotalNaEtapa = registrosDeTempoDoDia.reduce((total, registro) => {
                const inicio = new Date(registro.inicio).getTime();
                const fim = registro.fim ? new Date(registro.fim).getTime() : new Date().getTime(); // Use a data atual se não houver data de fim
                return total + (fim - inicio);
              }, 0);

              funcionario.tempoDisponivel = tempoTotalNaEtapa;
            } else {
              // Se não houver registro aberto nem pausa, o funcionário está "disponível"
              funcionario.status = 'disponivel';

              // Calcular o tempo disponível do funcionário
              const tempoTotalTrabalhado = registrosDeTempoDoDia.reduce((total, registro) => {
                const inicio = new Date(registro.inicio).getTime();
                const fim = registro.fim ? new Date(registro.fim).getTime() : new Date().getTime(); // Use a data atual se não houver data de fim
                return total + (fim - inicio);
              }, 0);

              funcionario.tempoDisponivel = 8 * 60 * 60 * 1000 - tempoTotalTrabalhado; // 8 horas em milissegundos
            }
          }

          // Marcar funcionários inativos
          if (funcionario.ativo === false) {
            funcionario.status = 'inativo';
          }

          return funcionario;
        });

        setFuncionariosStatus(funcionariosAtualizados);
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

  // Calculate conveniente variables for consuming components
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
