
import { useState, useEffect, useCallback } from "react";
import { TipoAtividade, SubAtividade, EtapaOS } from "@/types/ordens";
import { getSubatividades } from "@/services/subatividadeService";
import { isEqual } from "lodash";

export const useEtapasConfig = (defaultEtapasTempoPreco?: Record<string, {precoHora?: number, tempoEstimado?: number}>) => {
  const [etapasConfig, setEtapasConfig] = useState<Record<TipoAtividade, SubAtividade[]>>({
    lavagem: [],
    inspecao_inicial: [],
    inspecao_final: []
  });
  const [isLoadingEtapas, setIsLoadingEtapas] = useState(false);
  const [etapasTempoPreco, setEtapasTempoPreco] = useState<Record<string, {precoHora?: number, tempoEstimado?: number}>>({
    lavagem: {precoHora: 0, tempoEstimado: 0},
    inspecao_inicial: {precoHora: 0, tempoEstimado: 0},
    inspecao_final: {precoHora: 0, tempoEstimado: 0},
    retifica: {precoHora: 0, tempoEstimado: 0},
    montagem: {precoHora: 0, tempoEstimado: 0},
    dinamometro: {precoHora: 0, tempoEstimado: 0}
  });

  // Initialize etapas tempo/preco from default values if provided
  useEffect(() => {
    if (defaultEtapasTempoPreco) {
      setEtapasTempoPreco(prev => {
        if (isEqual(prev, defaultEtapasTempoPreco)) return prev;
        return {
          ...prev,
          ...defaultEtapasTempoPreco
        };
      });
    }
  }, [defaultEtapasTempoPreco]);

  // Fetch etapas configuration
  useEffect(() => {
    const fetchEtapasConfig = async () => {
      setIsLoadingEtapas(true);
      try {
        const etapasData = await getSubatividades();
        
        // Apenas precisamos das etapas lavagem, inspecao_inicial e inspecao_final
        const tiposAtividade: TipoAtividade[] = ['lavagem', 'inspecao_inicial', 'inspecao_final'];
        
        // Para cada tipo de atividade, atualize o tempo padrão se houver subatividades
        tiposAtividade.forEach((tipo) => {
          if (etapasData[tipo] && etapasData[tipo].length > 0) {
            // Use o tempo estimado da primeira subatividade como tempo padrão
            const defaultTempo = etapasData[tipo][0].tempoEstimado || 0;
            
            setEtapasTempoPreco(prev => ({
              ...prev,
              [tipo]: { 
                ...prev[tipo],
                tempoEstimado: defaultTempo 
              }
            }));
          }
          
          // Guarde as subatividades para referência
          if (etapasData[tipo]) {
            setEtapasConfig(prev => {
              // Only update if there's a change
              if (isEqual(prev[tipo], etapasData[tipo])) return prev;
              
              return {
                ...prev,
                [tipo]: etapasData[tipo]
              };
            });
          }
        });
      } catch (error) {
        console.error("Erro ao buscar configurações de etapas:", error);
      } finally {
        setIsLoadingEtapas(false);
      }
    };
    
    fetchEtapasConfig();
  }, []);

  const handleEtapaTempoPrecoChange = useCallback((etapa: EtapaOS, field: 'precoHora' | 'tempoEstimado', value: number) => {
    setEtapasTempoPreco(prev => {
      // Skip update if no actual changes
      if (prev[etapa]?.[field] === value) return prev;
      
      return {
        ...prev,
        [etapa]: {
          ...prev[etapa],
          [field]: value
        }
      };
    });
  }, []);

  return {
    etapasConfig,
    isLoadingEtapas,
    etapasTempoPreco,
    handleEtapaTempoPrecoChange
  };
};
