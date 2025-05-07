
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Funcionario } from '@/types/funcionarios';

export interface FuncionarioStatus extends Funcionario {
  status: 'disponivel' | 'ocupado';
  atividadeAtual?: {
    ordemId: string;
    ordemNome: string;
    etapa: string;
    servicoTipo?: string;
    inicio: Date;
  };
}

export const useFuncionariosDisponibilidade = () => {
  const [funcionariosStatus, setFuncionariosStatus] = useState<FuncionarioStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Primeiro: carregar todos os funcionários
    const carregarFuncionarios = async () => {
      try {
        // Buscar todos os funcionários
        const funcionariosRef = collection(db, 'funcionarios');
        const unsubscribeFuncionarios = onSnapshot(funcionariosRef, async (snapshot) => {
          const funcionariosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Funcionario[];

          // Para cada funcionário, verificar status atual em ordens
          const funcionariosComStatus: FuncionarioStatus[] = await Promise.all(
            funcionariosData.map(async (funcionario) => {
              // Verificar se está em alguma ordem ativa
              const ordemStatus = await verificarStatusFuncionario(funcionario.id);
              
              return {
                ...funcionario,
                status: ordemStatus ? 'ocupado' : 'disponivel',
                atividadeAtual: ordemStatus || undefined
              };
            })
          );
          
          setFuncionariosStatus(funcionariosComStatus);
          setLoading(false);
        }, (err) => {
          console.error("Erro ao monitorar funcionários:", err);
          setError("Falha ao obter dados de funcionários");
          setLoading(false);
        });

        // Monitorar mudanças em ordens de serviço para atualizar status em tempo real
        const ordensRef = collection(db, 'ordens_servico');
        const unsubscribeOrdens = onSnapshot(ordensRef, async () => {
          // Quando qualquer ordem mudar, atualizar status de todos funcionários
          if (funcionariosStatus.length > 0) {
            const funcionariosAtualizados = await Promise.all(
              funcionariosStatus.map(async (funcionario) => {
                const ordemStatus = await verificarStatusFuncionario(funcionario.id);
                
                return {
                  ...funcionario,
                  status: ordemStatus ? 'ocupado' : 'disponivel',
                  atividadeAtual: ordemStatus || undefined
                };
              })
            );
            
            setFuncionariosStatus(funcionariosAtualizados);
          }
        }, (err) => {
          console.error("Erro ao monitorar ordens:", err);
        });

        return () => {
          unsubscribeFuncionarios();
          unsubscribeOrdens();
        };
      } catch (err) {
        console.error("Erro ao carregar funcionários:", err);
        setError("Falha ao carregar dados");
        setLoading(false);
      }
    };

    carregarFuncionarios();
  }, []);

  // Função auxiliar para verificar se um funcionário está atribuído a alguma etapa em andamento
  const verificarStatusFuncionario = async (funcionarioId: string) => {
    try {
      // Buscar ordens que tenham o funcionário como responsável e que estejam em andamento
      const ordensRef = collection(db, 'ordens_servico');
      const q = query(
        ordensRef,
        where('status', 'in', ['fabricacao', 'orcamento', 'aguardando_aprovacao']),
      );
      
      const snapshot = await getDocs(q);
      
      // Verificar cada ordem
      for (const docSnap of snapshot.docs) {
        const ordem = { id: docSnap.id, ...docSnap.data() };
        
        // Verificar etapas em andamento
        if (ordem.etapasAndamento) {
          for (const [etapaKey, etapaInfo] of Object.entries(ordem.etapasAndamento)) {
            const info = etapaInfo as DocumentData;
            // Se o funcionário estiver atribuído a esta etapa e ela não estiver concluída
            if (
              info.funcionarioId === funcionarioId && 
              !info.concluido && 
              info.iniciado && 
              !info.finalizado
            ) {
              // Extrair nome da etapa e serviço
              let etapaNome = etapaKey;
              let servicoTipo;
              
              // Se for uma etapa composta (ex: "inspecao_inicial_bloco"), separar
              if (etapaKey.includes('_')) {
                const partes = etapaKey.split('_');
                if (partes.length >= 3) {
                  etapaNome = `${partes[0]}_${partes[1]}`;
                  servicoTipo = partes[2];
                }
              }
              
              return {
                ordemId: ordem.id,
                ordemNome: ordem.nome,
                etapa: etapaNome,
                servicoTipo,
                inicio: new Date(info.iniciado)
              };
            }
          }
        }
      }
      
      return null;
    } catch (err) {
      console.error("Erro ao verificar status do funcionário:", err);
      return null;
    }
  };

  // Dados agregados
  const funcionariosDisponiveis = funcionariosStatus.filter(f => f.status === 'disponivel');
  const funcionariosOcupados = funcionariosStatus.filter(f => f.status === 'ocupado');

  return {
    funcionariosStatus,
    funcionariosDisponiveis,
    funcionariosOcupados,
    loading,
    error
  };
};
