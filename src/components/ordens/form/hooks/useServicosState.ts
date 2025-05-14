
import { useState, useEffect, useCallback } from "react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { getSubatividadesByTipo, getAllSubatividades } from "@/services/subatividadeService";
import { isEqual } from "lodash";
import { FormValues } from "../types";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import { toast } from "sonner";

export const useServicosState = (
  servicosTipos: string[], 
  defaultValues?: Partial<FormValues>
) => {
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  const [servicosSubatividades, setServicosSubatividades] = useState<Record<string, SubAtividade[]>>({});
  
  // Keep track of previously loaded service types to prevent unnecessary rerenders
  const [previousServiceTypes, setPreviousServiceTypes] = useState<string[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [debugInfoLoaded, setDebugInfoLoaded] = useState(false);
  const [loadingSources, setLoadingSources] = useState<Record<string, string>>({});

  // Get default subatividades from the hook to use as fallback only
  const { defaultSubatividades } = useServicoSubatividades();

  // Carregar diagnóstico inicial - apenas uma vez
  useEffect(() => {
    if (!debugInfoLoaded) {
      const loadDebugInfo = async () => {
        try {
          console.log("🔍 [DIAGNÓSTICO] Carregando todas as subatividades do banco para verificação...");
          const allSubs = await getAllSubatividades();
          console.log("🔍 [DIAGNÓSTICO] Total de subatividades no banco:", allSubs.length);
          console.log("🔍 [DIAGNÓSTICO] Subatividades por tipo:");
          
          // Agrupar por tipo para visualizar melhor
          const grouped = allSubs.reduce((acc, item) => {
            if (!acc[item.tipoServico]) {
              acc[item.tipoServico] = [];
            }
            acc[item.tipoServico].push(item);
            return acc;
          }, {} as Record<string, any[]>);
          
          Object.entries(grouped).forEach(([tipo, items]) => {
            console.log(`   - ${tipo}: ${items.length} itens`);
            if (items.length > 0) {
              console.log(`     - Exemplos: ${items.map(i => i.nome).join(', ').substring(0, 100)}...`);
            }
          });
          
          setDebugInfoLoaded(true);
        } catch (error) {
          console.error("🔍 [DIAGNÓSTICO] Erro ao carregar informações de diagnóstico:", error);
        }
      };
      
      loadDebugInfo();
    }
  }, [debugInfoLoaded]);

  // MAIS IMPORTANTE: Priorizar valores da edição - carregados apenas uma vez na inicialização
  useEffect(() => {
    if (hasInitialized) return;
    
    console.log("⚠️ [useServicosState] Verificando valores de inicialização do defaultValues...");
    
    if (defaultValues?.servicosSubatividades) {
      console.log("📝 [useServicosState] Inicializando com subatividades do defaultValues:", defaultValues.servicosSubatividades);
      console.log("📝 [useServicosState] Detalhes por tipo: ");
      
      // Log detalhado por tipo
      Object.entries(defaultValues.servicosSubatividades).forEach(([tipo, subs]) => {
        console.log(`📝 [useServicosState] ${tipo}: ${subs.length} subatividades`);
        if (subs.length > 0) {
          console.log(`📝 [useServicosState] Primeira subatividade de ${tipo}:`, subs[0]);
        }
      });
      
      // Importante: precisamos preservar os estados 'selecionada' das subatividades existentes
      const processedSubatividades: Record<string, SubAtividade[]> = {};
      
      Object.entries(defaultValues.servicosSubatividades).forEach(([tipo, subatividades]) => {
        if (subatividades && subatividades.length > 0) {
          // Garantir que todas as subatividades tenham os estados corretos
          processedSubatividades[tipo] = subatividades.map(sub => ({
            ...sub,
            // Preservar o estado 'selecionada' ou definir como true se não existir
            selecionada: sub.selecionada !== undefined ? sub.selecionada : true,
            // Preservar o estado 'concluida' ou definir como false se não existir
            concluida: sub.concluida ?? false
          }));
        }
      });
      
      console.log("📝 [useServicosState] Subatividades processadas:", processedSubatividades);
      setServicosSubatividades(processedSubatividades);
      
      // Atualizar fontes de carregamento
      setLoadingSources(prev => {
        const newSources = { ...prev };
        Object.keys(processedSubatividades).forEach(tipo => {
          newSources[tipo] = "edição";
        });
        return newSources;
      });
    } else {
      console.log("⚠️ [useServicosState] Nenhum valor de subatividades no defaultValues");
    }
    
    if (defaultValues?.servicosDescricoes) {
      console.log("📝 [useServicosState] Inicializando descrições de serviços:", defaultValues.servicosDescricoes);
      setServicosDescricoes(prev => {
        if (isEqual(prev, defaultValues.servicosDescricoes)) return prev;
        return defaultValues.servicosDescricoes ?? {};
      });
    }
    
    setHasInitialized(true);
  }, [defaultValues?.servicosSubatividades, defaultValues?.servicosDescricoes, hasInitialized]);

  // Carrega subatividades para cada tipo de serviço - com otimizações
  useEffect(() => {
    // Pular se os tipos de serviço não mudaram
    if (isEqual(servicosTipos.sort(), previousServiceTypes.sort()) && hasInitialized) {
      console.log("⏭️ [useServicosState] Tipos de serviço não mudaram, pulando carregamento");
      return;
    }
    
    console.log("🔄 [useServicosState] Tipos de serviço mudaram:", servicosTipos);
    console.log("🔄 [useServicosState] Tipos anteriores:", previousServiceTypes);
    
    setPreviousServiceTypes([...servicosTipos]);
    
    // Rastrear operações assíncronas pendentes
    let isMounted = true;
    const pendingOperations: Record<string, boolean> = {};
    const sourceTracker: Record<string, string> = {};
    
    const loadSubatividades = async (tipo: TipoServico) => {
      // Pular se já estamos carregando este tipo
      if (pendingOperations[tipo]) {
        console.log(`⏭️ [loadSubatividades] Já está carregando subatividades para ${tipo}, pulando...`);
        return;
      }
      
      // PRIORIDADE MÁXIMA: Se já temos subatividades salvas para este tipo na edição, usar essas
      if (defaultValues?.servicosSubatividades?.[tipo]?.length > 0) {
        console.log(`✅ [loadSubatividades] PRIORIDADE MÁXIMA: Usando subatividades SALVAS da ordem para ${tipo}`, 
          defaultValues.servicosSubatividades[tipo]);
        
        // Garantir que todas as subatividades tenham os estados corretos
        const savedSubatividades = defaultValues.servicosSubatividades[tipo].map(sub => ({
          ...sub,
          // Preservar o estado 'selecionada' ou definir como true se não existir
          selecionada: sub.selecionada !== undefined ? sub.selecionada : true,
          // Preservar o estado 'concluida' ou definir como false se não existir
          concluida: sub.concluida ?? false
        }));
        
        setServicosSubatividades(prev => ({
          ...prev,
          [tipo]: savedSubatividades
        }));
        
        sourceTracker[tipo] = "edição";
        setLoadingSources(prev => ({...prev, [tipo]: "edição"}));
        return;
      }
      
      // Marcar como pendente para evitar cargas duplicadas
      pendingOperations[tipo] = true;
      
      try {
        // PRIORIDADE ALTA: Usar subatividades existentes no estado local
        const existingSubatividades = servicosSubatividades[tipo] || [];
        if (existingSubatividades.length > 0) {
          console.log(`✅ [loadSubatividades] PRIORIDADE ALTA: USANDO SUBATIVIDADES EXISTENTES para ${tipo}:`, existingSubatividades);
          sourceTracker[tipo] = "existente";
          setLoadingSources(prev => ({...prev, [tipo]: "existente"}));
          return;
        }
        
        // PRIORIDADE MÉDIA: Buscar subatividades do banco de dados
        console.log(`🔍 [loadSubatividades] PRIORIDADE MÉDIA: Buscando subatividades do banco para ${tipo}...`);
        const dbSubatividades = await getSubatividadesByTipo(tipo);
        console.log(`🔍 [loadSubatividades] Recebidas do banco para ${tipo}:`, dbSubatividades?.length || 0);
        
        if (dbSubatividades && dbSubatividades.length > 0) {
          const formattedSubs = dbSubatividades.map(sub => ({
            ...sub,
            selecionada: true,
            concluida: false
          }));
          
          console.log(`✅ [loadSubatividades] USANDO SUBATIVIDADES DO BANCO para ${tipo}:`, formattedSubs);
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: formattedSubs
          }));
          sourceTracker[tipo] = "banco";
          setLoadingSources(prev => ({...prev, [tipo]: "banco"}));
          return;
        }
        
        // PRIORIDADE BAIXA: Usar valores padrão apenas como último recurso
        if (defaultSubatividades && defaultSubatividades[tipo]) {
          const defaultSubs = defaultSubatividades[tipo].map(nome => ({
            id: nome,
            nome: nome,
            selecionada: true,
            concluida: false
          }));
          
          console.log(`⚠️ [loadSubatividades] PRIORIDADE BAIXA: USANDO SUBATIVIDADES BÁSICAS (fallback) para ${tipo}:`, defaultSubs);
          toast.warning(`Subatividades de configuração não encontradas para ${tipo}. Usando valores básicos.`);
          
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: defaultSubs
          }));
          sourceTracker[tipo] = "padrão";
          setLoadingSources(prev => ({...prev, [tipo]: "padrão"}));
        } else {
          console.log(`❌ [loadSubatividades] Nenhuma subatividade disponível para ${tipo}`);
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: []
          }));
          sourceTracker[tipo] = "vazio";
          setLoadingSources(prev => ({...prev, [tipo]: "vazio"}));
        }
        
      } catch (error) {
        console.error(`❌ [loadSubatividades] Erro ao carregar subatividades para ${tipo}:`, error);
        toast.error(`Erro ao carregar subatividades para ${tipo}`);
        
        // Se tivermos valores do modo de edição, use-os apesar do erro
        if (defaultValues?.servicosSubatividades?.[tipo]?.length > 0) {
          console.log(`🔄 [loadSubatividades] Apesar do erro, usando subatividades do modo de edição para ${tipo}`);
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: defaultValues.servicosSubatividades![tipo]
          }));
          sourceTracker[tipo] = "edição (recuperação de erro)";
          setLoadingSources(prev => ({...prev, [tipo]: "edição (recuperação de erro)"}));
        } 
        // Caso contrário, use os padrões como última opção
        else if (defaultSubatividades && defaultSubatividades[tipo as TipoServico]) {
          console.log(`🔄 [loadSubatividades] Usando básicos como último recurso para ${tipo}`);
          const defaultSubs = defaultSubatividades[tipo as TipoServico].map(nome => ({
            id: nome,
            nome,
            selecionada: true,
            concluida: false,
          }));
          
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: defaultSubs
          }));
          sourceTracker[tipo] = "padrão (recuperação de erro)";
          setLoadingSources(prev => ({...prev, [tipo]: "subatividades (recuperação de erro)"}));
        } else {
          setServicosSubatividades(prev => ({
            ...prev,
            [tipo]: []
          }));
          sourceTracker[tipo] = "vazio (erro)";
          setLoadingSources(prev => ({...prev, [tipo]: "vazio (erro)"}));
        }
      } finally {
        pendingOperations[tipo] = false;
      }
    };

    // Sempre carregar subatividades para todos os tipos de serviço selecionados
    servicosTipos.forEach((tipo) => {
      loadSubatividades(tipo as TipoServico);
    });

    // Remover subatividades de tipos que não estão mais selecionados
    setServicosSubatividades(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach((tipo) => {
        if (!servicosTipos.includes(tipo)) {
          delete newState[tipo];
        }
      });
      return newState;
    });
    
    // Log de origens após todas as cargas serem concluídas
    setTimeout(() => {
      console.log("📊 [useServicosState] Origem das subatividades carregadas:", sourceTracker);
    }, 1000);
    
    // Função de limpeza para evitar atualizações de estado após desmontar
    return () => {
      isMounted = false;
    };
  }, [servicosTipos, defaultValues?.servicosSubatividades, previousServiceTypes, defaultSubatividades, hasInitialized, servicosSubatividades]);

  const handleServicoDescricaoChange = useCallback((tipo: string, descricao: string) => {
    setServicosDescricoes(prev => {
      if (prev[tipo] === descricao) return prev;
      return {
        ...prev,
        [tipo]: descricao
      };
    });
  }, []);
  
  const handleSubatividadesChange = useCallback((tipo: TipoServico, subatividades: SubAtividade[]) => {
    console.log(`[handleSubatividadesChange] Atualizando subatividades para ${tipo}:`, subatividades);
    setServicosSubatividades(prev => {
      // Skip update if no actual changes to prevent re-renders
      if (isEqual(prev[tipo], subatividades)) return prev;
      
      return {
        ...prev,
        [tipo]: subatividades
      };
    });
  }, []);

  return {
    servicosDescricoes,
    servicosSubatividades,
    loadingSources,
    handleServicoDescricaoChange,
    handleSubatividadesChange
  };
};
