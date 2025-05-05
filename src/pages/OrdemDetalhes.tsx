
import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { LogoutProps } from "@/types/props";
import { useAuth } from "@/hooks/useAuth";
import { SubAtividade } from "@/types/ordens";
import { useOrdemDetalhes } from "@/hooks/useOrdemDetalhes";
import OrdemForm from "@/components/ordens/OrdemForm";
import { OrdemTabs } from "@/components/ordens/detalhes/OrdemTabs";
import { DeleteOrdemDialog } from "@/components/ordens/detalhes/DeleteOrdemDialog";
import { LoadingOrdem } from "@/components/ordens/detalhes/LoadingOrdem";
import { NotFoundOrdem } from "@/components/ordens/detalhes/NotFoundOrdem";
import { OrdemHeaderCustom } from "@/components/ordens/detalhes/OrdemHeaderCustom";

interface OrdemDetalhesProps extends LogoutProps {}

export default function OrdemDetalhes({ onLogout }: OrdemDetalhesProps) {
  const { id } = useParams();
  const { funcionario, canEditOrder } = useAuth();
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
      <OrdemHeaderCustom 
        id={ordem.id}
        nome={ordem.nome}
        canEdit={!isEditando && canEditThisOrder}
        onEditClick={() => setIsEditando(true)}
        onDeleteClick={() => setDeleteDialogOpen(true)}
        ordem={ordem}
      />

      {isEditando ? (
        <OrdemForm 
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          defaultValues={{
            id: ordem.id,
            nome: ordem.nome,
            clienteId: ordem.cliente?.id || "",
            motorId: ordem.motorId || "",
            dataAbertura: ordem.dataAbertura ? new Date(ordem.dataAbertura) : new Date(),
            dataPrevistaEntrega: ordem.dataPrevistaEntrega ? new Date(ordem.dataPrevistaEntrega) : new Date(),
            prioridade: ordem.prioridade || "media",
            servicosTipos: ordem.servicos?.map(s => s.tipo) || [],
            servicosDescricoes: ordem.servicos?.reduce((acc, s) => {
              acc[s.tipo] = s.descricao;
              return acc;
            }, {} as Record<string, string>) || {},
            servicosSubatividades: ordem.servicos?.reduce((acc, s) => {
              if (s.subatividades) {
                acc[s.tipo] = s.subatividades;
              }
              return acc;
            }, {} as Record<string, SubAtividade[]>) || {}
          }}
          defaultFotosEntrada={ordem?.fotosEntrada || []}
          defaultFotosSaida={ordem?.fotosSaida || []}
          onCancel={() => setIsEditando(false)}
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
