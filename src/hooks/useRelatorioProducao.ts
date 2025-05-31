
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Funcionario } from '@/types/funcionarios';
import { OrdemServico } from '@/types/ordens';
import { format, differenceInDays, startOfDay, endOfDay } from 'date-fns';

export interface DadosRelatorio {
  totalOrdens: number;
  ordensFinalizadas: number;
  ordensEmAndamento: number;
  ordensOrcamento: number;
  
  // Por status
  ordensPorStatus: Record<string, number>;
  
  // Por serviços
  servicosMaisComuns: Array<{
    tipo: string;
    quantidade: number;
    percentual: number;
  }>;
  
  // Por funcionários
  funcionariosProdutividade: Array<{
    id: string;
    nome: string;
    ordensFinalizadas: number;
    tempoMedio: number;
    especialidades: string[];
  }>;
  
  // Por clientes
  clientesAtivos: Array<{
    nome: string;
    totalOrdens: number;
    ordensFinalizadas: number;
    valorTotal?: number;
  }>;
  
  // Métricas de tempo
  tempoMedioExecucao: number;
  ordensNoPrazo: number;
  ordensAtrasadas: number;
}

interface UseRelatorioProducaoProps {
  dataInicio?: Date;
  dataFim?: Date;
}

export const useRelatorioProducao = ({ dataInicio, dataFim }: UseRelatorioProducaoProps = {}) => {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar funcionários
        const funcionariosRef = collection(db, 'funcionarios');
        const funcionariosSnapshot = await getDocs(funcionariosRef);
        const funcionarios = funcionariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Funcionario[];
        
        // Buscar ordens
        const ordensRef = collection(db, 'ordens_servico');
        let ordensQuery = query(ordensRef);
        
        // Aplicar filtro de data se especificado
        if (dataInicio && dataFim) {
          ordensQuery = query(
            ordensRef,
            where('dataAbertura', '>=', Timestamp.fromDate(startOfDay(dataInicio))),
            where('dataAbertura', '<=', Timestamp.fromDate(endOfDay(dataFim)))
          );
        }
        
        const ordensSnapshot = await getDocs(ordensQuery);
        const ordens = ordensSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dataAbertura: data.dataAbertura?.toDate(),
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate(),
            dataConclusao: data.dataConclusao?.toDate(),
            tempoRegistros: data.tempoRegistros || [],
            servicos: data.servicos || []
          } as OrdemServico;
        });
        
        // Calcular métricas
        const totalOrdens = ordens.length;
        const ordensFinalizadas = ordens.filter(o => o.status === 'finalizado' || o.status === 'entregue').length;
        const ordensEmAndamento = ordens.filter(o => 
          o.status === 'executando_servico' || o.status === 'aguardando_aprovacao'
        ).length;
        const ordensOrcamento = ordens.filter(o => o.status === 'orcamento').length;
        
        // Ordens por status
        const ordensPorStatus: Record<string, number> = {};
        ordens.forEach(ordem => {
          ordensPorStatus[ordem.status] = (ordensPorStatus[ordem.status] || 0) + 1;
        });
        
        // Serviços mais comuns
        const servicosCount: Record<string, number> = {};
        ordens.forEach(ordem => {
          ordem.servicos?.forEach(servico => {
            servicosCount[servico.tipo] = (servicosCount[servico.tipo] || 0) + 1;
          });
        });
        
        const servicosMaisComuns = Object.entries(servicosCount)
          .map(([tipo, quantidade]) => ({
            tipo,
            quantidade,
            percentual: Math.round((quantidade / totalOrdens) * 100)
          }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 10);
        
        // Produtividade por funcionários
        const funcionariosProdutividade = funcionarios.map(funcionario => {
          const ordensDoFuncionario = ordens.filter(ordem => 
            ordem.tempoRegistros.some(registro => registro.funcionarioId === funcionario.id)
          );
          
          const ordensFinalizadasFuncionario = ordensDoFuncionario.filter(o => 
            o.status === 'finalizado' || o.status === 'entregue'
          ).length;
          
          // Calcular tempo médio
          let totalMinutos = 0;
          ordensDoFuncionario.forEach(ordem => {
            ordem.tempoRegistros.forEach(registro => {
              if (registro.funcionarioId === funcionario.id && registro.inicio && registro.fim) {
                const inicio = new Date(registro.inicio);
                const fim = new Date(registro.fim);
                totalMinutos += (fim.getTime() - inicio.getTime()) / (1000 * 60);
              }
            });
          });
          
          const tempoMedio = ordensFinalizadasFuncionario > 0 ? 
            Math.round(totalMinutos / ordensFinalizadasFuncionario) : 0;
          
          return {
            id: funcionario.id,
            nome: funcionario.nome,
            ordensFinalizadas: ordensFinalizadasFuncionario,
            tempoMedio,
            especialidades: funcionario.especialidades || []
          };
        }).sort((a, b) => b.ordensFinalizadas - a.ordensFinalizadas);
        
        // Clientes mais ativos
        const clientesCount: Record<string, { nome: string; total: number; finalizadas: number }> = {};
        ordens.forEach(ordem => {
          if (ordem.cliente?.nome) {
            if (!clientesCount[ordem.cliente.nome]) {
              clientesCount[ordem.cliente.nome] = { nome: ordem.cliente.nome, total: 0, finalizadas: 0 };
            }
            clientesCount[ordem.cliente.nome].total++;
            if (ordem.status === 'finalizado' || ordem.status === 'entregue') {
              clientesCount[ordem.cliente.nome].finalizadas++;
            }
          }
        });
        
        const clientesAtivos = Object.values(clientesCount)
          .map(cliente => ({
            nome: cliente.nome,
            totalOrdens: cliente.total,
            ordensFinalizadas: cliente.finalizadas
          }))
          .sort((a, b) => b.totalOrdens - a.totalOrdens)
          .slice(0, 10);
        
        // Métricas de tempo
        const ordensComTempo = ordens.filter(o => o.dataAbertura && o.dataConclusao);
        const tempoMedioExecucao = ordensComTempo.length > 0 ? 
          Math.round(ordensComTempo.reduce((acc, ordem) => {
            const dias = differenceInDays(ordem.dataConclusao!, ordem.dataAbertura);
            return acc + dias;
          }, 0) / ordensComTempo.length) : 0;
        
        const ordensNoPrazo = ordens.filter(o => 
          o.dataConclusao && o.dataPrevistaEntrega && 
          o.dataConclusao <= o.dataPrevistaEntrega
        ).length;
        
        const ordensAtrasadas = ordens.filter(o => 
          o.dataConclusao && o.dataPrevistaEntrega && 
          o.dataConclusao > o.dataPrevistaEntrega
        ).length;
        
        setDados({
          totalOrdens,
          ordensFinalizadas,
          ordensEmAndamento,
          ordensOrcamento,
          ordensPorStatus,
          servicosMaisComuns,
          funcionariosProdutividade,
          clientesAtivos,
          tempoMedioExecucao,
          ordensNoPrazo,
          ordensAtrasadas
        });
        
      } catch (err) {
        console.error('Erro ao carregar dados do relatório:', err);
        setError('Falha ao carregar dados do relatório');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDados();
  }, [dataInicio, dataFim]);

  return { dados, loading, error };
};
