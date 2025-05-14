import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cliente } from "@/types/clientes";
import { OrdemServico, StatusOS, SubAtividade } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { loadOrderFormData } from "@/services/ordemService";
import { getAllSubatividades } from "@/services/subatividadeService";
import { OrdemDetailsTabs } from "./OrdemDetailsTabs";
import { OrdemFormWrapper } from "./OrdemFormWrapper";
import { BackButton } from "../detalhes/BackButton";
import { useOrdemDetalhes } from "@/hooks/useOrdemDetalhes";
import { DeleteOrdemDialog } from "@/components/ordens/detalhes/DeleteOrdemDialog";
import { NotFoundOrdem } from "@/components/ordens/detalhes/NotFoundOrdem";
import { OrdemHeaderCustom } from "@/components/ordens/detalhes/OrdemHeaderCustom";
import { useTrackingSubatividades } from "@/hooks/ordens/useTrackingSubatividades";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";

interface OrdemDetalhesContentProps {
  id?: string;
  onLogout?: () => void;
}

export function OrdemDetalhesContent({ id, onLogout }: OrdemDetalhesContentProps) {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  
  // Force a local editMode state to ensure we have control over it
  const [editMode, setEditMode] = useState(false);
  
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
  
  console.log("OrdemDetalhesContent render - isEditando:", isEditando);
  console.log("OrdemDetalhesContent render - local editMode:", editMode);
  
  // Keep the local state and hook state in sync
  useEffect(() => {
    if (editMode !== isEditando) {
      console.log("Synchronizing edit states - setting hook state to:", editMode);
      setIsEditando(editMode);
    }
  }, [editMode, setIsEditando]);
  
  // Sync in the other direction as well
  useEffect(() => {
    if (isEditando !== editMode) {
      console.log("Synchronizing edit states - setting local state to:", isEditando);
      setEditMode(isEditando);
    }
  }, [isEditando]);
  
  // Carrega dados de clientes e outros para o formulário de edição
  useEffect(() => {
    const fetchFormData = async () => {
      if (editMode) {
        console.log("Fetching form data for editing");
        setIsLoadingClientes(true);
        try {
          const data = await loadOrderFormData();
          setClientes(data.clientes);
        } catch (error) {
          console.error("Erro ao carregar dados do formulário:", error);
          toast.error("Erro ao carregar dados necessários para edição");
        } finally {
          setIsLoadingClientes(false);
        }
      }
    };
    
    fetchFormData();
  }, [editMode]);

  // Função para preparar subatividades para edição
  const prepareSubatividadesForEdit = () => {
    if (!ordem || !ordem.servicos) return {};
    
    // Criação de um objeto para mapear tipos de serviço para suas subatividades
    const result: Record<string, SubAtividade[]> = {};
    
    // Para cada serviço na ordem, adicione suas subatividades ao objeto resultado
    ordem.servicos.forEach(servico => {
      if (servico.subatividades && Array.isArray(servico.subatividades)) {
        // Garantir que todas as subatividades mantenham seu estado original
        // em vez de automaticamente marcá-las como selecionadas
        result[servico.tipo] = servico.subatividades.map(sub => ({
          ...sub,
          // Manter o estado selecionada como está, sem forçar para true
          selecionada: sub.selecionada !== undefined ? sub.selecionada : false
        }));
        
        console.log(`[OrdemDetalhesContent] Preparadas ${result[servico.tipo].length} subatividades para o serviço ${servico.tipo}`);
        console.log(`[OrdemDetalhesContent] Estado das subatividades: `, 
          result[servico.tipo].map(s => ({ id: s.id, nome: s.nome, selecionada: s.selecionada })));
      } else {
        result[servico.tipo] = [];
        console.log(`[OrdemDetalhesContent] Nenhuma subatividade encontrada para o serviço ${servico.tipo}`);
      }
    });
    
    return result;
  };

  // Função para alternar o estado de uma subatividade
  const handleSubatividadeToggle = (servicoTipo: string, subId: string, checked: boolean) => {
    console.log(`[OrdemDetalhesContent] Alternando subatividade: ${subId} para ${checked ? "selecionada" : "não selecionada"}`);
  };

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

  const handleEditClick = () => {
    console.log("Edit button clicked in OrdemDetalhesContent");
    // Use the local state directly for immediate UI feedback
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    if (confirm("Deseja cancelar a edição? As alterações não salvas serão perdidas.")) {
      console.log("Cancelling edit mode");
      setEditMode(false);
    }
  };

  const handleVoltar = () => {
    if (editMode) {
      handleCancelEdit();
    } else {
      navigate(-1);
    }
  };

  return (
    <div>
      {!editMode && (
        <OrdemHeaderCustom
          id={ordem.id}
          nome={ordem.nome}
          canEdit={canEditThisOrder}
          onEditClick={handleEditClick}
          onDeleteClick={() => setDeleteDialogOpen(true)}
          ordem={ordem}
        />
      )}
      
      {editMode ? (
        <div className="mt-6">
          <OrdemFormWrapper
            ordem={ordem}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={handleCancelEdit}
            onSubatividadeToggle={handleSubatividadeToggle}
            prepareSubatividadesForEdit={prepareSubatividadesForEdit}
            clientes={clientes}
            isLoadingClientes={isLoadingClientes}
          />
        </div>
      ) : (
        <div className="mt-4">
          <OrdemDetailsTabs
            ordem={ordem}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onStatusChange={handleStatusChange}
            onOrdemUpdate={handleOrdemUpdate}
          />
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <BackButton onClick={handleVoltar} />
        
        {editMode && (
          <div className="space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                document.querySelector('form')?.dispatchEvent(
                  new Event('submit', { bubbles: true, cancelable: true })
                );
              }}
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
