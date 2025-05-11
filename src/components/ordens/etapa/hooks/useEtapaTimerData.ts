
import { useState, useEffect } from 'react';
import { EtapaOS, TipoServico, TipoAtividade } from '@/types/ordens';
import { useConfiguracoesServico } from '@/hooks/useConfiguracoesServico';
import { useOrdemTimer } from '@/hooks/useOrdemTimer';

interface UseEtapaTimerDataProps {
  etapa: EtapaOS;
  ordemId: string;
  servicoTipo?: TipoServico;
  etapaInfo?: any;
}

export function useEtapaTimerData({
  etapa,
  ordemId,
  servicoTipo,
  etapaInfo
}: UseEtapaTimerDataProps) {
  const [tempoPadrao, setTempoPadrao] = useState<number>(0);
  const [tempoEstimadoMS, setTempoEstimadoMS] = useState<number>(0);

  // Convert EtapaOS to TipoAtividade for the configuration hook
  const getTipoAtividade = (etapa: EtapaOS): TipoAtividade | undefined => {
    if (etapa === 'lavagem') return 'lavagem';
    if (etapa === 'inspecao_inicial') return 'inspecao_inicial';
    if (etapa === 'inspecao_final') return 'inspecao_final';
    return undefined;
  };
  
  const tipoAtividade = getTipoAtividade(etapa);
  
  // Get time configurations for the current etapa type
  const { itens } = useConfiguracoesServico(tipoAtividade as TipoAtividade);

  // Update standard time when configurations or service type change
  useEffect(() => {
    if (servicoTipo && itens.length > 0) {
      const configuracaoServico = itens.find(item => item.tipo === servicoTipo);
      if (configuracaoServico) {
        // Convert HH:MM to minutes
        const partes = configuracaoServico.horaPadrao.split(':');
        const horasEmMinutos = parseInt(partes[0], 10) * 60;
        const minutos = parseInt(partes[1], 10);
        const totalMinutos = horasEmMinutos + minutos;
        
        setTempoPadrao(totalMinutos);
        
        // Also store as milliseconds for easier calculation elsewhere
        const milliseconds = totalMinutos * 60 * 1000;
        setTempoEstimadoMS(milliseconds);
      }
    }
  }, [servicoTipo, itens, etapa]);

  // Use the timer hook
  const {
    isRunning,
    isPaused,
    displayTime,
    totalSavedTime,
    handleStart: startTimer,
    handlePause: pauseTimer,
    handleResume: resumeTimer,
    handleFinish: stopTimer
  } = useOrdemTimer({
    ordemId,
    etapa,
    tipoServico: servicoTipo,
    isEtapaConcluida: etapaInfo?.concluido || false
  });

  return {
    isRunning,
    isPaused,
    displayTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tempoPadrao,
    tempoEstimadoMS,
    tipoAtividade,
    timerId: null // Compatibilidade com código existente
  };
}
