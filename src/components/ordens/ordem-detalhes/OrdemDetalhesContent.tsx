
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cliente } from "@/types/clientes";
import { SubAtividade } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { loadOrderFormData } from "@/services/ordemService";
import { OrdemDetailsTabs } from "./OrdemDetailsTabs";
import { OrdemFormWrapper } from "./OrdemFormWrapper";
import { BackButton } from "./BackButton";
import { useOrdemDetalhes } from "@/hooks/useOrdemDetalhes";
import { DeleteOrdemDialog } from "@/components/ordens/detalhes/DeleteOrdemDialog";
import { LoadingOrdem } from "@/components/ordens/detalhes/LoadingOrdem";
import { NotFoundOrdem } from "@/components/ordens/detalhes/NotFoundOrdem";
import { OrdemHeaderCustom } from "@/components/ordens/detalhes/OrdemHeaderCustom";

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
    return <LoadingOrdem />;
  }
  
  if (!ordem) {
    return <NotFoundOrdem />;
  }

  // Função para lidar com toggles de subatividades durante a edição da ordem
  const handleSubatividadeToggleInEditMode = (servicoTipo: string, subId: string, checked: boolean) => {
    if (!ordem || !isEditando) return;
    
    const servicosAtualizados = ordem.servicos.map(servico => {
      if (servico.tipo === servicoTipo) {
        const subatividadesAtualizadas = servico.subatividades?.map(sub => {
          if (sub.id === subId) {
            return { ...sub, concluida: checked };
          }
          return sub;
        }) || [];
        
        return {
          ...servico,
          subatividades: subatividadesAtualizadas
        };
      }
      return servico;
    });
    
    // Atualiza a ordem localmente
    const ordemAtualizada = {
      ...ordem,
      servicos: servicosAtualizados
    };
    
    // Chama o método para atualizar o estado da ordem
    handleOrdemUpdate(ordemAtualizada);
  };

  // Preparar as subatividades para o formulário de edição, preservando o estado 'selecionada'
  const prepareSubatividadesForEdit = () => {
    if (!ordem || !ordem.servicos) return {};
    
    console.log("[OrdemDetalhes] Preparando subatividades para o modo de edição");
    
    const servicosSubatividades: Record<string, SubAtividade[]> = {};
    ordem.servicos.forEach(servico => {
      if (servico.subatividades && servico.subatividades.length > 0) {
        // Log detalhado para cada serviço e suas subatividades
        console.log(`[OrdemDetalhes] Serviço ${servico.tipo} tem ${servico.subatividades.length} subatividades.`);
        
        // MELHORIA: Garantir que todas as subatividades tenham o estado 'selecionada' explicitamente definido
        // Assumimos que se uma subatividade está na ordem, ela foi selecionada (true por padrão)
        servicosSubatividades[servico.tipo] = servico.subatividades.map(sub => {
          // Log individual para entender o estado de cada subatividade
          console.log(`[OrdemDetalhes] Subatividade ${sub.nome}: selecionada=${sub.selecionada !== undefined ? sub.selecionada : true}, concluida=${sub.concluida}`);
          
          return {
            ...sub,
            // IMPORTANTE: Garantir que todas as subatividades estejam marcadas como selecionadas
            // Se a subatividade está na ordem, ela foi selecionada anteriormente
            selecionada: true
          };
        });
        
        // Log das subatividades preparadas para este serviço
        console.log(`[OrdemDetalhes] Subatividades preparadas para ${servico.tipo}:`, 
          servicosSubatividades[servico.tipo].map(s => ({id: s.id, nome: s.nome, selecionada: s.selecionada, concluida: s.concluida}))
        );
      }
    });
    
    console.log("[OrdemDetalhes] Resultado final das subatividades preparadas:", 
      Object.entries(servicosSubatividades).map(([tipo, subs]) => ({
        tipo, 
        total: subs.length,
        selecionadas: subs.filter(s => s.selecionada).length,
        concluidas: subs.filter(s => s.concluida).length
      }))
    );
    return servicosSubatividades;
  };

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-4">
          <BackButton onClick={() => navigate("/ordens")} />
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
        <OrdemFormWrapper 
          ordem={ordem}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => setIsEditando(false)}
          onSubatividadeToggle={handleSubatividadeToggleInEditMode}
          prepareSubatividadesForEdit={prepareSubatividadesForEdit}
          clientes={clientes}
          isLoadingClientes={isLoadingClientes}
        />
      ) : (
        <OrdemDetailsTabs
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
    </>
  );
}
