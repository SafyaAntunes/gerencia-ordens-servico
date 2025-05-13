
import { useState, useEffect } from "react";
import { SubAtividade, TipoServico, EtapaOS, TipoAtividade } from "@/types/ordens";
import { getSubatividades, getSubatividadesByTipo } from "@/services/subatividadeService";
import { FormValues } from "../types";

export const useOrdemFormData = (
  servicosTipos: string[],
  defaultValues?: Partial<FormValues>,
  defaultFotosEntrada: any[] = [],
  defaultFotosSaida: any[] = []
) => {
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  const [servicosSubatividades, setServicosSubatividades] = useState<Record<string, SubAtividade[]>>({});
  const [fotosEntrada, setFotosEntrada] = useState<File[]>([]);
  const [fotosSaida, setFotosSaida] = useState<File[]>([]);
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

  // Process default fotos
  useEffect(() => {
    const processDefaultFotos = () => {
      if (defaultFotosEntrada && defaultFotosEntrada.length > 0) {
        const processedFotos = defaultFotosEntrada.map((foto: any) => {
          if (foto && typeof foto === 'object' && 'data' in foto) {
            return foto.data;
          }
          return foto;
        });
        setFotosEntrada(processedFotos as any);
      }

      if (defaultFotosSaida && defaultFotosSaida.length > 0) {
        const processedFotos = defaultFotosSaida.map((foto: any) => {
          if (foto && typeof foto === 'object' && 'data' in foto) {
            return foto.data;
          }
          return foto;
        });
        setFotosSaida(processedFotos as any);
      }
    };

    processDefaultFotos();
  }, [defaultFotosEntrada, defaultFotosSaida]);

  // Load default values
  useEffect(() => {
    if (defaultValues?.servicosSubatividades) {
      setServicosSubatividades(defaultValues.servicosSubatividades);
    }
    
    if (defaultValues?.servicosDescricoes) {
      setServicosDescricoes(defaultValues.servicosDescricoes);
    }
    
    if (defaultValues?.etapasTempoPreco) {
      setEtapasTempoPreco(prev => ({
        ...prev,
        ...defaultValues.etapasTempoPreco as any
      }));
    }
  }, [defaultValues?.servicosSubatividades, defaultValues?.servicosDescricoes, defaultValues?.etapasTempoPreco]);

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
            setEtapasConfig(prev => ({
              ...prev,
              [tipo]: etapasData[tipo]
            }));
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

  // Load subatividades for each service type
  useEffect(() => {
    const loadSubatividades = async (tipo: TipoServico) => {
      try {
        // Always fetch all available subactivities for this service type
        const subatividadesList = await getSubatividadesByTipo(tipo);

        setServicosSubatividades(prev => {
          // Get existing subatividades from current state
          const existingSubatividades = prev[tipo] || [];
          // Get default values from form initialization (if editing an order)
          const defaultSubatividades = defaultValues?.servicosSubatividades?.[tipo] || [];
          
          // Create a combined list of all subactivities, preserving states from existing selections
          const updatedSubatividades = (subatividadesList || []).map(sub => {
            // Look for this subatividade in existing or default values
            const existingItem = existingSubatividades.find(s => s.id === sub.id);
            const defaultItem = defaultSubatividades.find(s => s.id === sub.id);
            
            // Prioritize: 1. Current state, 2. Default values, 3. New values
            return {
              ...sub,
              selecionada: existingItem?.selecionada ?? defaultItem?.selecionada ?? false,
              concluida: existingItem?.concluida ?? defaultItem?.concluida ?? false
            };
          });
          
          return {
            ...prev,
            [tipo]: updatedSubatividades
          };
        });
      } catch (error) {
        console.error(`Erro ao carregar subatividades para ${tipo}:`, error);
        setServicosSubatividades(prev => ({
          ...prev,
          [tipo]: []
        }));
      }
    };

    // Always load subatividades for all selected service types
    servicosTipos.forEach((tipo) => {
      loadSubatividades(tipo as TipoServico);
    });

    // Remover subatividades de tipos que não estão mais selecionados
    Object.keys(servicosSubatividades).forEach((tipo) => {
      if (!servicosTipos.includes(tipo)) {
        setServicosSubatividades(prev => {
          const newState = { ...prev };
          delete newState[tipo];
          return newState;
        });
      }
    });
  }, [servicosTipos, defaultValues?.servicosSubatividades]);

  const handleServicoDescricaoChange = (tipo: string, descricao: string) => {
    setServicosDescricoes(prev => ({
      ...prev,
      [tipo]: descricao
    }));
  };
  
  const handleSubatividadesChange = (tipo: TipoServico, subatividades: SubAtividade[]) => {
    setServicosSubatividades(prev => ({
      ...prev,
      [tipo]: subatividades
    }));
  };
  
  const handleEtapaTempoPrecoChange = (etapa: EtapaOS, field: 'precoHora' | 'tempoEstimado', value: number) => {
    setEtapasTempoPreco(prev => ({
      ...prev,
      [etapa]: {
        ...prev[etapa],
        [field]: value
      }
    }));
  };

  return {
    servicosDescricoes,
    servicosSubatividades,
    fotosEntrada,
    fotosSaida,
    etapasConfig,
    isLoadingEtapas,
    etapasTempoPreco,
    setFotosEntrada,
    setFotosSaida,
    handleServicoDescricaoChange,
    handleSubatividadesChange,
    handleEtapaTempoPrecoChange
  };
};
