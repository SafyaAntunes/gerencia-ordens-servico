
import React, { useState, useEffect } from 'react';
import { useServicoTracker } from './hooks/useServicoTracker';
import ServicoHeader from './ServicoHeader';
import ServicoDetails from './ServicoDetails';
import ServicoControls from './ServicoControls';
import { ServicoTrackerProps } from './hooks/types/servicoTrackerTypes';
import { useTrackerSubatividades } from '@/hooks/ordens/useTrackerSubatividades';
import { SubatividadesButtons } from './components/SubatividadesButtons';
import { TipoServico } from '@/types/ordens';

function ServicoTracker({ 
  servico, 
  ordem, 
  onUpdate,
  // Legacy props support
  ordemId, 
  funcionarioId,
  funcionarioNome,
  etapa,
  onServicoStatusChange,
  onSubatividadeToggle,
  onSubatividadeSelecionadaToggle,
  canAddSubatividades = true
}: ServicoTrackerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [novaSubatividade, setNovaSubatividade] = useState('');
  const [tempoEstimado, setTempoEstimado] = useState(1);
  
  // Log initial props for debugging
  useEffect(() => {
    console.log("ServicoTracker mounted/updated with props:", {
      servicoTipo: servico.tipo,
      temOnUpdate: !!onUpdate,
      temOrdem: !!ordem,
      ordemId: ordemId || ordem?.id,
      subatividades: servico.subatividades?.length || 0
    });
  }, [servico, ordem, ordemId, onUpdate]);
  
  // Hook para adicionar subatividades
  const { 
    isAddingSubatividades,
    addSelectedSubatividades,
    addCustomSubatividade
  } = useTrackerSubatividades({ 
    ordem, 
    onOrdemUpdate: onUpdate 
  });
  
  const {
    isRunning,
    isPaused,
    displayTime,
    servicoStatus,
    progressPercentage,
    completedSubatividades,
    totalSubatividades,
    tempoTotalEstimado,
    subatividadesFiltradas,
    temPermissao,
    handleStartClick,
    handlePause,
    handleResume,
    handleFinish,
    handleMarcarConcluido,
    handleSubatividadeToggle
  } = useServicoTracker({ 
    servico, 
    ordem, 
    onUpdate,
    ordemId, 
    funcionarioId,
    funcionarioNome,
    etapa,
    onServicoStatusChange,
    onSubatividadeToggle,
    onSubatividadeSelecionadaToggle
  });
  
  const handleAddSelectedSubatividades = (selecionadas: string[]) => {
    console.log("ServicoTracker - handleAddSelectedSubatividades:", {
      servicoTipo: servico.tipo,
      selecionadas,
      temOrdem: !!ordem,
      ordemId: ordem?.id || ordemId
    });
    
    // Garantir que temos uma ordem ou ordemId
    if (!ordem && !ordemId) {
      console.error("Ordem não encontrada para adicionar subatividades");
      return;
    }
    
    addSelectedSubatividades(servico.tipo, selecionadas)
      .then(() => {
        console.log("ServicoTracker - Subatividades adicionadas com sucesso, fechando diálogo");
        setIsSelectDialogOpen(false);
      })
      .catch((error) => {
        console.error("ServicoTracker - Erro ao adicionar subatividades:", error);
        setIsSelectDialogOpen(false);
      });
  };
  
  const handleAddCustomSubatividade = async () => {
    if (novaSubatividade.trim()) {
      try {
        await addCustomSubatividade(
          servico.tipo, 
          novaSubatividade, 
          tempoEstimado
        );
        setNovaSubatividade('');
        setTempoEstimado(1);
        setIsAddDialogOpen(false);
      } catch (error) {
        console.error("Erro ao adicionar subatividade personalizada:", error);
        setIsAddDialogOpen(false);
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      <ServicoHeader
        tipo={servico.tipo}
        displayTime={displayTime}
        servicoStatus={servicoStatus}
        progressPercentage={progressPercentage}
        completedSubatividades={completedSubatividades}
        totalSubatividades={totalSubatividades}
        tempoTotalEstimado={tempoTotalEstimado}
        funcionarioNome={servico.funcionarioNome}
        concluido={servico.concluido}
        temPermissao={temPermissao}
        isOpen={isOpen}
        onToggleOpen={() => setIsOpen(!isOpen)}
      />
      
      {isOpen && (
        <>
          <div className="mt-4">
            <ServicoDetails
              descricao={servico.descricao}
              subatividades={subatividadesFiltradas}
              temPermissao={temPermissao}
              onSubatividadeToggle={handleSubatividadeToggle}
            />
            
            <SubatividadesButtons 
              canAddSubatividades={canAddSubatividades}
              temPermissao={temPermissao}
              servicoConcluido={servico.concluido}
              servicoTipo={servico.tipo as TipoServico} // Ensure it's cast to TipoServico
              isAddDialogOpen={isAddDialogOpen}
              setIsAddDialogOpen={setIsAddDialogOpen}
              isSelectDialogOpen={isSelectDialogOpen}
              setIsSelectDialogOpen={setIsSelectDialogOpen}
              novaSubatividade={novaSubatividade}
              setNovaSubatividade={setNovaSubatividade}
              tempoEstimado={tempoEstimado}
              setTempoEstimado={setTempoEstimado}
              isAddingSubatividades={isAddingSubatividades}
              handleAddCustomSubatividade={handleAddCustomSubatividade}
              handleAddSelectedSubatividades={handleAddSelectedSubatividades}
            />
          </div>
          
          <ServicoControls
            isRunning={isRunning}
            isPaused={isPaused}
            temPermissao={temPermissao}
            concluido={servico.concluido}
            todasSubatividadesConcluidas={progressPercentage === 100}
            onStartClick={handleStartClick}
            onPauseClick={handlePause}
            onResumeClick={handleResume}
            onFinishClick={handleFinish}
            onMarcarConcluido={handleMarcarConcluido}
          />
        </>
      )}
    </div>
  );
}

export default ServicoTracker;
