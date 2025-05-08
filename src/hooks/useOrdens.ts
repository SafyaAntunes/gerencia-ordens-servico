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
      const ordemRef = doc(db, 'ordens_servico', id);
      await deleteDoc(ordemRef);
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
      await Promise.all(
        ids.map(async (id) => {
          const ordemRef = doc(db, 'ordens_servico', id);
          await deleteDoc(ordemRef);
        })
      );
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
