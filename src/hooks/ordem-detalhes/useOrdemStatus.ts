
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { toast } from "sonner";

export const useOrdemStatus = (id: string | undefined, setOrdem: (ordem: OrdemServico | null) => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (newStatus: StatusOS) => {
    if (!id) return;
    
    try {
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
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    handleStatusChange
  };
};
