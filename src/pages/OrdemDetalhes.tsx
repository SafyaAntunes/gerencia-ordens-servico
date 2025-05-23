
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { LogoutProps } from "@/types/props";
import { useAuth } from "@/hooks/useAuth";
import { useOrdemDetalhes } from "@/hooks/useOrdemDetalhes";
import OrdemForm from "@/components/ordens/OrdemForm";
import { OrdemTabs } from "@/components/ordens/detalhes/OrdemTabs";
import { DeleteOrdemDialog } from "@/components/ordens/detalhes/DeleteOrdemDialog";
import { LoadingOrdem } from "@/components/ordens/detalhes/LoadingOrdem";
import { NotFoundOrdem } from "@/components/ordens/detalhes/NotFoundOrdem";
import { OrdemHeaderCustom } from "@/components/ordens/detalhes/OrdemHeaderCustom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Cliente } from "@/types/clientes";
import { toast } from "sonner";
import { loadOrderFormData } from "@/services/ordemService";

interface OrdemDetalhesProps extends LogoutProps {}

export default function OrdemDetalhes({ onLogout }: OrdemDetalhesProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { funcionario, canEditOrder } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  
  const {
    ordem,
    isLoading,
    isSubmitting,
    activeTab,
    isEditando,
    deleteDialogOpen,
    setActiveTab,
    setIsEditando,
    setDeleteDialogOpen,
    handleOrdemUpdate,
    handleSubmit,
    handleDelete,
    handleStatusChange,
  } = useOrdemDetalhes(id);

  const canEditThisOrder = ordem ? canEditOrder(ordem.id) : false;
  
  // Carregar clientes quando entrar no modo de edição
  useEffect(() => {
    if (isEditando) {
      const fetchClientes = async () => {
        setIsLoadingClientes(true);
        try {
          const { clientes } = await loadOrderFormData();
          setClientes(clientes);
        } catch (error) {
          console.error("Erro ao buscar clientes:", error);
          toast.error("Erro ao carregar lista de clientes");
        } finally {
          setIsLoadingClientes(false);
        }
      };
      
      fetchClientes();
    }
  }, [isEditando]);

  if (isLoading) {
    return (
      <Layout>
        <LoadingOrdem />
      </Layout>
    );
  }
  
  if (!ordem) {
    return (
      <Layout>
        <NotFoundOrdem />
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/ordens")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        
        <OrdemHeaderCustom 
          id={ordem.id}
          nome={ordem.nome}
          canEdit={!isEditando && canEditThisOrder}
          onEditClick={() => setIsEditando(true)}
          onDeleteClick={() => setDeleteDialogOpen(true)}
          ordem={ordem}
        />
      </div>

      {isEditando ? (
        <OrdemForm 
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          onCancel={() => setIsEditando(false)}
          clientes={clientes}
          isLoadingClientes={isLoadingClientes}
          initialData={{
            id: ordem.id,
            nome: ordem.nome,
            cliente: ordem.cliente,
            motorId: ordem.motorId || "",
            dataAbertura: ordem.dataAbertura ? new Date(ordem.dataAbertura) : new Date(),
            dataPrevistaEntrega: ordem.dataPrevistaEntrega ? new Date(ordem.dataPrevistaEntrega) : new Date(),
            prioridade: ordem.prioridade || "media",
            servicos: ordem.servicos || [],
            fotosEntrada: ordem?.fotosEntrada || [],
            fotosSaida: ordem?.fotosSaida || []
          }}
        />
      ) : (
        <OrdemTabs
          ordem={ordem}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onStatusChange={handleStatusChange}
          onOrdemUpdate={handleOrdemUpdate}
        />
      )}
      
      <DeleteOrdemDialog
        isOpen={deleteDialogOpen}
        isDeleting={isSubmitting}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </Layout>
  );
}
