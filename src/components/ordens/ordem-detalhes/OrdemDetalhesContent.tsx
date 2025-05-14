import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cliente } from "@/types/clientes";
import { Motor, Ordem, OrdemServico, SubAtividade } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { loadOrderFormData } from "@/services/ordemService";
import { getAllSubatividades } from "@/services/subatividadeService";
import { OrdemDetailsTabs } from "./OrdemDetailsTabs";
import { OrdemFormWrapper } from "./OrdemFormWrapper";
import { BackButton } from "./BackButton";
import { useOrdemDetalhes } from "@/hooks/useOrdemDetalhes";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DeleteOrdemDialog } from "@/components/ordens/detalhes/DeleteOrdemDialog";
import { NotFoundOrdem } from "@/components/ordens/detalhes/NotFoundOrdem";
import { OrdemHeaderCustom } from "@/components/ordens/detalhes/OrdemHeaderCustom";
import { useTrackingSubatividades } from "@/hooks/ordens/useTrackingSubatividades";

interface OrdemDetalhesContentProps {
  id?: string;
  onLogout?: () => void;
}

export function OrdemDetalhesContent({ id, onLogout }: OrdemDetalhesContentProps) {
  const navigate = useNavigate();
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
    canEditThisOrder
  } = useOrdemDetalhes(id);

  const { logSubatividadesState } = useTrackingSubatividades();

  useEffect(() => {
    if (id && !isLoading && !ordem) {
      toast.error(`Ordem com ID ${id} não encontrada`);
    }
  }, [id, isLoading, ordem]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!ordem && id) {
    return <NotFoundOrdem ordemId={id} />;
  }

  if (!ordem) {
    return <div>Nenhuma ordem selecionada.</div>;
  }

  return (
    <OrdemFormWrapper
      isEditando={isEditando}
      canEditThisOrder={canEditThisOrder}
      onEditToggle={setIsEditando}
      headerContent={
        <OrdemHeaderCustom
          ordem={ordem}
          isEditando={isEditando}
          canEditThisOrder={canEditThisOrder}
          onLogout={onLogout}
          onDelete={() => setDeleteDialogOpen(true)}
          onStatusChange={handleStatusChange}
        />
      }
      formContent={
        <OrdemDetailsTabs
          ordem={ordem}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onStatusChange={handleStatusChange}
          onOrdemUpdate={handleOrdemUpdate}
        />
      }
      footerContent={
        <>
          <BackButton navigate={navigate} />
          {isEditando && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditando(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          {isEditando && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Salvar
            </Button>
          )}
        </>
      }
    >
      <DeleteOrdemDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onConfirm={handleDelete}
        ordemId={ordem.id}
      />
    </OrdemFormWrapper>
  );
}
