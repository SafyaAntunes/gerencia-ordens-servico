
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cliente } from "@/types/clientes";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { loadOrderFormData } from "@/services/ordemService";
import { getAllSubatividades } from "@/services/subatividadeService";
import { OrdemDetailsTabs } from "./OrdemDetailsTabs";
import { OrdemFormWrapper } from "./OrdemFormWrapper";
import { BackButton } from "./BackButton";
import { useOrdemDetalhes } from "@/hooks/useOrdemDetalhes";
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
    return <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (!ordem && id) {
    return <NotFoundOrdem id={id} />;
  }

  if (!ordem) {
    return <div>Nenhuma ordem selecionada.</div>;
  }

  const handleVoltar = () => {
    navigate(-1);
  };

  return (
    <div>
      <OrdemHeaderCustom
        id={ordem.id}
        nome={ordem.nome}
        canEdit={canEditThisOrder}
        onEditClick={() => setIsEditando(true)}
        onDeleteClick={() => setDeleteDialogOpen(true)}
        ordem={ordem}
      />
      
      <div className="mt-4">
        <OrdemDetailsTabs
          ordem={ordem}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onStatusChange={handleStatusChange}
          onOrdemUpdate={handleOrdemUpdate}
        />
      </div>
      
      <div className="mt-6 flex justify-between">
        <BackButton onClick={handleVoltar} />
        
        {isEditando && (
          <div className="space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditando(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Salvar
            </Button>
          </div>
        )}
      </div>

      <DeleteOrdemDialog
        isOpen={deleteDialogOpen}
        isDeleting={isSubmitting}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}
