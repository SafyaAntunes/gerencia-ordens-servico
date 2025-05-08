
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { OrdemServico } from "@/types/ordens";
import { toast } from "sonner";
import { SetOrdemFunction } from "./types";

export const useOrdemFetch = (id: string | undefined) => {
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOrdem();
  }, [id]);

  const fetchOrdem = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, "ordens_servico", id!);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Garantir que temos dados completos do cliente
        let clienteData = data.cliente || {};
        
        // Se temos ID do cliente, buscar dados complementares incluindo motores
        if (clienteData.id) {
          try {
            // Buscar dados atualizados do cliente
            const clienteRef = doc(db, "clientes", clienteData.id);
            const clienteSnap = await getDoc(clienteRef);
            
            if (clienteSnap.exists()) {
              const clienteAtualizado = clienteSnap.data();
              clienteData = { 
                ...clienteData, 
                ...clienteAtualizado,
                id: clienteData.id 
              };
              
              // Buscar motores do cliente
              const motoresRef = collection(db, `clientes/${clienteData.id}/motores`);
              const motoresSnap = await getDocs(motoresRef);
              
              if (!motoresSnap.empty) {
                const motores = motoresSnap.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));
                clienteData.motores = motores;
              }
            }
          } catch (error) {
            console.error("Erro ao buscar dados complementares do cliente:", error);
          }
        }
        
        const ordemFormatada: OrdemServico = {
          ...data,
          id: docSnap.id,
          cliente: clienteData,
          dataAbertura: data.dataAbertura?.toDate() || new Date(),
          dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
          // Garantir que os serviços tenham as subatividades carregadas corretamente
          servicos: data.servicos?.map((servico: any) => ({
            ...servico,
            subatividades: Array.isArray(servico.subatividades) 
              ? servico.subatividades 
              : []
          })) || [],
        } as OrdemServico;
        
        setOrdem(ordemFormatada);
      } else {
        toast.error("Ordem não encontrada");
        navigate("/ordens");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Erro ao carregar dados da ordem");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMotorDetails = async (clienteId: string, motorId: string) => {
    try {
      if (!clienteId || !motorId) return;
      
      const motorRef = doc(db, `clientes/${clienteId}/motores`, motorId);
      const motorDoc = await getDoc(motorRef);
      
      if (motorDoc.exists()) {
        console.log("Motor details fetched successfully");
      }
    } catch (error) {
      console.error("Error fetching motor details:", error);
    }
  };

  return {
    ordem,
    setOrdem: setOrdem as SetOrdemFunction,
    isLoading,
    fetchMotorDetails
  };
};
