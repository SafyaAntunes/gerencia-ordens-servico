import { getClientes } from "./clienteService";
import { Cliente } from "@/types/clientes";
import { toast } from "sonner";
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { OrdemServico } from '@/types/ordens';

export const loadOrderFormData = async (): Promise<{
  clientes: Cliente[];
  isLoadingClientes: boolean;
}> => {
  try {
    const clientesData = await getClientes();
    return { 
      clientes: clientesData, 
      isLoadingClientes: false 
    };
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    toast.error("Erro ao carregar lista de clientes");
    return { 
      clientes: [], 
      isLoadingClientes: false 
    };
  }
};

export const getOrdens = async () => {
  try {
    const ordensRef = collection(db, "ordens_servico");
    const snapshot = await getDocs(ordensRef);
    
    const ordens = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore timestamps to JavaScript Dates
      const dataAbertura = data.dataAbertura?.toDate ? data.dataAbertura.toDate() : data.dataAbertura;
      const dataPrevistaEntrega = data.dataPrevistaEntrega?.toDate ? data.dataPrevistaEntrega.toDate() : data.dataPrevistaEntrega;
      
      return {
        ...data,
        id: doc.id,
        dataAbertura,
        dataPrevistaEntrega
      };
    });
    
    return ordens;
  } catch (error) {
    console.error("Erro ao buscar ordens:", error);
    throw error;
  }
};
