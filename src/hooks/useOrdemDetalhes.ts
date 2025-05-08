
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Cliente } from "@/types/ordens";
import { getClientes } from "@/services/clienteService";
import { getOrdem, updateOrdem, deleteOrdem } from "@/services/ordemService";

export function useOrdemDetalhes(id?: string) {
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("detalhes");
  const [isEditando, setIsEditando] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (id) {
          const ordemData = await getOrdem(id);
          if (ordemData) {
            setOrdem(ordemData);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar ordem:", error);
        toast.error("Não foi possível carregar os dados da ordem");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    // Carregar clientes quando estiver no modo de edição
    if (isEditando) {
      const fetchClientes = async () => {
        setIsLoadingClientes(true);
        try {
          const clientesData = await getClientes();
          setClientes(clientesData);
        } catch (error) {
          console.error("Erro ao buscar clientes:", error);
          toast.error("Não foi possível carregar a lista de clientes");
        } finally {
          setIsLoadingClientes(false);
        }
      };
      
      fetchClientes();
    }
  }, [isEditando]);

  const handleOrdemUpdate = (ordemAtualizada: any) => {
    setOrdem(ordemAtualizada);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const ordemAtualizada = {
        ...ordem,
        ...data,
        // Adicione aqui outras transformações necessárias
      };

      await updateOrdem(ordemAtualizada);
      setOrdem(ordemAtualizada);
      setIsEditando(false);
      toast.success("Ordem de serviço atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteOrdem(id as string);
      navigate("/ordens");
      toast.success("Ordem de serviço excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir ordem:", error);
      toast.error("Erro ao excluir ordem de serviço");
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ordem) return;

    setIsSubmitting(true);
    try {
      const ordemAtualizada = {
        ...ordem,
        status: newStatus,
      };

      await updateOrdem(ordemAtualizada);
      setOrdem(ordemAtualizada);
      toast.success("Status da ordem atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status da ordem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ordem,
    isLoading,
    isSubmitting,
    activeTab,
    isEditando,
    deleteDialogOpen,
    clientes,
    isLoadingClientes,
    setActiveTab,
    setIsEditando,
    setDeleteDialogOpen,
    handleOrdemUpdate,
    handleSubmit,
    handleDelete,
    handleStatusChange,
  };
}
