import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { OrdemServico } from "@/types/ordens";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface UseOrdemFetchProps {
  id: string | undefined;
}

export const useOrdemFetch = ({ id }: UseOrdemFetchProps) => {
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const docRef = doc(db, "ordens_servico", id);
    
    const unsubscribe = typeof onSnapshot === 'function' 
    ? onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const ordemData: OrdemServico = {
            id: snapshot.id,
            ...data,
            dataAbertura: data.dataAbertura?.toDate() || new Date(),
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
            servicos: data.servicos || [],
            nome: data.nome || '',
            cliente: data.cliente || {},
            status: data.status || 'orcamento',
            prioridade: data.prioridade || 'media',
            etapasAndamento: data.etapasAndamento || {},
            tempoRegistros: data.tempoRegistros || [],
            timers: data.timers || {}
          };
          setOrdem(ordemData);
        } else {
          setError("Ordem de serviço não encontrada.");
          setOrdem(null);
        }
        setIsLoading(false);
      })
    : () => {};
    
    return () => unsubscribe();
  }, [id, db]);
  
  return { ordem, isLoading, error };
};
