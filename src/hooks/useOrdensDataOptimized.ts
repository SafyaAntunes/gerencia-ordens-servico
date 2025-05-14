
import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, orderBy, where, limit, startAfter, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico } from "@/types/ordens";
import { toast } from "sonner";
import { getOrdensByFuncionarioEspecialidades } from "@/services/funcionarioService";
import { getCollectionWithCache } from "@/services/cacheService";

const ITEMS_PER_PAGE = 20; // Número de itens por página

interface UseOrdensDataProps {
  isTecnico: boolean;
  funcionarioId?: string;
  especialidades?: string[];
  enablePagination?: boolean;
}

export const useOrdensDataOptimized = ({ 
  isTecnico, 
  funcionarioId, 
  especialidades = [],
  enablePagination = false
}: UseOrdensDataProps) => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState("all");
  const [progressoFilter, setProgressoFilter] = useState("all");
  
  // Estados para paginação
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Função para buscar ordens sem sobrecarga do Firestore
  const fetchOrdens = useCallback(async (reset = false) => {
    if (reset) {
      setOrdens([]);
      setLastVisible(null);
      setCurrentPage(1);
      setHasMore(true);
    }
    
    setLoading(true);
    try {
      let ordensData: OrdemServico[] = [];
      
      // Cria uma chave de cache baseada nos parâmetros da consulta
      const cacheKey = `ordens_${isTecnico ? 'tecnico' : 'admin'}_${funcionarioId || 'all'}_${especialidades.join('_')}`;
      
      if (isTecnico && especialidades.length) {
        // Usa cache para especialidades de funcionário
        const { data } = await getCollectionWithCache<OrdemServico>(
          cacheKey,
          async () => await getOrdensByFuncionarioEspecialidades(especialidades) as OrdemServico[]
        );
        ordensData = data;
      } else {
        let baseQuery: any;
        
        // Configuração da consulta com paginação
        if (enablePagination) {
          baseQuery = lastVisible 
            ? query(
                collection(db, "ordens_servico"), 
                orderBy("dataAbertura", "desc"), 
                startAfter(lastVisible),
                limit(ITEMS_PER_PAGE)
              )
            : query(
                collection(db, "ordens_servico"), 
                orderBy("dataAbertura", "desc"),
                limit(ITEMS_PER_PAGE)
              );
        } else {
          baseQuery = query(
            collection(db, "ordens_servico"), 
            orderBy("dataAbertura", "desc")
          );
        }
        
        const { data: cachedOrdens, fromCache } = await getCollectionWithCache<OrdemServico>(
          `${cacheKey}_page_${currentPage}`,
          async () => {
            const querySnapshot = await getDocs(baseQuery);
            
            // Atualiza o último item visível para paginação
            if (enablePagination && querySnapshot.docs.length > 0) {
              const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
              setLastVisible(lastDoc);
              setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
            }
            
            return querySnapshot.docs.map(doc => {
              // Type the document data correctly to avoid TypeScript errors
              const docData = doc.data() as DocumentData;
              
              // Create a properly typed ordem object
              const ordem: OrdemServico = {
                ...docData as any, // Cast to any to avoid spread typing error
                id: doc.id,
                dataAbertura: docData.dataAbertura?.toDate() || new Date(),
                dataPrevistaEntrega: docData.dataPrevistaEntrega?.toDate() || new Date(),
                // Cálculo de progresso otimizado
                progressoEtapas: calculateProgressoEtapas(docData)
              };
              
              return ordem;
            });
          }
        );
        
        ordensData = cachedOrdens;
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
      
      if (reset || !enablePagination) {
        setOrdens(ordensData);
      } else {
        setOrdens(prevOrdens => [...prevOrdens, ...ordensData]);
      }
      
      if (enablePagination) {
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erro ao carregar ordens de serviço.");
    } finally {
      setLoading(false);
    }
  }, [isTecnico, funcionarioId, especialidades, lastVisible, currentPage, enablePagination]);

  // Função de cálculo de progresso otimizada
  const calculateProgressoEtapas = (data: DocumentData) => {
    if (data.progressoEtapas !== undefined) {
      return data.progressoEtapas;
    }
    
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
    
    return etapasConcluidas / etapas.length;
  };

  // Carregar ordens quando o componente for montado
  useEffect(() => {
    fetchOrdens(true); // Reset ao montar
  }, [isTecnico, funcionarioId, especialidades]);

  // Verificar se há um parâmetro "filter=atrasadas" na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    if (filterParam === 'atrasadas') {
      setProgressoFilter('atrasadas');
    }
  }, []);

  const handleReorder = useCallback((dragIndex: number, dropIndex: number) => {
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
  }, [ordens]);

  const refreshOrdens = async () => {
    await fetchOrdens(true);
  };

  // Aplicar filtros de maneira otimizada usando useMemo
  const filteredOrdens = useMemo(() => {
    return ordens.filter((ordem) => {
      if (!ordem) return false;
      
      // Critérios de busca
      const searchLower = search.toLowerCase();
      const searchMatch = 
        (ordem.nome || '').toLowerCase().includes(searchLower) ||
        (ordem.cliente?.nome || '').toLowerCase().includes(searchLower) ||
        (ordem.id || '').toLowerCase().includes(searchLower);
      
      if (!searchMatch) return false;
      
      // Filtro de status
      if (statusFilter !== "all" && ordem.status !== statusFilter) return false;
      
      // Filtro de prioridade
      if (prioridadeFilter !== "all" && ordem.prioridade !== prioridadeFilter) return false;
      
      // Filtro de progresso
      const progresso = ordem.progressoEtapas !== undefined ? ordem.progressoEtapas * 100 : 0;
      
      switch (progressoFilter) {
        case "nao_iniciado":
          if (progresso !== 0) return false;
          break;
        case "em_andamento":
          if (progresso <= 0 || progresso >= 100) return false;
          break;
        case "quase_concluido":
          if (progresso < 75 || progresso >= 100) return false;
          break;
        case "concluido":
          if (progresso !== 100) return false;
          break;
        case "atrasadas":
          const hoje = new Date();
          if (!(ordem.dataPrevistaEntrega < hoje && !['finalizado', 'entregue'].includes(ordem.status))) return false;
          break;
      }

      return true;
    });
  }, [ordens, search, statusFilter, prioridadeFilter, progressoFilter]);

  // Função para carregar mais itens (paginação)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchOrdens();
    }
  }, [fetchOrdens, loading, hasMore]);

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
    refreshOrdens,
    hasMore,
    loadMore
  };
};
