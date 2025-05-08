
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
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
        const ordemFormatada: OrdemServico = {
          ...data,
          id: docSnap.id,
          dataAbertura: data.dataAbertura?.toDate() || new Date(),
          dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
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
