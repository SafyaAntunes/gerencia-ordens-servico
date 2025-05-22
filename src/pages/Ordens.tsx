
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useOrdensData } from "@/hooks/useOrdensData";
import OrdensHeader from "@/components/ordens/OrdensHeader";
import OrdemFilters from "@/components/ordens/OrdemFilters";
import OrdensContent from "@/components/ordens/OrdensContent";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface OrdensProps {
  onLogout?: () => void;
}

export default function Ordens({ onLogout }: OrdensProps) {
  const navigate = useNavigate();
  const { funcionario } = useAuth();
  const isTecnico = funcionario?.nivelPermissao === 'tecnico';
  
  // Set view type with local storage persistence
  const [viewType, setViewType] = useState<"grid" | "list">(() => {
    const savedViewType = localStorage.getItem("ordens-view-type");
    return (savedViewType as "grid" | "list") || "grid";
  });

  // Define prazo filter state
  const [prazoFilter, setPrazoFilter] = useState<string>("all");

  // Save view preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("ordens-view-type", viewType);
  }, [viewType]);

  // Use custom hook for ordem data and filtering
  const {
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
  } = useOrdensData({
    isTecnico,
    funcionarioId: funcionario?.id,
    especialidades: funcionario?.especialidades
  });

  // Aplicar filtro de prazo às ordens já filtradas
  const ordensFiltradas = filteredOrdens.filter(ordem => {
    if (prazoFilter === "all") return true;
    
    const hoje = new Date();
    const isAtrasada = ordem.dataPrevistaEntrega < hoje && !['finalizado', 'entregue'].includes(ordem.status);
    
    return prazoFilter === "atrasada" ? isAtrasada : !isAtrasada;
  });

  const handleNovaOrdem = () => {
    navigate("/ordens/nova");
  };

  const handleVerOrdem = (id: string) => {
    navigate(`/ordens/${id}`);
  };

  const handleDeleteOrdens = async (ids: string[]) => {
    // Verificar permissão do usuário
    if (funcionario?.nivelPermissao !== 'admin' && funcionario?.nivelPermissao !== 'gerente') {
      toast.error("Você não tem permissão para excluir ordens de serviço");
      return;
    }

    try {
      // Usar Promise.all para excluir todas as ordens em paralelo
      await Promise.all(
        ids.map(async (id) => {
          const ordemRef = doc(db, "ordens_servico", id);
          await deleteDoc(ordemRef);
        })
      );
      
      // Atualizar a lista de ordens
      await refreshOrdens();
      
      toast.success(`${ids.length} ${ids.length === 1 ? 'ordem excluída' : 'ordens excluídas'} com sucesso`);
    } catch (error) {
      console.error("Erro ao excluir ordens:", error);
      toast.error("Erro ao excluir ordens de serviço");
    }
  };

  const title = isTecnico 
    ? `Ordens de Serviço - Minhas Especialidades`
    : 'Ordens de Serviço';

  // Log para debug dos filtros
  console.log("Status filters aplicados:", statusFilter);

  return (
    <Layout onLogout={onLogout}>
      <OrdensHeader
        title={title}
        isTecnico={isTecnico}
        viewType={viewType}
        onViewTypeChange={setViewType}
        onNovaOrdem={handleNovaOrdem}
      />

      <OrdemFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        prioridadeFilter={prioridadeFilter}
        setPrioridadeFilter={setPrioridadeFilter}
        progressoFilter={progressoFilter}
        setProgressoFilter={setProgressoFilter}
        prazoFilter={prazoFilter}
        setPrazoFilter={setPrazoFilter}
      />

      <OrdensContent
        loading={loading}
        filteredOrdens={ordensFiltradas}
        isTecnico={isTecnico}
        viewType={viewType}
        onReorder={handleReorder}
        onVerOrdem={handleVerOrdem}
        onDeleteOrdens={handleDeleteOrdens}
      />
    </Layout>
  );
}
