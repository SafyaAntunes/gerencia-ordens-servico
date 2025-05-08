
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { OrdemServico } from "@/types/ordens";
import { toast } from "sonner";
import { SetOrdemFunction } from "./types";

// Função utilitária para converter valores que podem ser timestamps
const processarData = (valor: any): Date => {
  if (!valor) return new Date();
  
  // Se já for um Date, retorna diretamente
  if (valor instanceof Date) return valor;
  
  // Se for um timestamp do Firestore com método toDate()
  if (valor && typeof valor.toDate === 'function') {
    return valor.toDate();
  }
  
  // Se for um timestamp em segundos (número)
  if (typeof valor === 'number') {
    return new Date(valor * 1000);
  }
  
  // Se for um timestamp em milissegundos ou string ISO
  try {
    return new Date(valor);
  } catch (error) {
    console.error("Erro ao converter data:", error, valor);
    return new Date();
  }
};

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
        
        // Processar datas com segurança
        const dataAbertura = processarData(data.dataAbertura);
        const dataPrevistaEntrega = processarData(data.dataPrevistaEntrega);
        
        // Processar datas dentro de etapasAndamento
        const etapasProcessadas = { ...data.etapasAndamento };
        if (etapasProcessadas) {
          Object.keys(etapasProcessadas).forEach(etapaKey => {
            const etapa = etapasProcessadas[etapaKey];
            if (etapa) {
              // Processar datas de início e fim
              if (etapa.iniciado) {
                etapa.iniciado = processarData(etapa.iniciado);
              }
              if (etapa.finalizado) {
                etapa.finalizado = processarData(etapa.finalizado);
              }
            }
          });
        }
        
        // Processar datas de conclusão nos serviços
        const servicosProcessados = data.servicos?.map((servico: any) => {
          const servicoProcessado = { ...servico };
          
          if (servicoProcessado.dataConclusao) {
            servicoProcessado.dataConclusao = processarData(servicoProcessado.dataConclusao);
          }
          
          return {
            ...servicoProcessado,
            subatividades: Array.isArray(servicoProcessado.subatividades) 
              ? servicoProcessado.subatividades 
              : []
          };
        }) || [];
        
        // Processar registros de tempo
        const tempoRegistrosProcessados = data.tempoRegistros?.map((registro: any) => {
          return {
            ...registro,
            inicio: processarData(registro.inicio),
            fim: registro.fim ? processarData(registro.fim) : undefined,
            pausas: registro.pausas?.map((pausa: any) => ({
              ...pausa,
              inicio: pausa.inicio ? processarData(pausa.inicio) : undefined,
              fim: pausa.fim ? processarData(pausa.fim) : undefined,
            })) || []
          };
        }) || [];
        
        const ordemFormatada: OrdemServico = {
          ...data,
          id: docSnap.id,
          nome: data.nome || "", // Garantir que nome existe
          prioridade: data.prioridade || "media", // Valor padrão para prioridade
          status: data.status || "fabricacao", // Valor padrão para status
          cliente: clienteData,
          dataAbertura,
          dataPrevistaEntrega,
          etapasAndamento: etapasProcessadas,
          servicos: servicosProcessados,
          tempoRegistros: tempoRegistrosProcessados
        };
        
        console.log("Ordem formatada com sucesso:", ordemFormatada);
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
