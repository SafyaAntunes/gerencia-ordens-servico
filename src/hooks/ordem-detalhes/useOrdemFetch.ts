
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { OrdemServico } from "@/types/ordens";
import { SetOrdemFunction } from "./types";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

export const useOrdemFetch = (id: string | undefined) => {
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { funcionario } = useAuth();

  const fetchOrdem = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    // Check if current user is "Tv" to enable real-time updates
    const isTvUser = funcionario?.email === "tv@retificahidromar.com.br" || 
                    funcionario?.nome?.toLowerCase() === "tv";
    
    try {
      setIsLoading(true);
      const orderRef = doc(db, "ordens_servico", id);

      if (isTvUser) {
        // Use real-time listener for TV user
        return onSnapshot(orderRef, (orderSnap) => {
          if (orderSnap.exists()) {
            const data = orderSnap.data();
            
            // Convert Firestore Timestamps to JavaScript Date objects
            const ordemData = {
              id: orderSnap.id,
              ...data,
              dataAbertura: data.dataAbertura instanceof Timestamp ? data.dataAbertura.toDate() : new Date(),
              dataPrevistaEntrega: data.dataPrevistaEntrega instanceof Timestamp ? data.dataPrevistaEntrega.toDate() : new Date(),
              servicos: data.servicos || [],
              etapasAndamento: data.etapasAndamento || {},
              tempoRegistros: data.tempoRegistros || [],
            } as OrdemServico;
            
            setOrdem(ordemData);
          } else {
            console.error("Ordem não encontrada");
            setOrdem(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Erro ao observar ordem:", error);
          setIsLoading(false);
        });
      } else {
        // Use regular fetch for other users
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          const data = orderSnap.data();
          
          // Convert Firestore Timestamps to JavaScript Date objects
          const ordemData = {
            id: orderSnap.id,
            ...data,
            dataAbertura: data.dataAbertura instanceof Timestamp ? data.dataAbertura.toDate() : new Date(),
            dataPrevistaEntrega: data.dataPrevistaEntrega instanceof Timestamp ? data.dataPrevistaEntrega.toDate() : new Date(),
            servicos: data.servicos || [],
            etapasAndamento: data.etapasAndamento || {},
            tempoRegistros: data.tempoRegistros || [],
          } as OrdemServico;
          
          setOrdem(ordemData);
        } else {
          console.error("Ordem não encontrada");
          setOrdem(null);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro ao carregar ordem:", error);
      setOrdem(null);
      setIsLoading(false);
    }
  }, [id, funcionario]);
  
  const fetchMotorDetails = useCallback(async () => {
    // This function is simplified to match what useOrdemDetalhes expects
    // It should fetch motor details if needed
    if (ordem?.motorId) {
      // Motor fetching logic would go here
      console.log("Atualizando detalhes do motor:", ordem.motorId);
    }
  }, [ordem?.motorId]);

  useEffect(() => {
    const unsubscribe = fetchOrdem();
    
    // Cleanup function to unsubscribe from Firestore listener if it exists
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchOrdem]);

  return {
    ordem,
    setOrdem,
    isLoading,
    fetchMotorDetails,
  };
};
