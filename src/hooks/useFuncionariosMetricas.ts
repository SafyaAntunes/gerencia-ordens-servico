
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Funcionario } from '@/types/funcionarios';
import { OrdemServico } from '@/types/ordens';
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';

export interface FuncionarioMetrica {
  funcionarioId: string;
  nome: string;
  foto?: string;
  especialidades: string[];
  ordensConcluidas: number;
  tempoMedio: string; // Formato: "X dias, Y horas, Z minutos"
  tempoMedioMinutos: number; // Tempo médio em minutos (para ordenação)
  totalMinutosTrabalhados: number;
}

interface UseFuncionariosMetricasProps {
  periodoInicio?: Date;
  periodoFim?: Date;
}

export const useFuncionariosMetricas = ({ periodoInicio, periodoFim }: UseFuncionariosMetricasProps = {}) => {
  const [metricas, setMetricas] = useState<FuncionarioMetrica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetricas = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 1. Buscar todos os funcionários
        const funcionariosRef = collection(db, 'funcionarios');
        const funcionariosSnapshot = await getDocs(funcionariosRef);
        const funcionarios = funcionariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Funcionario[];
        
        // 2. Buscar todas as ordens de serviço concluídas no período
        const ordensRef = collection(db, 'ordens_servico');
        let ordensQuery = query(
          ordensRef,
          where('status', 'in', ['finalizado', 'entregue'])
        );
        
        // Adicionar filtro de período se especificado
        if (periodoInicio && periodoFim) {
          ordensQuery = query(
            ordensRef,
            where('status', 'in', ['finalizado', 'entregue']),
            where('dataConclusao', '>=', Timestamp.fromDate(periodoInicio)),
            where('dataConclusao', '<=', Timestamp.fromDate(periodoFim))
          );
        }
        
        const ordensSnapshot = await getDocs(ordensQuery);
        const ordens = ordensSnapshot.docs.map(doc => {
          const data = doc.data();
          // Usando a técnica de type casting sugerida
          return {
            id: doc.id,
            ...data,
            dataConclusao: data.dataConclusao?.toDate(),
            dataAbertura: data.dataAbertura?.toDate(),
            tempoRegistros: data.tempoRegistros || []
          } as unknown as OrdemServico;
        });
        
        // 3. Calcular métricas para cada funcionário
        const metricasPorFuncionario = funcionarios.map(funcionario => {
          // Filtrar ordens que este funcionário trabalhou
          const ordensFuncionario = ordens.filter(ordem => {
            // Verificar se o funcionário aparece em algum registro de tempo
            return ordem.tempoRegistros.some(registro => 
              registro.funcionarioId === funcionario.id
            );
          });
          
          // Calcular tempo total trabalhado e o tempo médio
          let totalMinutosTrabalhados = 0;
          
          ordensFuncionario.forEach(ordem => {
            // Somar tempo em que este funcionário trabalhou nesta ordem
            ordem.tempoRegistros.forEach(registro => {
              if (registro.funcionarioId === funcionario.id && registro.inicio && registro.fim) {
                const inicio = registro.inicio instanceof Date ? registro.inicio : new Date(registro.inicio);
                const fim = registro.fim instanceof Date ? registro.fim : new Date(registro.fim);
                
                // Calcular diferença em minutos
                const minutosTrabalho = differenceInMinutes(fim, inicio);
                totalMinutosTrabalhados += minutosTrabalho;
              }
            });
          });
          
          // Calcular tempo médio por OS (se houver ordens concluídas)
          const tempoMedioMinutos = ordensFuncionario.length > 0 
            ? Math.round(totalMinutosTrabalhados / ordensFuncionario.length) 
            : 0;
          
          // Converter tempo médio em formato legível
          const dias = Math.floor(tempoMedioMinutos / (60 * 24));
          const horas = Math.floor((tempoMedioMinutos % (60 * 24)) / 60);
          const minutos = tempoMedioMinutos % 60;
          
          let tempoMedio = '';
          if (dias > 0) tempoMedio += `${dias} dia${dias > 1 ? 's' : ''}, `;
          if (horas > 0) tempoMedio += `${horas} hora${horas > 1 ? 's' : ''}, `;
          tempoMedio += `${minutos} minuto${minutos > 1 ? 's' : ''}`;
          
          return {
            funcionarioId: funcionario.id,
            nome: funcionario.nome,
            foto: funcionario.foto,
            especialidades: funcionario.especialidades || [],
            ordensConcluidas: ordensFuncionario.length,
            tempoMedio: tempoMedio,
            tempoMedioMinutos: tempoMedioMinutos,
            totalMinutosTrabalhados: totalMinutosTrabalhados
          } as FuncionarioMetrica;
        });
        
        setMetricas(metricasPorFuncionario);
      } catch (err) {
        console.error('Erro ao calcular métricas de funcionários:', err);
        setError('Falha ao carregar dados de produtividade');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetricas();
  }, [periodoInicio, periodoFim]);

  // Métricas filtradas e ordenadas
  const orderedByProductivity = [...metricas].sort((a, b) => 
    b.ordensConcluidas - a.ordensConcluidas
  );
  
  const orderedBySpeed = [...metricas].sort((a, b) => {
    // Ordenar por tempo médio (considerando apenas funcionários com ordens concluídas)
    if (a.ordensConcluidas === 0) return 1;
    if (b.ordensConcluidas === 0) return -1;
    return a.tempoMedioMinutos - b.tempoMedioMinutos;
  });

  return {
    metricas,
    orderedByProductivity,
    orderedBySpeed,
    loading,
    error
  };
};
