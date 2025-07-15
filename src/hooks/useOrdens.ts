import { useState } from 'react';
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

  const fetchOrdens = async () => {
    setLoading(true);
    try {
      const ordensRef = collection(db, 'ordens_servico');
      const q = query(ordensRef, orderBy("dataAbertura", "desc"));
      const snapshot = await getDocs(q);
      
      // Processar as ordens e carregar informações do cliente com seus motores
      const ordensData = await Promise.all(snapshot.docs.map(async (doc) => {
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
      
      setOrdens(ordensData);
    } catch (error) {
      console.error("Erro ao carregar ordens:", error);
      toast.error('Erro ao carregar ordens de serviço.');
    } finally {
      setLoading(false);
    }
  };

  const getOrdem = async (id: string) => {
    try {
      const ordemRef = doc(db, 'ordens_servico', id);
      const ordemDoc = await getDoc(ordemRef);
      
      if (!ordemDoc.exists()) {
        return null;
      }
      
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
      
      return {
        id: ordemDoc.id,
        ...data,
        dataAbertura,
        dataPrevistaEntrega
      } as OrdemServico;
    } catch (error) {
      console.error("Erro ao carregar ordem:", error);
      toast.error('Erro ao carregar ordem de serviço.');
      return null;
    }
  };

  const saveOrdem = async (ordem: OrdemServico) => {
    try {
      const { id, ...ordemData } = ordem;
      
      // Create a new object for Firestore without type constraints
      const ordemToSaveFirestore: Record<string, any> = { ...ordemData };
      
      // Converter Date para Timestamp
      if (ordemData.dataAbertura instanceof Date) {
        ordemToSaveFirestore.dataAbertura = Timestamp.fromDate(ordemData.dataAbertura);
      }
      
      if (ordemData.dataPrevistaEntrega instanceof Date) {
        ordemToSaveFirestore.dataPrevistaEntrega = Timestamp.fromDate(ordemData.dataPrevistaEntrega);
      }
      
      const ordemRef = id ? doc(db, 'ordens_servico', id) : doc(collection(db, 'ordens_servico'));
      await setDoc(ordemRef, ordemToSaveFirestore, { merge: true });
      toast.success('Ordem salva com sucesso!');
      return true;
    } catch (error) {
      console.error("Erro ao salvar ordem:", error);
      toast.error('Erro ao salvar ordem de serviço.');
      return false;
    }
  };

  const updateOrdem = async (ordem: OrdemServico) => {
    try {
      // Create a new object for Firestore without type constraints
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
      toast.success('Ordem atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      toast.error('Erro ao atualizar ordem de serviço.');
      return false;
    }
  };

  const deleteOrdem = async (id: string) => {
    try {
      console.log(`🗑️ Deletando ordem ${id}...`);
      
      // First, get the order data to identify associated employees
      const ordemRef = doc(db, 'ordens_servico', id);
      const ordemDoc = await getDoc(ordemRef);
      
      if (ordemDoc.exists()) {
        const ordemData = { id, ...ordemDoc.data() } as OrdemServico;
        
        // Free associated employees
        await liberarFuncionariosOrdem(ordemData);
      }
      
      // Delete the order
      await deleteDoc(ordemRef);
      console.log(`✅ Ordem ${id} deletada com sucesso`);
      toast.success('Ordem excluída com sucesso!');
      return true;
    } catch (error) {
      console.error("Erro ao excluir ordem:", error);
      toast.error('Erro ao excluir ordem de serviço.');
      return false;
    }
  };

  const deleteMultipleOrdens = async (ids: string[]) => {
    try {
      console.log(`🗑️ Deletando ${ids.length} ordens...`);
      
      // First, get all orders and free associated employees
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
      
      // Free employees from all orders
      const ordensValidas = ordens.filter(ordem => ordem !== null) as OrdemServico[];
      await Promise.all(
        ordensValidas.map(ordem => liberarFuncionariosOrdem(ordem))
      );
      
      // Delete all orders
      await Promise.all(
        ids.map(async (id) => {
          const ordemRef = doc(db, 'ordens_servico', id);
          await deleteDoc(ordemRef);
        })
      );
      
      console.log(`✅ ${ids.length} ordens deletadas com sucesso`);
      toast.success(`${ids.length} ${ids.length === 1 ? 'ordem excluída' : 'ordens excluídas'} com sucesso`);
      return true;
    } catch (error) {
      console.error("Erro ao excluir ordens:", error);
      toast.error('Erro ao excluir ordens de serviço.');
      return false;
    }
  };

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
