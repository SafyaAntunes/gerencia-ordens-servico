
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { OrdemServico } from "@/types/ordens";
import { SetOrdemFunction } from "./types";

export const useOrdemFetch = (id: string | undefined) => {
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrdem = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const orderRef = doc(db, "ordens_servico", id);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        const ordemData = { id: orderSnap.id, ...orderSnap.data() } as OrdemServico;
        setOrdem(ordemData);
      } else {
        console.error("Ordem não encontrada");
        setOrdem(null);
      }
    } catch (error) {
      console.error("Erro ao carregar ordem:", error);
      setOrdem(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);
  
  const fetchMotorDetails = useCallback(async () => {
    // This function is simplified to match what useOrdemDetalhes expects
    // It should fetch motor details if needed
    if (ordem?.motorId) {
      // Motor fetching logic would go here
      console.log("Atualizando detalhes do motor:", ordem.motorId);
    }
  }, [ordem?.motorId]);

  useEffect(() => {
    fetchOrdem();
  }, [fetchOrdem]);

  return {
    ordem,
    setOrdem,
    isLoading,
    fetchMotorDetails,
  };
};
