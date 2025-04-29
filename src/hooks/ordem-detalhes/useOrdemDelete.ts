
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";

export const useOrdemDelete = (id: string | undefined) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      const orderRef = doc(db, "ordens_servico", id);
      await deleteDoc(orderRef);
      
      toast.success("Ordem de serviço excluída com sucesso!");
      navigate("/ordens");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Erro ao excluir ordem de serviço");
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  return {
    isSubmitting,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDelete
  };
};
