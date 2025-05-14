
import React, { useState } from 'react';
import { useServicoTracker } from './hooks/useServicoTracker';
import ServicoHeader from './ServicoHeader';
import ServicoDetails from './ServicoDetails';
import ServicoControls from './ServicoControls';
import { OrdemServico, Servico, EtapaOS } from '@/types/ordens';
import { ServicoTrackerProps } from './hooks/types/servicoTrackerTypes';

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
  onSubatividadeSelecionadaToggle
}: ServicoTrackerProps) {
  const [isOpen, setIsOpen] = useState(true);
  
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
