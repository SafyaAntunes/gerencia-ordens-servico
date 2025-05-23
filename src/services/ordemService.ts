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

export const getOrdens = async (): Promise<OrdemServico[]> => {
  try {
    const ordensRef = collection(db, 'ordens_servico');
    const snapshot = await getDocs(ordensRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OrdemServico));
  } catch (error) {
    console.error('Error fetching ordens:', error);
    throw error;
  }
};
