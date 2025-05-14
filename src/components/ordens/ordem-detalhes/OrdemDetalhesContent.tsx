
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrdemDetalhes } from '@/hooks/useOrdemDetalhes';
import { OrdemFormWrapper } from './OrdemFormWrapper';
import { OrdemDetailsTabs } from './OrdemDetailsTabs';
import { BackButton } from './BackButton';
import { LoadingOrdem } from '../detalhes/LoadingOrdem';
import { NotFoundOrdem } from '../detalhes/NotFoundOrdem';
import { OrdemHeaderCustom } from '../detalhes/OrdemHeaderCustom';
import { DeleteOrdemDialog } from '@/components/ordens/detalhes/DeleteOrdemDialog';
import OrdemActionButtons from '@/components/ordens/detalhes/OrdemActionButtons';
import { loadOrderFormData } from '@/services/ordemService';
import { useTrackingSubatividades } from '@/hooks/ordens/useTrackingSubatividades';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, FileDown } from 'lucide-react';

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
    onSubatividadeToggle,
    logSubatividadesState 
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
  
  // Exportar PDF (implementação futura)
  const handleExportPDF = () => {
    console.log("Exportar PDF");
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
      <div className="flex flex-col space-y-4">
        {/* Botão voltar */}
        <BackButton onClick={handleBack} />
        
        {/* Cabeçalho da ordem */}
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex flex-row justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{ordem.nome}</h1>
              <p className="text-sm text-muted-foreground">
                Criada em {new Date(ordem.dataAbertura).toLocaleDateString()} • 
                Previsão de entrega: {new Date(ordem.dataPrevistaEntrega).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {canEditThisOrder && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1"
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportPDF}
                className="flex items-center gap-1"
              >
                <FileDown className="h-4 w-4" /> Exportar PDF
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <OrdemDetailsTabs 
          ordem={ordem}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onStatusChange={handleStatusChange}
          onOrdemUpdate={handleOrdemUpdate}
        />
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
