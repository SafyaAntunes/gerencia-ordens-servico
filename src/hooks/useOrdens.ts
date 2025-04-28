
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
  deleteDoc
} from 'firebase/firestore';
import { OrdemServico } from '@/types/ordens';

export const useOrdens = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrdens = async () => {
    setLoading(true);
    try {
      const ordensRef = collection(db, 'ordens_servico');
      const snapshot = await getDocs(ordensRef);
      const ordensData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OrdemServico[];
      setOrdens(ordensData);
    } catch (error) {
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
      
      return {
        id: ordemDoc.id,
        ...ordemDoc.data()
      } as OrdemServico;
    } catch (error) {
      toast.error('Erro ao carregar ordem de serviço.');
      return null;
    }
  };

  const saveOrdem = async (ordem: OrdemServico) => {
    try {
      const { id, ...ordemData } = ordem;
      const ordemRef = id ? doc(db, 'ordens_servico', id) : doc(collection(db, 'ordens_servico'));
      await setDoc(ordemRef, ordemData, { merge: true });
      toast.success('Ordem salva com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao salvar ordem de serviço.');
      return false;
    }
  };

  const updateOrdem = async (ordem: OrdemServico) => {
    try {
      const ordemRef = doc(db, 'ordens_servico', ordem.id);
      await updateDoc(ordemRef, { ...ordem });
      toast.success('Ordem atualizada com sucesso!');
      return true;
    } catch (error) {
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
      toast.error('Erro ao excluir ordem de serviço.');
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
    deleteOrdem
  };
};
