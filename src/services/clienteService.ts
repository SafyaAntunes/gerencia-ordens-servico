
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  query,
  where,
  addDoc
} from 'firebase/firestore';
import { Cliente, Motor } from '@/types/clientes';
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
    
    // Obter os motores do cliente
    const motoresRef = collection(db, `clientes/${id}/motores`);
    const motoresSnapshot = await getDocs(motoresRef);
    const motores = motoresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Motor));
    
    return {
      id: clienteDoc.id,
      ...data,
      motores
    } as Cliente;
  } catch (error) {
    console.error('Erro ao carregar cliente:', error);
    throw error;
  }
};

// Salvar ou atualizar um cliente
export const saveCliente = async (cliente: Cliente): Promise<boolean> => {
  try {
    const { id, motores, ...clienteData } = cliente;
    
    let clienteId = id;
    
    // Se for uma atualização
    if (id && id.trim() !== '') {
      const clienteRef = doc(db, 'clientes', id);
      await updateDoc(clienteRef, clienteData);
      
      // Atualizar motores se existirem
      if (motores && motores.length > 0) {
        for (const motor of motores) {
          const { id: motorId, ...motorData } = motor;
          const motorRef = doc(db, `clientes/${id}/motores`, motorId);
          await setDoc(motorRef, motorData);
        }
      }
    } 
    // Se for um novo cliente
    else {
      const clientesRef = collection(db, 'clientes');
      const novoClienteRef = doc(clientesRef);
      clienteId = novoClienteRef.id;
      
      await setDoc(novoClienteRef, {
        ...clienteData,
        dataCriacao: Timestamp.now()
      });
      
      // Adicionar motores ao novo cliente se existirem
      if (motores && motores.length > 0) {
        for (const motor of motores) {
          const { id: motorId, ...motorData } = motor;
          const motorRef = doc(db, `clientes/${novoClienteRef.id}/motores`, motorId || doc(collection(db, `clientes/${novoClienteRef.id}/motores`)).id);
          await setDoc(motorRef, motorData);
        }
      }
      
      console.log(`Novo cliente criado com ID: ${clienteId}`);
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

// Adicionar ou atualizar um motor para um cliente
export const saveMotor = async (clienteId: string, motor: Motor): Promise<boolean> => {
  try {
    const { id, ...motorData } = motor;
    let motorRef;
    
    if (id) {
      motorRef = doc(db, `clientes/${clienteId}/motores`, id);
    } else {
      motorRef = doc(collection(db, `clientes/${clienteId}/motores`));
    }
    
    await setDoc(motorRef, motorData);
    return true;
  } catch (error) {
    console.error('Erro ao salvar motor:', error);
    throw error;
  }
};

// Excluir um motor de um cliente
export const deleteMotor = async (clienteId: string, motorId: string): Promise<boolean> => {
  try {
    const motorRef = doc(db, `clientes/${clienteId}/motores`, motorId);
    await deleteDoc(motorRef);
    return true;
  } catch (error) {
    console.error('Erro ao excluir motor:', error);
    throw error;
  }
};

// Obter os motores de um cliente
export const getMotores = async (clienteId: string): Promise<Motor[]> => {
  try {
    console.log(`Buscando motores para o cliente ID: ${clienteId}`);
    const motoresRef = collection(db, `clientes/${clienteId}/motores`);
    const snapshot = await getDocs(motoresRef);
    const motores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Motor));
    console.log(`${motores.length} motores encontrados`);
    return motores;
  } catch (error) {
    console.error('Erro ao carregar motores:', error);
    throw error;
  }
};
