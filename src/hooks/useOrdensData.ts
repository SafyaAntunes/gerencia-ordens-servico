import { useState, useEffect, useCallback } from "react";
import { collection, query, where, orderBy, getDocs, onSnapshot, Timestamp, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type OrdemFiltros = {
  status?: StatusOS | 'todas';
  clienteId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  prioridade?: string;
  busca?: string;
  limite?: number;
};

export const useOrdensData = (filtros: OrdemFiltros = {}) => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { funcionario } = useAuth();
  
  // Determine if we can load data based on user permissions
  const canLoad = !!funcionario;
  
  // Format data for Firestore query
  const formatDate = (date: Date) => {
    return Timestamp.fromDate(new Date(date));
  };
  
  // Function to convert Firestore data to OrdemServico
  const convertToOrdemServico = useCallback((doc: any): OrdemServico => {
    const data = doc.data();
    
    // Handle dates
    const dataAbertura = data.dataAbertura?.toDate ? data.dataAbertura.toDate() : new Date();
    const dataPrevistaEntrega = data.dataPrevistaEntrega?.toDate ? data.dataPrevistaEntrega.toDate() : null;
    
    // Handle servicos array
    const servicos = Array.isArray(data.servicos) ? data.servicos.map((servico: any) => ({
      ...servico,
      dataConclusao: servico.dataConclusao?.toDate ? servico.dataConclusao.toDate() : null
    })) : [];
    
    // Handle etapasAndamento
    const etapasAndamento = data.etapasAndamento || {};
    Object.keys(etapasAndamento).forEach(key => {
      const etapa = etapasAndamento[key];
      if (etapa) {
        if (etapa.iniciado?.toDate) {
          etapa.iniciado = etapa.iniciado.toDate();
        }
        if (etapa.finalizado?.toDate) {
          etapa.finalizado = etapa.finalizado.toDate();
        }
      }
    });
    
    // Handle tempoRegistros
    const tempoRegistros = Array.isArray(data.tempoRegistros) ? data.tempoRegistros.map((registro: any) => ({
      ...registro,
      inicio: registro.inicio?.toDate ? registro.inicio.toDate() : new Date(),
      fim: registro.fim?.toDate ? registro.fim.toDate() : null,
      pausas: Array.isArray(registro.pausas) ? registro.pausas.map((pausa: any) => ({
        ...pausa,
        inicio: pausa.inicio?.toDate ? pausa.inicio.toDate() : new Date(),
        fim: pausa.fim?.toDate ? pausa.fim.toDate() : null
      })) : []
    })) : [];
    
    return {
      id: doc.id,
      ...data,
      dataAbertura,
      dataPrevistaEntrega,
      servicos,
      etapasAndamento,
      tempoRegistros
    } as OrdemServico;
  }, []);
  
  // Function to filter ordens based on search term
  const filterOrdensBySearchTerm = useCallback((ordens: OrdemServico[], searchTerm: string): OrdemServico[] => {
    if (!searchTerm) return ordens;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return ordens.filter(ordem => {
      // Search in ordem name
      if (ordem.nome.toLowerCase().includes(lowerSearchTerm)) return true;
      
      // Search in cliente name
      if (ordem.cliente?.nome?.toLowerCase().includes(lowerSearchTerm)) return true;
      
      // Search in ordem ID
      if (ordem.id.toLowerCase().includes(lowerSearchTerm)) return true;
      
      // Search in motor details
      if (ordem.cliente?.motores?.some(motor => 
        motor.marca?.toLowerCase().includes(lowerSearchTerm) ||
        motor.modelo?.toLowerCase().includes(lowerSearchTerm) ||
        motor.numeroSerie?.toLowerCase().includes(lowerSearchTerm)
      )) return true;
      
      return false;
    });
  }, []);
  
  // Load ordens data
  useEffect(() => {
    if (!canLoad) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query based on filters
      let q = collection(db, "ordens_servico");
      let constraints = [];
      
      // Status filter
      if (filtros.status && filtros.status !== 'todas') {
        constraints.push(where("status", "==", filtros.status));
      }
      
      // Cliente filter
      if (filtros.clienteId) {
        constraints.push(where("cliente.id", "==", filtros.clienteId));
      }
      
      // Date range filter
      if (filtros.dataInicio) {
        constraints.push(where("dataAbertura", ">=", formatDate(filtros.dataInicio)));
      }
      
      if (filtros.dataFim) {
        constraints.push(where("dataAbertura", "<=", formatDate(filtros.dataFim)));
      }
      
      // Prioridade filter
      if (filtros.prioridade && filtros.prioridade !== 'todas') {
        constraints.push(where("prioridade", "==", filtros.prioridade));
      }
      
      // Add ordering
      constraints.push(orderBy("dataAbertura", "desc"));
      
      // Add limit if specified
      if (filtros.limite && filtros.limite > 0) {
        constraints.push(limit(filtros.limite));
      }
      
      // Create the query with all constraints
      q = query(q, ...constraints);
      
      // Execute the query with onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
          const ordensData: OrdemServico[] = [];
          
          querySnapshot.forEach((doc) => {
            const ordem = convertToOrdemServico(doc);
            ordensData.push(ordem);
          });
          
          // Apply search filter client-side if needed
          const filteredOrdens = filtros.busca 
            ? filterOrdensBySearchTerm(ordensData, filtros.busca)
            : ordensData;
          
          setOrdens(filteredOrdens);
        } catch (err) {
          console.error("Error processing ordens data:", err);
          setError("Erro ao processar dados das ordens");
        } finally {
          setLoading(false);
        }
      }, (err) => {
        console.error("Error fetching ordens:", err);
        setError("Erro ao buscar ordens de serviço");
        setLoading(false);
        toast.error("Erro ao carregar ordens de serviço");
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up ordens query:", err);
      setError("Erro ao configurar busca de ordens");
      setLoading(false);
      toast.error("Erro ao configurar busca de ordens");
    }
  }, [filtros, canLoad, convertToOrdemServico, filterOrdensBySearchTerm]);
  
  return { ordens, loading, error };
};
