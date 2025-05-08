
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState("all");
  const [progressoFilter, setProgressoFilter] = useState("all");

  const fetchOrdens = useCallback(async () => {
    setLoading(true);
    try {
      let ordensData: OrdemServico[] = [];
      
      if (isTecnico && especialidades.length) {
        const especialidadesOrdens = await getOrdensByFuncionarioEspecialidades(especialidades);
        ordensData = especialidadesOrdens as OrdemServico[];
      } else {
        const q = query(collection(db, "ordens_servico"), orderBy("dataAbertura", "desc"));
        const querySnapshot = await getDocs(q);
        
        const ordensWithClienteMotores = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            
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
        
        ordensData = ordensWithClienteMotores;
      }
      
      // Tenta recuperar a ordem personalizada do localStorage
      const savedOrder = localStorage.getItem('ordens-custom-order');
      if (savedOrder) {
        try {
          const orderMap = JSON.parse(savedOrder);
          // Ordena as ordens conforme a ordem salva
          ordensData.sort((a, b) => {
            const orderA = orderMap[a.id] !== undefined ? orderMap[a.id] : 999999;
            const orderB = orderMap[b.id] !== undefined ? orderMap[b.id] : 999999;
            return orderA - orderB;
          });
        } catch (error) {
          console.error("Erro ao aplicar ordem personalizada:", error);
        }
      }
      
      setOrdens(ordensData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erro ao carregar ordens de serviço.");
    } finally {
      setLoading(false);
    }
  }, [isTecnico, funcionarioId, especialidades]);

  // Carregar ordens quando o componente for montado
  useEffect(() => {
    fetchOrdens();
  }, [fetchOrdens]);

  // Verificar se há um parâmetro "filter=atrasadas" na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    if (filterParam === 'atrasadas') {
      setProgressoFilter('atrasadas');
    }
  }, []);

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
    await fetchOrdens();
  };

  const filteredOrdens = ordens.filter((ordem) => {
    if (!ordem) return false;
    
    const searchMatch = 
      (ordem.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (ordem.cliente?.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (ordem.id || '').toLowerCase().includes(search.toLowerCase());
    
    const statusMatch = statusFilter === "all" ? true : ordem.status === statusFilter;
    const prioridadeMatch = prioridadeFilter === "all" ? true : ordem.prioridade === prioridadeFilter;
    
    let progressoMatch = true;
    const progresso = ordem.progressoEtapas !== undefined ? ordem.progressoEtapas * 100 : 0;
    
    switch (progressoFilter) {
      case "nao_iniciado":
        progressoMatch = progresso === 0;
        break;
      case "em_andamento":
        progressoMatch = progresso > 0 && progresso < 100;
        break;
      case "quase_concluido":
        progressoMatch = progresso >= 75 && progresso < 100;
        break;
      case "concluido":
        progressoMatch = progresso === 100;
        break;
      case "atrasadas":
        const hoje = new Date();
        progressoMatch = ordem.dataPrevistaEntrega < hoje && !['finalizado', 'entregue'].includes(ordem.status);
        break;
      default:
        progressoMatch = true;
    }

    return searchMatch && statusMatch && prioridadeMatch && progressoMatch;
  });

  return {
    ordens,
    filteredOrdens,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    prioridadeFilter,
    setPrioridadeFilter,
    progressoFilter,
    setProgressoFilter,
    handleReorder,
    refreshOrdens
  };
};
