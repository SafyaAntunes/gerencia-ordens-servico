
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
  Timestamp 
} from 'firebase/firestore';
import { Cliente } from '@/types/clientes';

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const clientesRef = collection(db, 'clientes');
      const snapshot = await getDocs(clientesRef);
      const clientesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Cliente[];
      setClientes(clientesData);
    } catch (error) {
      toast.error('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  const getCliente = async (id: string) => {
    try {
      const clienteRef = doc(db, 'clientes', id);
      const clienteDoc = await getDoc(clienteRef);
      
      if (!clienteDoc.exists()) {
        return null;
      }
      
      return {
        id: clienteDoc.id,
        ...clienteDoc.data()
      } as Cliente;
    } catch (error) {
      toast.error('Erro ao carregar cliente.');
      return null;
    }
  };

  const saveCliente = async (cliente: Cliente) => {
    try {
      const { id, ...clienteData } = cliente;
      let clienteRef;
      
      if (id) {
        clienteRef = doc(db, 'clientes', id);
        await updateDoc(clienteRef, clienteData);
      } else {
        clienteRef = doc(collection(db, 'clientes'));
        await setDoc(clienteRef, {
          ...clienteData,
          dataCriacao: Timestamp.now()
        });
      }
      
      toast.success('Cliente salvo com sucesso!');
      await fetchClientes();
      return true;
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente.');
      return false;
    }
  };

  const deleteCliente = async (id: string) => {
    try {
      const clienteRef = doc(db, 'clientes', id);
      await deleteDoc(clienteRef);
      toast.success('Cliente excluído com sucesso!');
      await fetchClientes();
      return true;
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente.');
      return false;
    }
  };

  return {
    clientes,
    loading,
    fetchClientes,
    getCliente,
    saveCliente,
    deleteCliente
  };
};
