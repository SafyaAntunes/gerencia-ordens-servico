
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
      
      // Atualizar o status no Firestore
      await updateDoc(orderRef, { status: newStatus });
      
      // A atualização local não é mais necessária já que o listener em tempo real
      // vai atualizar os dados automaticamente, mas mantemos para compatibilidade
      // e para garantir que a UI seja atualizada imediatamente
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
