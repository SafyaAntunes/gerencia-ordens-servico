
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
    const clientesData = await getClientes();
    clientes = clientesData;
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    toast.error("Erro ao carregar lista de clientes");
  } finally {
    isLoadingClientes = false;
  }
  
  return { clientes, isLoadingClientes };
};
