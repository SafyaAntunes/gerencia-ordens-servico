import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, DocumentData, getDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Funcionario } from '@/types/funcionarios';

export interface FuncionarioStatus extends Funcionario {
  status: 'disponivel' | 'ocupado' | 'inativo';
  atividadeAtual?: {
    ordemId: string;
    ordemNome?: string;
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
          console.log("Atualizando lista de funcionários...");
          const funcionariosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Funcionario[];

          // Para cada funcionário, verificar status atual
          const funcionariosComStatus: FuncionarioStatus[] = await Promise.all(
            funcionariosData.map(async (funcionario) => {
              // Verificar primeiro se o funcionário está ativo
              if (funcionario.ativo === false) {
                return {
                  ...funcionario,
                  status: 'inativo' as const,
                  atividadeAtual: undefined
                };
              }

              // Verificar documento do funcionário diretamente para status
              const funcionarioRef = doc(db, "funcionarios", funcionario.id);
              const funcionarioDoc = await getDoc(funcionarioRef);
              const funcData = funcionarioDoc.data() || {};
              const statusAtividade = funcData.statusAtividade as 'disponivel' | 'ocupado' | undefined;
              const atividadeAtual = funcData.atividadeAtual;
              
              // Também verificar se o funcionário está em alguma ordem ativa
              const ordemStatus = await verificarStatusFuncionario(funcionario.id);
              
              console.log(`Funcionário ${funcionario.nome} (${funcionario.id}): status no doc=${statusAtividade}, em ordem=${ordemStatus ? 'sim' : 'não'}`);
              
              // IMPORTANTE: Se o status no documento é "ocupado" mas não encontramos ele em nenhuma ordem,
              // ou se encontramos ele em uma ordem mas o status no documento é "disponivel",
              // precisamos fazer uma correção para garantir consistência
              
              if (statusAtividade === 'ocupado' && !ordemStatus) {
                console.log(`Funcionário ${funcionario.nome} está marcado como ocupado mas não está em nenhuma ordem! Corrigindo...`);
                // Corrigir o status do funcionário no Firestore
                await corrigirStatusFuncionario(funcionario.id);
                return {
                  ...funcionario,
                  status: 'disponivel' as const,
                  atividadeAtual: undefined
                };
              } 
              else if (statusAtividade !== 'ocupado' && ordemStatus) {
                console.log(`Funcionário ${funcionario.nome} está em serviço mas marcado como disponível! Corrigindo...`);
                // Atualizar o status para "ocupado" e incluir a atividade atual
                await updateDoc(funcionarioRef, {
                  statusAtividade: 'ocupado',
                  atividadeAtual: {
                    ordemId: ordemStatus.ordemId,
                    ordemNome: ordemStatus.ordemNome,
                    etapa: ordemStatus.etapa,
                    servicoTipo: ordemStatus.servicoTipo,
                    inicio: Timestamp.fromDate(ordemStatus.inicio)
                  }
                });
                
                return {
                  ...funcionario,
                  status: 'ocupado' as const,
                  atividadeAtual: ordemStatus
                };
              }
              
              // Status normal baseado no documento + verificação
              if (statusAtividade === 'ocupado' || ordemStatus) {
                return {
                  ...funcionario,
                  status: 'ocupado' as const,
                  atividadeAtual: ordemStatus || (atividadeAtual ? {
                    ...atividadeAtual,
                    inicio: atividadeAtual.inicio?.toDate() || new Date()
                  } : undefined)
                };
              } else {
                return {
                  ...funcionario,
                  status: 'disponivel' as const,
                  atividadeAtual: undefined
                };
              }
            })
          );
          
          setFuncionariosStatus(funcionariosComStatus);
          setLoading(false);
        }, (err) => {
          console.error("Erro ao monitorar funcionários:", err);
          setError("Falha ao obter dados de funcionários");
          setLoading(false);
        });

        // Monitorar também a coleção funcionarios_em_servico para atualizações em tempo real
        const emServicoRef = collection(db, 'funcionarios_em_servico');
        const unsubscribeEmServico = onSnapshot(emServicoRef, async () => {
          // Quando houver mudanças na coleção de serviços, atualizar status
          if (funcionariosStatus.length > 0) {
            console.log("Detectada alteração em funcionarios_em_servico, atualizando status...");
            const funcionariosAtualizados = await Promise.all(
              funcionariosStatus.map(async (funcionario) => {
                // Pular funcionários inativos
                if (funcionario.ativo === false) {
                  return { ...funcionario, status: 'inativo' as const };
                }
                
                // CORREÇÃO: Verificar se o funcionário realmente está em alguma ordem
                const ordemStatus = await verificarStatusFuncionario(funcionario.id);
                
                // Buscar status atual diretamente do documento do funcionário
                try {
                  const funcRef = doc(db, "funcionarios", funcionario.id);
                  const funcSnap = await getDoc(funcRef);
                  if (funcSnap.exists()) {
                    const funcData = funcSnap.data() as any;
                    const statusAtividade = funcData.statusAtividade as 'disponivel' | 'ocupado' | undefined;
                    
                    console.log(`Atualização em tempo real - Funcionário ${funcionario.nome}: status=${statusAtividade}, ordem=${ordemStatus ? 'sim' : 'não'}`);
                    
                    // CORREÇÃO: Se estiver marcado como ocupado mas não estiver em nenhuma ordem, corrigir
                    if (statusAtividade === 'ocupado' && !ordemStatus) {
                      console.log(`Corrigindo status do funcionário ${funcionario.nome} que está marcado como ocupado mas não está em nenhuma ordem`);
                      await corrigirStatusFuncionario(funcionario.id);
                      return {
                        ...funcionario,
                        status: 'disponivel' as const,
                        atividadeAtual: undefined
                      };
                    }
                  }
                } catch (err) {
                  console.warn("Erro ao verificar status direto do funcionário:", err);
                }
                
                // Status final baseado na verificação real das ordens
                const status = ordemStatus ? 'ocupado' as const : 'disponivel' as const;
                
                return {
                  ...funcionario,
                  status,
                  atividadeAtual: ordemStatus || undefined
                } as FuncionarioStatus;
              })
            );
            
            setFuncionariosStatus(funcionariosAtualizados);
          }
        });
        
        // Monitorar mudanças em ordens de serviço para atualizar status em tempo real
        const ordensRef = collection(db, 'ordens_servico');
        const unsubscribeOrdens = onSnapshot(ordensRef, async () => {
          // Quando qualquer ordem mudar, atualizar status de todos funcionários
          if (funcionariosStatus.length > 0) {
            console.log("Detectada alteração em ordens_servico, atualizando status...");
            // Verificação similar à atualização de funcionarios_em_servico
          }
        }, (err) => {
          console.error("Erro ao monitorar ordens:", err);
        });

        return () => {
          unsubscribeFuncionarios();
        };
      } catch (err) {
        console.error("Erro ao carregar funcionários:", err);
        setError("Falha ao carregar dados");
        setLoading(false);
      }
    };

    carregarFuncionarios();
  }, []);

  // Nova função para corrigir o status de um funcionário no Firestore
  const corrigirStatusFuncionario = async (funcionarioId: string) => {
    try {
      console.log(`Corrigindo status do funcionário ${funcionarioId}`);
      const funcionarioRef = doc(db, "funcionarios", funcionarioId);
      await corrigirRegistrosDeServico(funcionarioId);
      
      // Atualizar o documento do funcionário
      await updateDoc(funcionarioRef, {
        statusAtividade: "disponivel",
        atividadeAtual: null
      });
      
      console.log(`Status do funcionário ${funcionarioId} corrigido de 'ocupado' para 'disponível'`);
      return true;
    } catch (err) {
      console.error("Erro ao corrigir status do funcionário:", err);
      return false;
    }
  };
  
  // Nova função para corrigir registros de serviço pendentes
  const corrigirRegistrosDeServico = async (funcionarioId: string) => {
    try {
      const emServicoRef = doc(db, "funcionarios_em_servico", funcionarioId);
      const emServicoDoc = await getDoc(emServicoRef);
      
      if (emServicoDoc.exists()) {
        console.log(`Corrigindo registro de serviço para funcionário ${funcionarioId}`);
        await updateDoc(emServicoRef, {
          finalizado: Timestamp.now(),
          status: "finalizado_auto",
          observacao: "Liberação automática pelo sistema de correção"
        });
      }
      
      return true;
    } catch (err) {
      console.error("Erro ao corrigir registros de serviço:", err);
      return false;
    }
  };

  // Função auxiliar para verificar se um funcionário está atribuído a alguma etapa em andamento
  const verificarStatusFuncionario = async (funcionarioId: string) => {
    try {
      console.log(`Verificando status do funcionário ${funcionarioId} nas ordens...`);
      // Buscar ordens que tenham o funcionário como responsável e que estejam em andamento
      const ordensRef = collection(db, 'ordens_servico');
      const q = query(
        ordensRef,
        where('status', 'in', ['executando_servico', 'orcamento', 'aguardando_aprovacao']),
      );
      
      const snapshot = await getDocs(q);
      console.log(`Encontradas ${snapshot.docs.length} ordens para verificar`);
      
      // Verificar cada ordem
      for (const docSnap of snapshot.docs) {
        const ordem = { 
          id: docSnap.id, 
          ...docSnap.data(),
          etapasAndamento: docSnap.data().etapasAndamento || {}
        } as { 
          id: string; 
          nome: string;
          etapasAndamento: Record<string, any>;
          [key: string]: any;
        };
        
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
              console.log(`Funcionário ${funcionarioId} encontrado na etapa ${etapaKey} da ordem ${ordem.id}`);
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
        
        // Verificar também nos serviços da ordem
        if (Array.isArray(ordem.servicos)) {
          console.log(`Verificando ${ordem.servicos.length} serviços da ordem ${ordem.id}`);
          for (const servico of ordem.servicos) {
            if (
              servico.funcionarioId === funcionarioId &&
              servico.status === 'em_andamento' &&
              !servico.concluido
            ) {
              console.log(`Funcionário ${funcionarioId} encontrado no serviço ${servico.tipo} da ordem ${ordem.id}`);
              return {
                ordemId: ordem.id,
                ordemNome: ordem.nome,
                etapa: 'servico',
                servicoTipo: servico.tipo,
                inicio: servico.dataInicio ? new Date(servico.dataInicio) : new Date()
              };
            }
          }
        }
      }
      
      console.log(`Funcionário ${funcionarioId} não foi encontrado em nenhuma ordem ativa`);
      return null;
    } catch (err) {
      console.error("Erro ao verificar status do funcionário:", err);
      return null;
    }
  };

  // Dados agregados
  const funcionariosDisponiveis = funcionariosStatus.filter(f => f.status === 'disponivel' && f.ativo !== false);
  const funcionariosOcupados = funcionariosStatus.filter(f => f.status === 'ocupado');
  const funcionariosInativos = funcionariosStatus.filter(f => f.status === 'inativo' || f.ativo === false);

  return {
    funcionariosStatus,
    funcionariosDisponiveis,
    funcionariosOcupados,
    funcionariosInativos,
    loading,
    error
  };
};
