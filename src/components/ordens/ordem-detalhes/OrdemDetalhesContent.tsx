
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrdemDetalhes } from '@/hooks/useOrdemDetalhes';
import EtapasTracker from '@/components/ordens/etapas-tracker/EtapasTracker';
import { OrdemFormWrapper } from './OrdemFormWrapper';
import { OrdemDetailsTabs } from './OrdemDetailsTabs';
import { OrdemHeader } from './OrdemHeader';
import { BackButton } from './BackButton';
import { LoadingOrdem } from '../detalhes/LoadingOrdem';
import { NotFoundOrdem } from '../detalhes/NotFoundOrdem';
import { OrdemHeaderCustom } from '../detalhes/OrdemHeaderCustom';
import { DeleteOrdemDialog } from '@/components/ordens/detalhes/DeleteOrdemDialog';
import OrdemActionButtons from '@/components/ordens/detalhes/OrdemActionButtons';
import { loadOrderFormData } from '@/services/ordemService';
import { useTrackingSubatividades } from '@/hooks/ordens/useTrackingSubatividades';

export const OrdemDetalhesContent: React.FC<{id?: string; onLogout?: () => void}> = ({ id: propId, onLogout }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = propId || paramId;
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);
  
  // Carregar dados de clientes
  useEffect(() => {
    const loadData = async () => {
      const { clientes, isLoadingClientes } = await loadOrderFormData();
      setClientes(clientes);
      setIsLoadingClientes(isLoadingClientes);
    };
    loadData();
  }, []);

  // Hook para gerenciamento de subatividades
  const { 
    prepareSubatividadesForEdit, 
    onSubatividadeToggle 
  } = useTrackingSubatividades();
  
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
  
  // Sincronizar estados de edição
  useEffect(() => {
    setEditMode(isEditando);
  }, [isEditando]);
  
  // Atualizar o estado global quando o estado local mudar
  useEffect(() => {
    if (isEditando !== editMode) {
      setIsEditando(editMode);
    }
  }, [editMode, setIsEditando, isEditando]);

  // Handler para botão voltar
  const handleBack = () => {
    navigate(-1);
  };
  
  // Mostrar indicador de carregamento
  if (isLoading) {
    return <LoadingOrdem />;
  }

  // Mostrar mensagem se a ordem não for encontrada
  if (!ordem) {
    return <NotFoundOrdem />;
  }

  // Renderizar formulário de edição se estiver no modo de edição
  if (editMode) {
    return (
      <div className="container mx-auto px-4 py-6">
        <BackButton onClick={handleBack} />
        <OrdemFormWrapper 
          ordem={ordem} 
          onSubmit={handleSubmit} 
          onCancel={() => setEditMode(false)}
          isSubmitting={isSubmitting}
          onSubatividadeToggle={onSubatividadeToggle}
          prepareSubatividadesForEdit={prepareSubatividadesForEdit}
          clientes={clientes}
          isLoadingClientes={isLoadingClientes}
        />
      </div>
    );
  }

  // Renderizar detalhes da ordem no modo de visualização
  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <BackButton onClick={handleBack} />
      <OrdemHeaderCustom 
        id={ordem.id}
        nome={ordem.nome}
        canEdit={canEditThisOrder}
        onEditClick={() => setEditMode(true)}
        onDeleteClick={() => setDeleteDialogOpen(true)}
        ordem={ordem}
      />
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrdemActionButtons 
            ordem={ordem}
            disabled={isSubmitting}
          />
          <OrdemDetailsTabs 
            ordem={ordem}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onStatusChange={handleStatusChange}
            onOrdemUpdate={handleOrdemUpdate}
          />
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <EtapasTracker
              ordem={ordem}
              onOrdemUpdate={handleOrdemUpdate}
              onFuncionariosChange={(etapa, funcionariosIds, funcionariosNomes, servicoTipo) => {
                console.log("Funcionários alterados:", { etapa, funcionariosIds, funcionariosNomes, servicoTipo });
              }}
            />
          </div>
        </div>
      </div>
      
      <DeleteOrdemDialog 
        isOpen={deleteDialogOpen}
        isDeleting={isSubmitting}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
};
