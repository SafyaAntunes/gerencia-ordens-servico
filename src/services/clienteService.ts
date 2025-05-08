
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { Cliente, Motor } from "@/types/ordens";

export const getClientes = async (): Promise<Cliente[]> => {
  try {
    const clientesRef = collection(db, "clientes");
    const snapshot = await getDocs(clientesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Cliente[];
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    throw error;
  }
};

export const getCliente = async (id: string): Promise<Cliente | null> => {
  try {
    const clienteRef = doc(db, "clientes", id);
    const snapshot = await getDoc(clienteRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Cliente;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    throw error;
  }
};

export const saveCliente = async (cliente: Cliente): Promise<boolean> => {
  try {
    if (cliente.id) {
      // Atualiza cliente existente
      const clienteRef = doc(db, "clientes", cliente.id);
      await updateDoc(clienteRef, cliente);
    } else {
      // Cria novo cliente
      await addDoc(collection(db, "clientes"), cliente);
    }
    return true;
  } catch (error) {
    console.error("Erro ao salvar cliente:", error);
    return false;
  }
};

export const deleteCliente = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "clientes", id));
    return true;
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return false;
  }
};

export const getMotores = async (clienteId: string): Promise<Motor[]> => {
  try {
    // Primeiro buscar o cliente para verificar se tem motores
    const clienteRef = doc(db, "clientes", clienteId);
    const clienteDoc = await getDoc(clienteRef);
    
    if (!clienteDoc.exists()) {
      return [];
    }
    
    const clienteData = clienteDoc.data();
    return (clienteData.motores || []) as Motor[];
  } catch (error) {
    console.error("Erro ao buscar motores do cliente:", error);
    throw error;
  }
};

export const saveMotor = async (clienteId: string, motor: Motor): Promise<boolean> => {
  try {
    const clienteRef = doc(db, "clientes", clienteId);
    const clienteDoc = await getDoc(clienteRef);
    
    if (!clienteDoc.exists()) {
      return false;
    }
    
    const clienteData = clienteDoc.data();
    const motores = clienteData.motores || [];
    
    if (motor.id) {
      // Atualiza motor existente
      const index = motores.findIndex((m: Motor) => m.id === motor.id);
      if (index >= 0) {
        motores[index] = motor;
      }
    } else {
      // Adiciona novo motor
      motor.id = Date.now().toString();
      motores.push(motor);
    }
    
    await updateDoc(clienteRef, { motores });
    return true;
  } catch (error) {
    console.error("Erro ao salvar motor:", error);
    return false;
  }
};

export const deleteMotor = async (clienteId: string, motorId: string): Promise<boolean> => {
  try {
    const clienteRef = doc(db, "clientes", clienteId);
    const clienteDoc = await getDoc(clienteRef);
    
    if (!clienteDoc.exists()) {
      return false;
    }
    
    const clienteData = clienteDoc.data();
    let motores = clienteData.motores || [];
    
    motores = motores.filter((m: Motor) => m.id !== motorId);
    
    await updateDoc(clienteRef, { motores });
    return true;
  } catch (error) {
    console.error("Erro ao excluir motor:", error);
    return false;
  }
};
