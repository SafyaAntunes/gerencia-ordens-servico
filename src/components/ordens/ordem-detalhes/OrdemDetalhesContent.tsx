import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cliente } from "@/types/clientes";
import { SubAtividade } from "@/types/ordens";
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
import { LoadingOrdem } from "@/components/ordens/detalhes/LoadingOrdem";
import { NotFoundOrdem } from "@/components/ordens/detalhes/NotFoundOrdem";
import { OrdemHeaderCustom } from "@/components/ordens/detalhes/OrdemHeaderCustom";
import { useTrackingSubatividades } from "@/hooks/ordens/useTrackingSubatividades";

interface OrdemDetalhesContentProps {
  id?: string;
  onLogout?: () => void;
}

export function OrdemDetalhesContent({ id, onLogout }: OrdemDetalhesContentProps) {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const { logSubatividadesState } = useTrackingSubatividades();
  const [allAvailableSubatividades, setAllAvailableSubatividades] = useState<Record<string, SubAtividade[]>>({});
  
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
      
      // Pré-carregar todas as subatividades disponíveis
      const loadAllAvailableSubatividades = async () => {
        try {
          console.log("[OrdemDetalhes] Carregando todas as subatividades disponíveis");
          
          // Primeiro, obter todas as subatividades para ter uma visão completa
          const allSubs = await getAllSubatividades();
          console.log("[OrdemDetalhes] Total de subatividades encontradas:", allSubs.length);
          
          // Agrupar por tipo
          const subsByType: Record<string, SubAtividade[]> = {};
          allSubs.forEach(sub => {
            if (!subsByType[sub.tipoServico]) {
              subsByType[sub.tipoServico] = [];
            }
            
            // Adicionar com selecionada=false por padrão
            subsByType[sub.tipoServico].push({
              ...sub,
              selecionada: false,
              concluida: false
            });
          });
          
          setAllAvailableSubatividades(subsByType);
          console.log("[OrdemDetalhes] Subatividades agrupadas por tipo:", 
            Object.entries(subsByType).map(([tipo, subs]) => ({ 
              tipo, 
              quantidade: subs.length 
            }))
          );
        } catch (error) {
          console.error("Erro ao carregar todas as subatividades:", error);
          toast.error("Erro ao carregar subatividades");
        }
      };
      
      fetchClientes();
      loadAllAvailableSubatividades();
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

  // CORREÇÃO: Preparar as subatividades para o formulário de edição, carregando TODAS disponíveis
  const prepareSubatividadesForEdit = () => {
    if (!ordem || !ordem.servicos) return {};
    
    console.log("[OrdemDetalhes] Preparando subatividades para o modo de edição");
    
    const servicosSubatividades: Record<string, SubAtividade[]> = {};
    
    ordem.servicos.forEach(servico => {
      const tipoServico = servico.tipo;
      // Obter todas as subatividades que já carregamos anteriormente deste tipo
      const allAvailableForType = allAvailableSubatividades[tipoServico] || [];
      
      // Se temos subatividades existentes na ordem
      if (servico.subatividades && servico.subatividades.length > 0) {
        console.log(`[OrdemDetalhes] Serviço ${tipoServico} tem ${servico.subatividades.length} subatividades.`);
        
        // Map para rastreamento rápido de IDs existentes
        const existingSubIds = new Set();
        
        // Primeiro, adicionar todas as subatividades que já estão na ordem
        const existingSubatividades = servico.subatividades.map(sub => {
          console.log(`[OrdemDetalhes] Subatividade ${sub.nome}: selecionada=${sub.selecionada}, concluida=${sub.concluida}`);
          existingSubIds.add(sub.id);
          
          return {
            ...sub,
            // Definir explicitamente como TRUE para subatividades já na ordem
            selecionada: true
          };
        });
        
        // Segundo, adicionar todas as demais subatividades disponíveis (não selecionadas)
        const additionalSubatividades = allAvailableForType
          .filter(sub => !existingSubIds.has(sub.id))
          .map(sub => ({
            ...sub,
            selecionada: false, // Novas subatividades vêm desmarcadas
            concluida: false
          }));
        
        // Combinar as existentes (selecionadas) com as adicionais (não selecionadas)
        servicosSubatividades[tipoServico] = [
          ...existingSubatividades,
          ...additionalSubatividades
        ];
        
        console.log(`[OrdemDetalhes] ${tipoServico} tem ${servicosSubatividades[tipoServico].length} subatividades:`);
        console.log(`[OrdemDetalhes] Detalhes:`, 
          servicosSubatividades[tipoServico].map(s => ({
            id: s.id,
            nome: s.nome,
            selecionada: s.selecionada,
            concluida: s.concluida
          }))
        );
        
        // Usar nosso hook de debug para logar detalhadamente o estado após processamento
        logSubatividadesState("OrdemDetalhes", tipoServico, servicosSubatividades[tipoServico]);
        
        // Estatísticas para depuração
        const stats = {
          total: servicosSubatividades[tipoServico].length,
          selecionadas: servicosSubatividades[tipoServico].filter(s => s.selecionada === true).length,
          naoSelecionadas: servicosSubatividades[tipoServico].filter(s => s.selecionada === false).length,
          indefinidas: servicosSubatividades[tipoServico].filter(s => s.selecionada === undefined).length,
          concluidas: servicosSubatividades[tipoServico].filter(s => s.concluida).length
        };
        console.log(`[OrdemDetalhes] Estatísticas para ${tipoServico}:`, stats);
      }
      // Caso não tenha subatividades, usar as disponíveis carregadas
      else if (allAvailableForType.length > 0) {
        servicosSubatividades[tipoServico] = allAvailableForType.map(sub => ({
          ...sub,
          selecionada: false, // Todas não selecionadas
          concluida: false
        }));
        
        console.log(`[OrdemDetalhes] Serviço ${tipoServico} não tinha subatividades, adicionando ${allAvailableForType.length} disponíveis como não selecionadas`);
      }
    });
    
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
