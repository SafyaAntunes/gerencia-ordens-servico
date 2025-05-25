
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico } from "@/types/ordens";
import { toast } from "sonner";
import { getOrdensByFuncionarioEspecialidades } from "@/services/funcionarioService";

interface UseOrdensDataProps {
  isTecnico: boolean;
  funcionarioId?: string;
  especialidades?: string[];
}

export const useOrdensData = ({ isTecnico, funcionarioId, especialidades = [] }: UseOrdensDataProps) => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para processar os dados de ordens do Firestore
  const processOrdens = useCallback(async (querySnapshot: any) => {
    try {
      const ordensWithClienteMotores = await Promise.all(
        querySnapshot.docs.map(async (doc: any) => {
          const data = doc.data();
          
          // Handle legacy "fabricacao" status
          if (data.status === "fabricacao") {
            data.status = "executando_servico";
          }
          
          if (data.cliente && data.cliente.id) {
            try {
              const motoresRef = collection(db, `clientes/${data.cliente.id}/motores`);
              const motoresSnapshot = await getDocs(motoresRef);
              const motores = motoresSnapshot.docs.map(motorDoc => ({
                id: motorDoc.id,
                ...motorDoc.data()
              }));
              
              data.cliente.motores = motores;
            } catch (error) {
              console.error("Erro ao carregar motores do cliente:", error);
            }
          }
          
          let progressoEtapas = data.progressoEtapas;
          
          if (progressoEtapas === undefined) {
            let etapas = ["lavagem", "inspecao_inicial"];
            
            if (data.servicos?.some((s: any) => 
              ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo))) {
              etapas.push("retifica");
            }
            
            if (data.servicos?.some((s: any) => s.tipo === "montagem")) {
              etapas.push("montagem");
            }
            
            if (data.servicos?.some((s: any) => s.tipo === "dinamometro")) {
              etapas.push("dinamometro");
            }
            
            etapas.push("inspecao_final");
            
            const etapasAndamento = data.etapasAndamento || {};
            const etapasConcluidas = etapas.filter(etapa => 
              etapasAndamento[etapa]?.concluido
            ).length;
            
            progressoEtapas = etapasConcluidas / etapas.length;
          }
          
          return {
            ...data,
            id: doc.id,
            dataAbertura: data.dataAbertura?.toDate() || new Date(),
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
            progressoEtapas: progressoEtapas
          } as OrdemServico;
        })
      );
      
      // Tenta recuperar a ordem personalizada do localStorage
      const savedOrder = localStorage.getItem('ordens-custom-order');
      if (savedOrder) {
        try {
          const orderMap = JSON.parse(savedOrder);
          // Ordena as ordens conforme a ordem salva
          ordensWithClienteMotores.sort((a, b) => {
            const orderA = orderMap[a.id] !== undefined ? orderMap[a.id] : 999999;
            const orderB = orderMap[b.id] !== undefined ? orderMap[b.id] : 999999;
            return orderA - orderB;
          });
        } catch (error) {
          console.error("Erro ao aplicar ordem personalizada:", error);
        }
      }
      
      setOrdens(ordensWithClienteMotores);
      setLoading(false);
    } catch (error) {
      console.error("Error processing orders:", error);
      toast.error("Erro ao processar ordens de serviço.");
      setLoading(false);
    }
  }, []);

  // Configurar o listener em tempo real
  useEffect(() => {
    setLoading(true);
    
    // Função para configurar o listener baseado no tipo de usuário
    const setupOrdensListener = async () => {
      try {
        if (isTecnico && especialidades?.length) {
          // Para técnicos, continuamos usando a abordagem baseada em especialidades
          const especialidadesOrdens = await getOrdensByFuncionarioEspecialidades(especialidades);
          setOrdens(especialidadesOrdens as OrdemServico[]);
          setLoading(false);
        } else {
          // Para outros usuários, configuramos um listener em tempo real
          const q = query(collection(db, "ordens_servico"), orderBy("dataAbertura", "desc"));
          
          // Configurar o listener que atualiza em tempo real
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            processOrdens(querySnapshot);
          }, (error) => {
            console.error("Erro ao ouvir mudanças nas ordens:", error);
            toast.error("Erro ao atualizar ordens de serviço em tempo real.");
            setLoading(false);
          });
          
          // Limpar o listener quando o componente for desmontado
          return () => unsubscribe();
        }
      } catch (error) {
        console.error("Error setting up orders listener:", error);
        toast.error("Erro ao configurar atualizações em tempo real.");
        setLoading(false);
      }
    };
    
    setupOrdensListener();
  }, [isTecnico, funcionarioId, especialidades, processOrdens]);

  const handleReorder = (dragIndex: number, dropIndex: number) => {
    const reorderedOrdens = [...ordens];
    const [draggedItem] = reorderedOrdens.splice(dragIndex, 1);
    reorderedOrdens.splice(dropIndex, 0, draggedItem);
    setOrdens(reorderedOrdens);
    
    // Salva a nova ordem no localStorage
    const orderMap: Record<string, number> = {};
    reorderedOrdens.forEach((ordem, index) => {
      orderMap[ordem.id] = index;
    });
    localStorage.setItem('ordens-custom-order', JSON.stringify(orderMap));
  };

  const refreshOrdens = async () => {
    // Esta função não é mais necessária para usuários não técnicos, pois o listener já atualiza
    // Apenas mantemos para compatibilidade com código existente e para usuários técnicos
    if (isTecnico && especialidades?.length) {
      setLoading(true);
      try {
        const especialidadesOrdens = await getOrdensByFuncionarioEspecialidades(especialidades);
        setOrdens(especialidadesOrdens as OrdemServico[]);
      } catch (error) {
        console.error("Error refreshing orders:", error);
        toast.error("Erro ao atualizar ordens de serviço.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Nova lógica de filtragem simplificada - apenas retorna todas as ordens
  const filteredOrdens = ordens.filter((ordem) => {
    return ordem ? true : false;
  });

  return {
    ordens,
    filteredOrdens,
    loading,
    handleReorder,
    refreshOrdens
  };
};
