
import { getClientes } from "./clienteService";
import { Cliente } from "@/types/clientes";
import { toast } from "sonner";

export const loadOrderFormData = async (): Promise<{
  clientes: Cliente[];
  isLoadingClientes: boolean;
}> => {
  let clientes: Cliente[] = [];
  let isLoadingClientes = true;
  
  try {
    const clientes = await getClientes();
    return { 
      clientes, 
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
