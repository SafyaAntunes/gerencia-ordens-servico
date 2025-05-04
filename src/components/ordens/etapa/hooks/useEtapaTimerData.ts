
import { useState, useEffect } from 'react';
import { EtapaOS, TipoServico, TipoAtividade } from '@/types/ordens';
import { useConfiguracoesServico } from '@/hooks/useConfiguracoesServico';

export function useEtapaTimerData(etapa: EtapaOS, tipoServico?: TipoServico) {
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
    if (tipoServico && itens.length > 0) {
      const configuracaoServico = itens.find(item => item.tipo === tipoServico);
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
  }, [tipoServico, itens, etapa]);

  return {
    tempoPadrao,
    tempoEstimadoMS,
    tipoAtividade
  };
}
