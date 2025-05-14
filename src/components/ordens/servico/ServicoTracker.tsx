
import React, { useState, useEffect } from 'react';
import { useServicoTracker } from './hooks/useServicoTracker';
import { ServicoHeader } from './ServicoHeader';
import { ServicoDetails } from './ServicoDetails';
import { ServicoControls } from './ServicoControls';
import { OrdemServico, Servico } from '@/types/ordens';

export interface ServicoTrackerProps {
  ordem: OrdemServico;
  servico: Servico;
  onUpdate?: (ordem: OrdemServico) => void;
}

function ServicoTracker({ ordem, servico, onUpdate }: ServicoTrackerProps) {
  const {
    isTimerRunning,
    timerDisplay,
    servicoStatus,
    canStart,
    canPause,
    canResume,
    canComplete,
    startServico,
    pauseServico,
    resumeServico,
    completeServico,
    atribuirFuncionario,
    isDialogOpen,
    setIsDialogOpen
  } = useServicoTracker(ordem, servico, onUpdate);

  return (
    <div className="border rounded-lg p-4 mb-4">
      <ServicoHeader 
        servico={servico} 
        status={servicoStatus}
      />
      
      <ServicoDetails 
        servico={servico} 
        timerDisplay={timerDisplay}
        onAtribuirFuncionario={() => setIsDialogOpen(true)}
      />
      
      <ServicoControls 
        isTimerRunning={isTimerRunning}
        canStart={canStart}
        canPause={canPause}
        canResume={canResume}
        canComplete={canComplete}
        onStart={startServico}
        onPause={pauseServico}
        onResume={resumeServico}
        onComplete={completeServico}
      />
    </div>
  );
}

export default ServicoTracker;
