
import React, { useState, useEffect } from 'react';
import { useServicoTracker } from './hooks/useServicoTracker';
import ServicoHeader from './ServicoHeader';
import ServicoDetails from './ServicoDetails';
import ServicoControls from './ServicoControls';
import { ServicoTrackerProps } from './hooks/types/servicoTrackerTypes';
import { useTrackerSubatividades } from '@/hooks/ordens/useTrackerSubatividades';
import { SubatividadesButtons } from './components/SubatividadesButtons';
import { TipoServico } from '@/types/ordens';
import { toast } from 'sonner';
import { filtrarSubatividadesSelecionadas } from '@/hooks/ordens/tracker-subatividades/utils';

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
      subatividades: servico.subatividades?.length || 0,
      subatividadesSelecionadas: servico.subatividades?.filter(s => s.selecionada).length || 0
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
  
  // Forçar o uso apenas das subatividades selecionadas para exibição
  const subatividadesExibidas = filtrarSubatividadesSelecionadas(servico.subatividades);
  
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
      toast.error("Erro: ordem não encontrada");
      setIsSelectDialogOpen(false);
      return;
    }
    
    // Confirmar que temos subatividades para adicionar
    if (!selecionadas.length) {
      toast.warning("Nenhuma subatividade selecionada");
      setIsSelectDialogOpen(false);
      return;
    }
    
    // Fazer o cast explícito para TipoServico
    const tipoServico = servico.tipo as TipoServico;
    
    addSelectedSubatividades(tipoServico, selecionadas)
      .then(() => {
        console.log("ServicoTracker - Subatividades adicionadas com sucesso, fechando diálogo");
        toast.success(`${selecionadas.length} subatividades adicionadas com sucesso`);
        setIsSelectDialogOpen(false);
      })
      .catch((error) => {
        console.error("ServicoTracker - Erro ao adicionar subatividades:", error);
        toast.error("Erro ao adicionar subatividades");
        setIsSelectDialogOpen(false);
      });
  };
  
  const handleAddCustomSubatividade = async () => {
    if (novaSubatividade.trim()) {
      try {
        // Fazer o cast explícito para TipoServico
        const tipoServico = servico.tipo as TipoServico;
        
        await addCustomSubatividade(
          tipoServico, 
          novaSubatividade, 
          tempoEstimado
        );
        
        toast.success(`Subatividade "${novaSubatividade}" adicionada com sucesso`);
        setNovaSubatividade('');
        setTempoEstimado(1);
        setIsAddDialogOpen(false);
      } catch (error) {
        console.error("Erro ao adicionar subatividade personalizada:", error);
        toast.error("Erro ao adicionar subatividade");
        setIsAddDialogOpen(false);
      }
    } else {
      toast.warning("Digite o nome da subatividade");
    }
  };

  // Log subatividades para debug
  useEffect(() => {
    if (servico.subatividades) {
      console.log("ServicoTracker - Subatividades disponíveis:", {
        total: servico.subatividades.length,
        selecionadas: servico.subatividades.filter(s => s.selecionada).length,
        detalhes: servico.subatividades.map(s => ({
          id: s.id.substr(0, 4),
          nome: s.nome,
          selecionada: s.selecionada
        }))
      });
    }
  }, [servico.subatividades]);

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
              subatividades={subatividadesExibidas.length > 0 ? subatividadesExibidas : subatividadesFiltradas}
              temPermissao={temPermissao}
              onSubatividadeToggle={handleSubatividadeToggle}
            />
            
            <SubatividadesButtons 
              canAddSubatividades={canAddSubatividades}
              temPermissao={temPermissao}
              servicoConcluido={servico.concluido}
              servicoTipo={servico.tipo as TipoServico} // Cast explícito para TipoServico
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
