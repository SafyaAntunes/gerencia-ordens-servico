import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { OrdemServico } from '@/types/ordens';
import { liberarFuncionarioDeServico } from '@/services/funcionarioEmServicoService';
import { indexedDBService, QueueItem } from '@/services/indexedDBService';
import { useNetworkStatus } from './useNetworkStatus';

// Helper function to extract all employee IDs from an order
const extractFuncionarioIds = (ordem: OrdemServico): string[] => {
  const funcionarioIds = new Set<string>();
  
  // Extract from services
  if (ordem.servicos) {
    ordem.servicos.forEach(servico => {
      if (servico.funcionarioId) {
        funcionarioIds.add(servico.funcionarioId);
      }
    });
  }
  
  // Extract from etapasAndamento
  if (ordem.etapasAndamento) {
    Object.values(ordem.etapasAndamento).forEach(etapa => {
      if (etapa?.funcionarioId) {
        funcionarioIds.add(etapa.funcionarioId);
      }
    });
  }
  
  return Array.from(funcionarioIds);
};

// Helper function to free employees from an order
const liberarFuncionariosOrdem = async (ordem: OrdemServico): Promise<void> => {
  const funcionarioIds = extractFuncionarioIds(ordem);
  
  if (funcionarioIds.length === 0) {
    return;
  }
  
  console.log(`🔓 Liberando ${funcionarioIds.length} funcionários da ordem ${ordem.id}...`);
  
  const liberacaoPromises = funcionarioIds.map(async (funcionarioId) => {
    try {
      const success = await liberarFuncionarioDeServico(funcionarioId);
      if (success) {
        console.log(`✅ Funcionário ${funcionarioId} liberado com sucesso`);
      } else {
        console.warn(`⚠️ Falha ao liberar funcionário ${funcionarioId}`);
      }
      return { funcionarioId, success };
    } catch (error) {
      console.error(`❌ Erro ao liberar funcionário ${funcionarioId}:`, error);
      return { funcionarioId, success: false };
    }
  });
  
  const resultados = await Promise.allSettled(liberacaoPromises);
  const sucessos = resultados.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;
  
  console.log(`📊 Resultado da liberação: ${sucessos}/${funcionarioIds.length} funcionários liberados`);
};

export const useOrdens = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  // Inicializa IndexedDB
  useEffect(() => {
    indexedDBService.init().catch(error => {
      console.error('Erro ao inicializar IndexedDB:', error);
    });
  }, []);

  const fetchOrdens = async () => {
    setLoading(true);
    try {
      let ordensData: OrdemServico[] = [];

      if (isOnline) {
        // Online: busca do Firebase
        const ordensRef = collection(db, 'ordens_servico');
        const q = query(ordensRef, orderBy("dataAbertura", "desc"));
        const snapshot = await getDocs(q);
        
        ordensData = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Verificar se há cliente com ID
          if (data.cliente && data.cliente.id) {
            try {
              // Buscar motores do cliente
              const motoresRef = collection(db, `clientes/${data.cliente.id}/motores`);
              const motoresSnapshot = await getDocs(motoresRef);
              const motores = motoresSnapshot.docs.map(motorDoc => ({
                id: motorDoc.id,
                ...motorDoc.data()
              }));
              
              // Adicionar motores ao cliente na ordem
              data.cliente.motores = motores;
            } catch (error) {
              console.error("Erro ao carregar motores do cliente:", error);
            }
          }
          
          // Converter Timestamp para Date
          const dataAbertura = data.dataAbertura instanceof Timestamp 
            ? data.dataAbertura.toDate() 
            : new Date();
          
          const dataPrevistaEntrega = data.dataPrevistaEntrega instanceof Timestamp 
            ? data.dataPrevistaEntrega.toDate() 
            : new Date();
          
          return {
            id: doc.id,
            ...data,
            dataAbertura,
            dataPrevistaEntrega
          } as OrdemServico;
        }));

        // Salva no storage local para uso offline
        for (const ordem of ordensData) {
          await indexedDBService.saveOrdem(ordem);
        }
      } else {
        // Offline: busca do IndexedDB
        console.log('🔌 Modo offline: carregando ordens do storage local');
        ordensData = await indexedDBService.getAllOrdens();
        
        // Converte strings de data de volta para Date objects se necessário
        ordensData = ordensData.map(ordem => ({
          ...ordem,
          dataAbertura: ordem.dataAbertura instanceof Date ? ordem.dataAbertura : new Date(ordem.dataAbertura),
          dataPrevistaEntrega: ordem.dataPrevistaEntrega instanceof Date ? ordem.dataPrevistaEntrega : new Date(ordem.dataPrevistaEntrega)
        }));

        if (ordensData.length === 0) {
          toast.info('Nenhuma ordem encontrada no armazenamento local. Conecte-se à internet para sincronizar.');
        } else {
          toast.info(`${ordensData.length} ${ordensData.length === 1 ? 'ordem carregada' : 'ordens carregadas'} do armazenamento local.`);
        }
      }
      
      setOrdens(ordensData);
    } catch (error) {
      console.error("Erro ao carregar ordens:", error);
      
      if (isOnline) {
        toast.error('Erro ao carregar ordens de serviço do servidor.');
      } else {
        toast.error('Erro ao carregar ordens do armazenamento local.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getOrdem = async (id: string) => {
    try {
      if (isOnline) {
        // Online: busca do Firebase primeiro
        const ordemRef = doc(db, 'ordens_servico', id);
        const ordemDoc = await getDoc(ordemRef);
        
        if (ordemDoc.exists()) {
          const data = ordemDoc.data();
          
          // Carregar motores do cliente se houver um cliente vinculado
          if (data.cliente && data.cliente.id) {
            try {
              const clienteDoc = await getDoc(doc(db, "clientes", data.cliente.id));
              if (clienteDoc.exists()) {
                const clienteData = clienteDoc.data();
                data.cliente.nome = clienteData.nome || "Cliente sem nome";
                data.cliente.telefone = clienteData.telefone || "";
                data.cliente.email = clienteData.email || "";
                
                // Carregar os motores do cliente
                const motoresRef = collection(db, `clientes/${data.cliente.id}/motores`);
                const motoresSnapshot = await getDocs(motoresRef);
                data.cliente.motores = motoresSnapshot.docs.map(motorDoc => ({
                  id: motorDoc.id,
                  ...motorDoc.data()
                }));
              }
            } catch (clientError) {
              console.error("Erro ao buscar dados do cliente:", clientError);
            }
          }
          
          // Converter Timestamp para Date - Correção aqui usando toDate()
          const dataAbertura = data.dataAbertura instanceof Timestamp 
            ? data.dataAbertura.toDate() 
            : new Date();
          
          const dataPrevistaEntrega = data.dataPrevistaEntrega instanceof Timestamp 
            ? data.dataPrevistaEntrega.toDate() 
            : new Date();
          
          const ordem = {
            id: ordemDoc.id,
            ...data,
            dataAbertura,
            dataPrevistaEntrega
          } as OrdemServico;

          // Salva no storage local
          await indexedDBService.saveOrdem(ordem);
          
          return ordem;
        }
      }
      
      // Se não encontrou online ou está offline, busca no storage local
      const ordemLocal = await indexedDBService.getOrdem(id);
      if (ordemLocal) {
        console.log(`📁 Ordem ${id} carregada do storage local`);
        return {
          ...ordemLocal,
          dataAbertura: ordemLocal.dataAbertura instanceof Date ? ordemLocal.dataAbertura : new Date(ordemLocal.dataAbertura),
          dataPrevistaEntrega: ordemLocal.dataPrevistaEntrega instanceof Date ? ordemLocal.dataPrevistaEntrega : new Date(ordemLocal.dataPrevistaEntrega)
        };
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao carregar ordem:", error);
      toast.error('Erro ao carregar ordem de serviço.');
      return null;
    }
  };

  const saveOrdem = async (ordem: OrdemServico) => {
    try {
      const { id, ...ordemData } = ordem;
      const ordemToSave = { id, ...ordemData };
      
      // Sempre salva localmente primeiro
      await indexedDBService.saveOrdem(ordemToSave);
      console.log(`💾 Ordem ${id} salva localmente`);

      if (isOnline) {
        // Online: salva no Firebase e remove da fila se estava lá
        try {
          const ordemToSaveFirestore: Record<string, any> = { ...ordemData };
          
          // Convert Date para Timestamp
          if (ordemData.dataAbertura instanceof Date) {
            ordemToSaveFirestore.dataAbertura = Timestamp.fromDate(ordemData.dataAbertura);
          }
          
          if (ordemData.dataPrevistaEntrega instanceof Date) {
            ordemToSaveFirestore.dataPrevistaEntrega = Timestamp.fromDate(ordemData.dataPrevistaEntrega);
          }
          
          const ordemRef = id ? doc(db, 'ordens_servico', id) : doc(collection(db, 'ordens_servico'));
          await setDoc(ordemRef, ordemToSaveFirestore, { merge: true });
          
          console.log(`☁️ Ordem ${id} salva no Firebase`);
          toast.success('Ordem salva com sucesso!');
          return true;
        } catch (firebaseError) {
          console.error('Erro ao salvar no Firebase, adicionando à fila:', firebaseError);
          // Se falhar online, adiciona à fila para sincronizar depois
          await this.addToSyncQueue('CREATE', ordemToSave);
          toast.success('Ordem salva localmente. Será sincronizada quando a conexão estiver estável.');
          return true;
        }
      } else {
        // Offline: adiciona à fila de sincronização
        await this.addToSyncQueue('CREATE', ordemToSave);
        toast.success('Ordem salva offline. Será sincronizada quando voltar online.');
        return true;
      }
    } catch (error) {
      console.error("Erro ao salvar ordem:", error);
      toast.error('Erro ao salvar ordem de serviço.');
      return false;
    }
  };

  const updateOrdem = async (ordem: OrdemServico) => {
    try {
      // Sempre atualiza localmente primeiro
      await indexedDBService.saveOrdem(ordem);
      console.log(`💾 Ordem ${ordem.id} atualizada localmente`);

      if (isOnline) {
        // Online: atualiza no Firebase
        try {
          const updateData: Record<string, any> = {};
          
          // Convert Date fields to Timestamp for Firestore
          if (ordem.dataAbertura instanceof Date) {
            updateData.dataAbertura = Timestamp.fromDate(ordem.dataAbertura);
          }
          
          if (ordem.dataPrevistaEntrega instanceof Date) {
            updateData.dataPrevistaEntrega = Timestamp.fromDate(ordem.dataPrevistaEntrega);
          }
          
          // Copy all other fields
          Object.keys(ordem).forEach(key => {
            if (key !== 'id' && key !== 'dataAbertura' && key !== 'dataPrevistaEntrega') {
              updateData[key] = ordem[key as keyof typeof ordem];
            }
          });
          
          const ordemRef = doc(db, 'ordens_servico', ordem.id);
          await updateDoc(ordemRef, updateData);
          
          console.log(`☁️ Ordem ${ordem.id} atualizada no Firebase`);
          toast.success('Ordem atualizada com sucesso!');
          return true;
        } catch (firebaseError) {
          console.error('Erro ao atualizar no Firebase, adicionando à fila:', firebaseError);
          await this.addToSyncQueue('UPDATE', ordem);
          toast.success('Ordem atualizada localmente. Será sincronizada quando a conexão estiver estável.');
          return true;
        }
      } else {
        // Offline: adiciona à fila de sincronização
        await this.addToSyncQueue('UPDATE', ordem);
        toast.success('Ordem atualizada offline. Será sincronizada quando voltar online.');
        return true;
      }
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      toast.error('Erro ao atualizar ordem de serviço.');
      return false;
    }
  };

  const deleteOrdem = async (id: string) => {
    try {
      console.log(`🗑️ Deletando ordem ${id}...`);
      
      if (isOnline) {
        // Online: busca dados primeiro para liberar funcionários, depois deleta
        try {
          const ordemRef = doc(db, 'ordens_servico', id);
          const ordemDoc = await getDoc(ordemRef);
          
          if (ordemDoc.exists()) {
            const ordemData = { id, ...ordemDoc.data() } as OrdemServico;
            await liberarFuncionariosOrdem(ordemData);
          }
          
          await deleteDoc(ordemRef);
          await indexedDBService.deleteOrdem(id);
          
          console.log(`✅ Ordem ${id} deletada do Firebase e storage local`);
          toast.success('Ordem excluída com sucesso!');
          return true;
        } catch (firebaseError) {
          console.error('Erro ao deletar no Firebase, adicionando à fila:', firebaseError);
          await this.addToSyncQueue('DELETE', undefined, id);
          await indexedDBService.deleteOrdem(id);
          toast.success('Ordem marcada para exclusão. Será removida do servidor quando voltar online.');
          return true;
        }
      } else {
        // Offline: marca para deleção e remove localmente
        const ordemLocal = await indexedDBService.getOrdem(id);
        if (ordemLocal) {
          await liberarFuncionariosOrdem(ordemLocal);
        }
        
        await this.addToSyncQueue('DELETE', undefined, id);
        await indexedDBService.deleteOrdem(id);
        
        console.log(`📱 Ordem ${id} marcada para exclusão offline`);
        toast.success('Ordem marcada para exclusão. Será removida do servidor quando voltar online.');
        return true;
      }
    } catch (error) {
      console.error("Erro ao excluir ordem:", error);
      toast.error('Erro ao excluir ordem de serviço.');
      return false;
    }
  };

  const deleteMultipleOrdens = async (ids: string[]) => {
    try {
      console.log(`🗑️ Deletando ${ids.length} ordens...`);
      
      if (isOnline) {
        // Online: processa todas
        try {
          const ordens = await Promise.all(
            ids.map(async (id) => {
              try {
                const ordemRef = doc(db, 'ordens_servico', id);
                const ordemDoc = await getDoc(ordemRef);
                
                if (ordemDoc.exists()) {
                  return { id, ...ordemDoc.data() } as OrdemServico;
                }
                return null;
              } catch (error) {
                console.error(`Erro ao buscar ordem ${id}:`, error);
                return null;
              }
            })
          );
          
          const ordensValidas = ordens.filter(ordem => ordem !== null) as OrdemServico[];
          await Promise.all(
            ordensValidas.map(ordem => liberarFuncionariosOrdem(ordem))
          );
          
          await Promise.all(
            ids.map(async (id) => {
              const ordemRef = doc(db, 'ordens_servico', id);
              await deleteDoc(ordemRef);
              await indexedDBService.deleteOrdem(id);
            })
          );
          
          console.log(`✅ ${ids.length} ordens deletadas do Firebase e storage local`);
          toast.success(`${ids.length} ${ids.length === 1 ? 'ordem excluída' : 'ordens excluídas'} com sucesso`);
          return true;
        } catch (firebaseError) {
          console.error('Erro ao deletar múltiplas ordens no Firebase:', firebaseError);
          // Se falhar, adiciona todas à fila
          for (const id of ids) {
            await this.addToSyncQueue('DELETE', undefined, id);
            await indexedDBService.deleteOrdem(id);
          }
          toast.success(`${ids.length} ordens marcadas para exclusão. Serão removidas do servidor quando voltar online.`);
          return true;
        }
      } else {
        // Offline: marca todas para deleção
        for (const id of ids) {
          const ordemLocal = await indexedDBService.getOrdem(id);
          if (ordemLocal) {
            await liberarFuncionariosOrdem(ordemLocal);
          }
          
          await this.addToSyncQueue('DELETE', undefined, id);
          await indexedDBService.deleteOrdem(id);
        }
        
        console.log(`📱 ${ids.length} ordens marcadas para exclusão offline`);
        toast.success(`${ids.length} ordens marcadas para exclusão. Serão removidas do servidor quando voltar online.`);
        return true;
      }
    } catch (error) {
      console.error("Erro ao excluir ordens:", error);
      toast.error('Erro ao excluir ordens de serviço.');
      return false;
    }
  };

  // Método auxiliar para adicionar à fila de sincronização
  private async addToSyncQueue(operation: 'CREATE' | 'UPDATE' | 'DELETE', data?: OrdemServico, id?: string): Promise<void> {
    const queueItem: QueueItem = {
      id: id || data?.id || '',
      operation,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    await indexedDBService.addToSyncQueue(queueItem);
  }

  return {
    ordens,
    loading,
    fetchOrdens,
    getOrdem,
    saveOrdem,
    updateOrdem,
    deleteOrdem,
    deleteMultipleOrdens
  };
};
