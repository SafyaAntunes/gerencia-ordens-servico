
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, DocumentData, getDoc, doc } from 'firebase/firestore';
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

              // MODIFICADO: Verificar dados adicionais no funcionário
              const funcData = funcionario as any; // Usando any para acessar propriedades opcionais
              const statusAtividade = funcData.statusAtividade as 'disponivel' | 'ocupado' | undefined;
              
              // Se o funcionário já está marcado como ocupado no documento
              if (statusAtividade === 'ocupado') {
                // Buscar informações detalhadas da atividade atual, se disponível
                let atividadeAtual = funcData.atividadeAtual as any;
                
                // Se tiver informações da atividade atual, tentar buscar o nome da ordem
                if (atividadeAtual && atividadeAtual.ordemId) {
                  try {
                    const ordemRef = doc(db, "ordens_servico", atividadeAtual.ordemId);
                    const ordemSnap = await getDoc(ordemRef);
                    if (ordemSnap.exists()) {
                      const ordemData = ordemSnap.data();
                      atividadeAtual = {
                        ...atividadeAtual,
                        ordemNome: ordemData.nome || `Ordem ${atividadeAtual.ordemId}`
                      };
                    }
                  } catch (err) {
                    console.warn("Erro ao buscar detalhes da ordem:", err);
                  }
                }
                
                return {
                  ...funcionario,
                  status: 'ocupado' as const,
                  atividadeAtual: atividadeAtual
                };
              }
              
              // Se não estiver marcado como ocupado diretamente, verificar se está em alguma ordem ativa
              const ordemStatus = await verificarStatusFuncionario(funcionario.id);
              
              // Determinar status final com base nas verificações
              const status = ordemStatus ? 'ocupado' as const : 'disponivel' as const;
              
              return {
                ...funcionario,
                status,
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
                
                // Buscar status atual diretamente do documento do funcionário
                try {
                  const funcRef = doc(db, "funcionarios", funcionario.id);
                  const funcSnap = await getDoc(funcRef);
                  if (funcSnap.exists()) {
                    const funcData = funcSnap.data() as any;
                    const statusAtividade = funcData.statusAtividade as 'disponivel' | 'ocupado' | undefined;
                    
                    if (statusAtividade === 'ocupado') {
                      let atividadeAtual = funcData.atividadeAtual as any;
                      
                      // Tentar buscar nome da ordem se tiver ordemId
                      if (atividadeAtual && atividadeAtual.ordemId) {
                        try {
                          const ordemRef = doc(db, "ordens_servico", atividadeAtual.ordemId);
                          const ordemSnap = await getDoc(ordemRef);
                          if (ordemSnap.exists()) {
                            const ordemData = ordemSnap.data();
                            atividadeAtual = {
                              ...atividadeAtual,
                              ordemNome: ordemData.nome || `Ordem ${atividadeAtual.ordemId}`
                            };
                          }
                        } catch (err) {
                          console.warn("Erro ao buscar detalhes da ordem:", err);
                        }
                      }
                      
                      return {
                        ...funcionario,
                        status: 'ocupado' as const,
                        atividadeAtual: atividadeAtual
                      } as FuncionarioStatus;
                    }
                  }
                } catch (err) {
                  console.warn("Erro ao verificar status direto do funcionário:", err);
                }
                
                // Se não estiver ocupado no documento, verificar ordens
                const ordemStatus = await verificarStatusFuncionario(funcionario.id);
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
            // Lógica similar à atualização da coleção funcionarios_em_servico
          }
        }, (err) => {
          console.error("Erro ao monitorar ordens:", err);
        });

        return () => {
          unsubscribeFuncionarios();
          unsubscribeOrdens();
          unsubscribeEmServico();
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
      // MODIFICADO: Verificar primeiro diretamente no documento do funcionário
      const funcionarioRef = doc(db, "funcionarios", funcionarioId);
      const funcionarioSnap = await getDoc(funcionarioRef);
      
      if (funcionarioSnap.exists()) {
        const funcionarioData = funcionarioSnap.data() as any;
        const statusAtividade = funcionarioData.statusAtividade;
        
        // Se estiver marcado como ocupado, retornar as informações da atividade
        if (statusAtividade === 'ocupado' && funcionarioData.atividadeAtual) {
          const atividadeAtual = funcionarioData.atividadeAtual;
          
          // Buscar nome da ordem, se disponível
          let ordemNome = "";
          if (atividadeAtual.ordemId) {
            try {
              const ordemRef = doc(db, "ordens_servico", atividadeAtual.ordemId);
              const ordemSnap = await getDoc(ordemRef);
              if (ordemSnap.exists()) {
                ordemNome = ordemSnap.data().nome || "";
              }
            } catch (e) {
              console.warn("Erro ao buscar nome da ordem:", e);
            }
          }
          
          return {
            ordemId: atividadeAtual.ordemId || "",
            ordemNome: ordemNome || atividadeAtual.ordemNome || "",
            etapa: atividadeAtual.etapa || "",
            servicoTipo: atividadeAtual.servicoTipo || undefined,
            inicio: new Date(atividadeAtual.inicio?.toDate?.() || atividadeAtual.inicio || new Date())
          };
        }
      }
      
      // Se não estiver marcado como ocupado, verificar ordens de serviço
      // Buscar ordens que tenham o funcionário como responsável e que estejam em andamento
      const ordensRef = collection(db, 'ordens_servico');
      const q = query(
        ordensRef,
        where('status', 'in', ['executando_servico', 'orcamento', 'aguardando_aprovacao']),
      );
      
      const snapshot = await getDocs(q);
      
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
