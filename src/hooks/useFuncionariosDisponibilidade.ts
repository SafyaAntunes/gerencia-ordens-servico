
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFuncionarios } from '@/services/funcionarioService';
import { getOrdens } from '@/services/ordemService';
import { StatusOS, OrdemServico, EtapaOS } from '@/types/ordens';
import { Funcionario } from '@/types/funcionarios';
import { format, isSameDay, parseISO } from 'date-fns';
import { toast } from 'sonner';

// Define um tipo para representar o status de atividade de um funcionário
export type FuncionarioStatus = Funcionario & {
  statusAtividade: 'disponivel' | 'em_servico' | 'em_pausa' | 'indisponivel';
  ordemAtual?: {
    id: string;
    nome: string;
    etapa: EtapaOS;
    tempoTotal: number;
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
            statusAtividade: 'disponivel', // Inicialmente, todos estão disponíveis
            ordemAtual: undefined,
            tempoDisponivel: 0,
          };
          return funcionarioComStatus;
        });

        // Encontrar a atividade atual de cada funcionário
        const funcionariosAtualizados = funcionariosComStatus.map(funcionario => {
          // Filtrar registros de tempo para o funcionário e para o dia selecionado
          const registrosDeTempoDoDia = (ordens as OrdemServico[]).flatMap(ordem =>
            ordem.tempoRegistros.filter(
              registro =>
                registro.funcionarioId === funcionario.id &&
                isSameDay(new Date(registro.inicio), selectedDate)
            )
          );

          // Ordenar os registros por data de início para encontrar o mais recente
          registrosDeTempoDoDia.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

          // Verificar se o funcionário tem um registro de tempo "aberto" (sem data de fim)
          const registroAberto = registrosDeTempoDoDia.find(registro => !registro.fim);

          if (registroAberto) {
            // Se houver um registro aberto, o funcionário está "em serviço"
            funcionario.statusAtividade = 'em_servico';
            funcionario.ordemAtual = {
              id: registroAberto.etapa,
              nome: (ordens as OrdemServico[]).find(ordem =>
                ordem.tempoRegistros.some(tempo => tempo === registroAberto)
              )?.nome || 'Ordem Desconhecida',
              etapa: registroAberto.etapa,
              tempoTotal: 0, // Será atualizado abaixo
              inicio: new Date(registroAberto.inicio),
            };

            // Calcular o tempo total gasto na etapa atual
            const tempoTotalNaEtapa = registrosDeTempoDoDia.reduce((total, registro) => {
              const inicio = new Date(registro.inicio).getTime();
              const fim = registro.fim ? new Date(registro.fim).getTime() : new Date().getTime(); // Use a data atual se não houver data de fim
              return total + (fim - inicio);
            }, 0);

            if (funcionario.ordemAtual) {
              funcionario.ordemAtual.tempoTotal = tempoTotalNaEtapa;
            }
          } else {
            // Se não houver registro aberto, verificar se há pausas
            const pausaMaisRecente = registrosDeTempoDoDia.find(registro =>
              registro.pausas && registro.pausas.length > 0 && !registro.pausas[registro.pausas.length - 1].fim
            );

            if (pausaMaisRecente) {
              // Se houver uma pausa não finalizada, o funcionário está "em pausa"
              funcionario.statusAtividade = 'em_pausa';
              funcionario.ordemAtual = {
                id: pausaMaisRecente.etapa,
                nome: (ordens as OrdemServico[]).find(ordem =>
                  ordem.tempoRegistros.some(tempo => tempo === pausaMaisRecente)
                )?.nome || 'Ordem Desconhecida',
                etapa: pausaMaisRecente.etapa,
                tempoTotal: 0, // Será atualizado abaixo
                inicio: new Date(pausaMaisRecente.inicio),
              };

              // Calcular o tempo total gasto na etapa atual (antes da pausa)
              const tempoTotalNaEtapa = registrosDeTempoDoDia.reduce((total, registro) => {
                const inicio = new Date(registro.inicio).getTime();
                const fim = registro.fim ? new Date(registro.fim).getTime() : new Date().getTime(); // Use a data atual se não houver data de fim
                return total + (fim - inicio);
              }, 0);

              if (funcionario.ordemAtual) {
                funcionario.ordemAtual.tempoTotal = tempoTotalNaEtapa;
              }
            } else {
              // Se não houver registro aberto nem pausa, o funcionário está "disponível"
              funcionario.statusAtividade = 'disponivel';

              // Calcular o tempo disponível do funcionário
              const tempoTotalTrabalhado = registrosDeTempoDoDia.reduce((total, registro) => {
                const inicio = new Date(registro.inicio).getTime();
                const fim = registro.fim ? new Date(registro.fim).getTime() : new Date().getTime(); // Use a data atual se não houver data de fim
                return total + (fim - inicio);
              }, 0);

              funcionario.tempoDisponivel = 8 * 60 * 60 * 1000 - tempoTotalTrabalhado; // 8 horas em milissegundos
            }
          }

          return funcionario;
        });

        setFuncionariosStatus(funcionariosAtualizados as FuncionarioStatus[]);
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
  const funcionariosDisponiveis = funcionariosStatus.filter(f => f.statusAtividade === 'disponivel' && f.ativo !== false);
  const funcionariosOcupados = funcionariosStatus.filter(f => f.statusAtividade !== 'disponivel' && f.ativo !== false);
  const funcionariosInativos = funcionariosStatus.filter(f => f.ativo === false);

  return {
    funcionariosStatus,
    funcionariosDisponiveis,
    funcionariosOcupados,
    funcionariosInativos,
    isLoading: isLoadingFuncionarios || isLoadingOrdens || isLoadingFuncionariosStatus,
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
