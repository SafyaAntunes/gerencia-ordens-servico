
import { db } from '@/lib/firebase';
import { Cliente, Motor } from '@/types/clientes';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { toast } from 'sonner';

const COLLECTION = 'clientes';

export const getClientes = async (): Promise<Cliente[]> => {
  try {
    const clientesRef = collection(db, COLLECTION);
    const snapshot = await getDocs(clientesRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dataCriacao: data.dataCriacao ? data.dataCriacao.toDate() : null
      } as Cliente;
    });
  } catch (error) {
    console.error('Error fetching clientes:', error);
    toast.error('Erro ao carregar clientes');
    return [];
  }
};

export const getCliente = async (id: string): Promise<Cliente | null> => {
  try {
    const clienteRef = doc(db, COLLECTION, id);
    const clienteDoc = await getDoc(clienteRef);
    
    if (!clienteDoc.exists()) {
      return null;
    }
    
    const data = clienteDoc.data();
    
    // Get client's engines
    const motoresRef = collection(db, `${COLLECTION}/${id}/motores`);
    const motoresSnapshot = await getDocs(motoresRef);
    const motores = motoresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Motor[];
    
    return {
      id: clienteDoc.id,
      ...data,
      motores,
      dataCriacao: data.dataCriacao ? data.dataCriacao.toDate() : null
    } as Cliente;
  } catch (error) {
    console.error('Error fetching cliente:', error);
    toast.error('Erro ao carregar cliente');
    return null;
  }
};

export const saveCliente = async (cliente: Cliente): Promise<boolean> => {
  try {
    const { motores, ...clienteData } = cliente;
    
    if (cliente.id) {
      // Update existing client
      const clienteRef = doc(db, COLLECTION, cliente.id);
      await updateDoc(clienteRef, {
        ...clienteData,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new client
      const clienteRef = doc(collection(db, COLLECTION));
      await setDoc(clienteRef, {
        ...clienteData,
        id: clienteRef.id,
        dataCriacao: serverTimestamp()
      });
      
      cliente.id = clienteRef.id;
    }
    
    // Handle motors if provided
    if (motores && motores.length > 0) {
      for (const motor of motores) {
        const motorRef = motor.id 
          ? doc(db, `${COLLECTION}/${cliente.id}/motores`, motor.id)
          : doc(collection(db, `${COLLECTION}/${cliente.id}/motores`));
          
        if (motor.id) {
          await updateDoc(motorRef, {
            ...motor,
            updatedAt: serverTimestamp()
          });
        } else {
          await setDoc(motorRef, {
            ...motor,
            id: motorRef.id,
            createdAt: serverTimestamp()
          });
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving cliente:', error);
    toast.error('Erro ao salvar cliente');
    return false;
  }
};

export const deleteCliente = async (id: string): Promise<boolean> => {
  try {
    // First delete all motors
    const motoresRef = collection(db, `${COLLECTION}/${id}/motores`);
    const motoresSnapshot = await getDocs(motoresRef);
    
    const deleteMotoresPromises = motoresSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deleteMotoresPromises);
    
    // Then delete the client
    const clienteRef = doc(db, COLLECTION, id);
    await deleteDoc(clienteRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting cliente:', error);
    toast.error('Erro ao excluir cliente');
    return false;
  }
};

export const getClienteMotores = async (clienteId: string): Promise<Motor[]> => {
  try {
    const motoresRef = collection(db, `${COLLECTION}/${clienteId}/motores`);
    const motoresSnapshot = await getDocs(motoresRef);
    
    return motoresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Motor[];
  } catch (error) {
    console.error('Error fetching motores:', error);
    toast.error('Erro ao carregar motores');
    return [];
  }
};

export const saveMotor = async (motor: Motor, clienteId: string): Promise<boolean> => {
  try {
    let motorRef;
    
    if (motor.id) {
      motorRef = doc(db, `${COLLECTION}/${clienteId}/motores`, motor.id);
      await updateDoc(motorRef, {
        ...motor,
        updatedAt: serverTimestamp()
      });
    } else {
      motorRef = doc(collection(db, `${COLLECTION}/${clienteId}/motores`));
      await setDoc(motorRef, {
        ...motor,
        id: motorRef.id,
        createdAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error saving motor:', error);
    toast.error('Erro ao salvar motor');
    return false;
  }
};

export const deleteMotor = async (motorId: string, clienteId: string): Promise<boolean> => {
  try {
    const motorRef = doc(db, `${COLLECTION}/${clienteId}/motores`, motorId);
    await deleteDoc(motorRef);
    return true;
  } catch (error) {
    console.error('Error deleting motor:', error);
    toast.error('Erro ao excluir motor');
    return false;
  }
};
