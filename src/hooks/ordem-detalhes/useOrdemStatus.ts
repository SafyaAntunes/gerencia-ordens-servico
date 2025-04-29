
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { toast } from "sonner";
import { SetOrdemFunction } from "./types";

export const useOrdemStatus = (id: string | undefined, setOrdem: SetOrdemFunction) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (newStatus: StatusOS) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      const orderRef = doc(db, "ordens_servico", id);
      await updateDoc(orderRef, { status: newStatus });
      
      setOrdem((prevOrdem) => {
        if (!prevOrdem) return null;
        return {
          ...prevOrdem,
          status: newStatus
        };
      });
      
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    handleStatusChange
  };
};
