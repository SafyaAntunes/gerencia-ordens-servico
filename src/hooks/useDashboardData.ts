
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { OrdemServico } from '@/types/ordens';
import { startOfDay, endOfDay } from 'date-fns';

export interface DashboardData {
  totalOrdens: number;
  ordensEmAndamento: number;
  ordensFinalizadas: number;
  ordensAtrasadas: number;
  ordensOrcamento: number;
  ordensPorStatus: Array<{ name: string; total: number }>;
  servicosPorTipo: Array<{ name: string; total: number }>;
}

interface UseDashboardDataProps {
  dataInicio?: Date;
  dataFim?: Date;
}

export const useDashboardData = ({ dataInicio, dataFim }: UseDashboardDataProps = {}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
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
            nome: data.nome || '',
            cliente: data.cliente || { id: '', nome: '', telefone: '', email: '' },
            motorId: data.motorId,
            dataAbertura: data.dataAbertura?.toDate() || new Date(),
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
            prioridade: data.prioridade || 'media',
            servicos: data.servicos || [],
            status: data.status || 'orcamento',
            progressoEtapas: data.progressoEtapas || 0,
            etapasAndamento: data.etapasAndamento || {},
            tempoRegistros: data.tempoRegistros || [],
            fotosEntrada: data.fotosEntrada || [],
            fotosSaida: data.fotosSaida || [],
            tempoTotalEstimado: data.tempoTotalEstimado,
            timers: data.timers || {}
          } as OrdemServico;
        });

        const hoje = new Date();
        
        const totalOrdens = ordens.length;
        const ordensEmAndamento = ordens.filter(o => 
          ['executando_servico', 'aguardando_aprovacao', 'autorizado'].includes(o.status)
        ).length;
        const ordensFinalizadas = ordens.filter(o => 
          ['finalizado', 'entregue'].includes(o.status)
        ).length;
        const ordensAtrasadas = ordens.filter(o => 
          o.dataPrevistaEntrega < hoje && !['finalizado', 'entregue'].includes(o.status)
        ).length;
        const ordensOrcamento = ordens.filter(o => o.status === 'orcamento').length;

        // Ordens por status
        const statusCount: Record<string, number> = {};
        ordens.forEach(ordem => {
          statusCount[ordem.status] = (statusCount[ordem.status] || 0) + 1;
        });
        
        const ordensPorStatus = Object.entries(statusCount).map(([name, total]) => ({
          name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          total
        }));

        // Serviços por tipo
        const servicosCount: Record<string, number> = {};
        ordens.forEach(ordem => {
          ordem.servicos?.forEach(servico => {
            const tipo = servico.tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            servicosCount[tipo] = (servicosCount[tipo] || 0) + 1;
          });
        });
        
        const servicosPorTipo = Object.entries(servicosCount)
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        setData({
          totalOrdens,
          ordensEmAndamento,
          ordensFinalizadas,
          ordensAtrasadas,
          ordensOrcamento,
          ordensPorStatus,
          servicosPorTipo
        });

      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Falha ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dataInicio?.getTime(), dataFim?.getTime()]);

  return { data, loading, error, refetch: () => setLoading(true) };
};
