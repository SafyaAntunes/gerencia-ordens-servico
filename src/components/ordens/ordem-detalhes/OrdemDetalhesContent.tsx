
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useOrdemDetalhes } from '@/hooks/useOrdemDetalhes';
import EtapasTracker from '@/components/ordens/etapas-tracker/EtapasTracker';
import { OrdemFormWrapper } from './OrdemFormWrapper';
import { OrdemDetailsTabs } from './OrdemDetailsTabs';
import { OrdemHeader } from '../detalhes/OrdemHeader';
import { BackButton } from './BackButton';
import { LoadingOrdem } from '../detalhes/LoadingOrdem';
import { NotFoundOrdem } from '../detalhes/NotFoundOrdem';
import { OrdemHeaderCustom } from '../detalhes/OrdemHeaderCustom';
import DeleteOrdemDialog from '@/components/ordens/detalhes/DeleteOrdemDialog';
import { OrdemActionButtons } from '@/components/ordens/detalhes/OrdemActionButtons';

export const OrdemDetalhesContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
        <BackButton />
        <OrdemFormWrapper 
          ordem={ordem} 
          onSubmit={handleSubmit} 
          onCancel={() => setEditMode(false)}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // Renderizar detalhes da ordem no modo de visualização
  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <BackButton />
      <OrdemHeaderCustom 
        ordem={ordem}
        onEdit={() => setEditMode(true)}
        onDelete={() => setDeleteDialogOpen(true)}
        onStatusChange={handleStatusChange}
        canEdit={canEditThisOrder}
        isSubmitting={isSubmitting}
      />
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrdemActionButtons 
            ordem={ordem}
            onStatusChange={handleStatusChange}
            canEdit={canEditThisOrder}
            isSubmitting={isSubmitting}
          />
          <OrdemDetailsTabs 
            ordem={ordem}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
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
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
};
