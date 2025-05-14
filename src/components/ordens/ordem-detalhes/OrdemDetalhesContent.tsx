
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
  
  // Carrega dados de clientes e outros para o formulário de edição
  useEffect(() => {
    const fetchFormData = async () => {
      if (isEditando) {
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
  }, [isEditando]);

  // Função para preparar subatividades para edição
  const prepareSubatividadesForEdit = () => {
    if (!ordem || !ordem.servicos) return {};
    
    // Criação de um objeto para mapear tipos de serviço para suas subatividades
    const result: Record<string, SubAtividade[]> = {};
    
    // Para cada serviço na ordem, adicione suas subatividades ao objeto resultado
    ordem.servicos.forEach(servico => {
      if (servico.subatividades && Array.isArray(servico.subatividades)) {
        // Garantir que todas as subatividades tenham a propriedade selecionada definida
        result[servico.tipo] = servico.subatividades.map(sub => ({
          ...sub,
          selecionada: true // Para edição, todas as subatividades existentes são consideradas selecionadas
        }));
        
        console.log(`[OrdemDetalhesContent] Preparadas ${result[servico.tipo].length} subatividades para o serviço ${servico.tipo}`);
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
    
    // Esta função seria implementada se precisássemos manipular o estado das subatividades durante a edição,
    // mas como estamos usando o OrdemFormWrapper que já gerencia isso internamente, não precisamos implementar aqui
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

  const handleVoltar = () => {
    if (isEditando) {
      // Se estiver editando, pergunte antes de cancelar
      if (confirm("Deseja cancelar a edição? As alterações não salvas serão perdidas.")) {
        setIsEditando(false);
      }
    } else {
      navigate(-1);
    }
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
      
      {isEditando ? (
        <div className="mt-6">
          <OrdemFormWrapper
            ordem={ordem}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => setIsEditando(false)}
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
