
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { OrdemServico } from "@/types/ordens";
import { SetOrdemFunction } from "./types";
import { Timestamp } from "firebase/firestore";

export const useOrdemFetch = (id: string | undefined) => {
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para processar os dados da ordem
  const processOrdemData = useCallback((doc: any) => {
    if (doc.exists()) {
      const data = doc.data();
      
      // Convert Firestore Timestamps to JavaScript Date objects
      const ordemData = {
        id: doc.id,
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
  }, []);

  // Configurar listener para uma ordem específica
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const orderRef = doc(db, "ordens_servico", id);
    
    // Configurar listener em tempo real
    const unsubscribe = onSnapshot(orderRef, 
      (docSnapshot) => {
        processOrdemData(docSnapshot);
      },
      (error) => {
        console.error("Erro ao ouvir mudanças na ordem:", error);
        setIsLoading(false);
      }
    );
    
    // Limpar listener quando o componente desmontar
    return () => unsubscribe();
  }, [id, processOrdemData]);
  
  const fetchMotorDetails = useCallback(async () => {
    // This function is simplified to match what useOrdemDetalhes expects
    // It should fetch motor details if needed
    if (ordem?.motorId) {
      // Motor fetching logic would go here
      console.log("Atualizando detalhes do motor:", ordem.motorId);
    }
  }, [ordem?.motorId]);

  return {
    ordem,
    setOrdem,
    isLoading,
    fetchMotorDetails,
  };
};
