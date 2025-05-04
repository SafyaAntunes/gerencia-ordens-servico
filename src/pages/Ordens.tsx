
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useOrdensData } from "@/hooks/useOrdensData";
import OrdensHeader from "@/components/ordens/OrdensHeader";
import OrdemFilters from "@/components/ordens/OrdemFilters";
import OrdensContent from "@/components/ordens/OrdensContent";

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
    handleReorder
  } = useOrdensData({
    isTecnico,
    funcionarioId: funcionario?.id,
    especialidades: funcionario?.especialidades
  });

  const handleNovaOrdem = () => {
    navigate("/ordens/nova");
  };

  const handleVerOrdem = (id: string) => {
    navigate(`/ordens/${id}`);
  };

  const title = isTecnico 
    ? `Ordens de Serviço - Minhas Especialidades`
    : 'Ordens de Serviço';

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
      />

      <OrdensContent
        loading={loading}
        filteredOrdens={filteredOrdens}
        isTecnico={isTecnico}
        viewType={viewType}
        onReorder={handleReorder}
        onVerOrdem={handleVerOrdem}
      />
    </Layout>
  );
}
