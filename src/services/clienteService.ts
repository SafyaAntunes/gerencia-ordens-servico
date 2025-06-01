
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp
} from 'firebase/firestore';
import { Cliente } from '@/types/clientes';
import { toast } from 'sonner';

// Obter todos os clientes
export const getClientes = async (): Promise<Cliente[]> => {
  try {
    const clientesRef = collection(db, 'clientes');
    const snapshot = await getDocs(clientesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Cliente));
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    throw error;
  }
};

// Obter um cliente específico
export const getCliente = async (id: string): Promise<Cliente | null> => {
  try {
    const clienteRef = doc(db, 'clientes', id);
    const clienteDoc = await getDoc(clienteRef);
    
    if (!clienteDoc.exists()) {
      return null;
    }
    
    const data = clienteDoc.data();
    
    return {
      id: clienteDoc.id,
      ...data
    } as Cliente;
  } catch (error) {
    console.error('Erro ao carregar cliente:', error);
    throw error;
  }
};

// Salvar ou atualizar um cliente
export const saveCliente = async (cliente: Cliente): Promise<boolean> => {
  try {
    const { id, ...clienteData } = cliente;
    
    // Se for uma atualização
    if (id && id.trim() !== '') {
      const clienteRef = doc(db, 'clientes', id);
      await updateDoc(clienteRef, clienteData);
    } 
    // Se for um novo cliente
    else {
      const clientesRef = collection(db, 'clientes');
      const novoClienteRef = doc(clientesRef);
      
      await setDoc(novoClienteRef, {
        ...clienteData,
        dataCriacao: Timestamp.now()
      });
      
      console.log(`Novo cliente criado com ID: ${novoClienteRef.id}`);
      toast.success("Cliente criado com sucesso!");
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    throw error;
  }
};

// Excluir um cliente
export const deleteCliente = async (id: string): Promise<boolean> => {
  try {
    const clienteRef = doc(db, 'clientes', id);
    await deleteDoc(clienteRef);
    return true;
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    throw error;
  }
};
