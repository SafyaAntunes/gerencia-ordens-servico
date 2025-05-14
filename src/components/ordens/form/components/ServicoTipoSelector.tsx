import { memo, useCallback, useEffect, useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { ServicoSubatividades } from "@/components/ordens/subatividades";
import { tiposServico } from "../types";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import { getAllSubatividades } from "@/services/subatividadeService";
import { toast } from "sonner";

interface ServicoTipoSelectorProps {
  form: UseFormReturn<FormValues>;
  servicosSubatividades: Record<string, SubAtividade[]>;
  onSubatividadesChange: (tipo: TipoServico, subatividades: SubAtividade[]) => void;
  loadingSources?: Record<string, string>;
}

// Memoize the component to prevent unnecessary re-renders
export const ServicoTipoSelector = memo(({ 
  form, 
  servicosSubatividades,
  onSubatividadesChange,
  loadingSources = {} 
}: ServicoTipoSelectorProps) => {
  // Get default subatividades for fallback
  const { defaultSubatividades } = useServicoSubatividades();
  const [hasCheckedDB, setHasCheckedDB] = useState(false);
  
  // Verificar subatividades no banco ao montar o componente
  useEffect(() => {
    if (!hasCheckedDB) {
      const checkDBSubatividades = async () => {
        try {
          console.log("🔍 [ServicoTipoSelector] Verificando subatividades no banco de dados...");
          const allSubs = await getAllSubatividades();
          console.log("🔍 [ServicoTipoSelector] Total de subatividades no banco:", allSubs.length);
          
          // Agrupar por tipo
          const byType: Record<string, string[]> = {};
          allSubs.forEach(sub => {
            if (!byType[sub.tipoServico]) {
              byType[sub.tipoServico] = [];
            }
            byType[sub.tipoServico].push(sub.nome);
          });
          
          // Mostrar informações de subatividades por tipo
          Object.entries(byType).forEach(([tipo, nomes]) => {
            console.log(`🔍 [ServicoTipoSelector] Tipo ${tipo}: ${nomes.join(', ')}`);
          });
          
          setHasCheckedDB(true);
        } catch (error) {
          console.error("❌ [ServicoTipoSelector] Erro ao verificar subatividades:", error);
        }
      };
      
      checkDBSubatividades();
    }
  }, [hasCheckedDB]);
  
  // Use useCallback to memoize handleSubatividadeChange for each tipo
  const getMemoizedChangeHandler = useCallback((tipo: TipoServico) => {
    return (subatividades: SubAtividade[]) => {
      console.log(`[ServicoTipoSelector] Subatividades alteradas para ${tipo}:`, 
        subatividades.map(sub => ({ 
          id: sub.id, 
          nome: sub.nome, 
          selecionada: sub.selecionada !== undefined ? sub.selecionada : false, 
          concluida: sub.concluida 
        })));
      onSubatividadesChange(tipo, subatividades);
    };
  }, [onSubatividadesChange]);
  
  // Effect to ensure we have subatividades for each selected service type
  useEffect(() => {
    const servicosTipos = form.getValues("servicosTipos") || [];
    
    servicosTipos.forEach(tipo => {
      // MELHORIA: Verificar subatividades existentes com log detalhado
      const existingSubatividades = servicosSubatividades[tipo];
      
      // Verificação detalhada de subatividades existentes
      if (existingSubatividades) {
        console.log(`[ServicoTipoSelector] Verificando subatividades para ${tipo}:`, 
          existingSubatividades.map(sub => ({ 
            id: sub.id, 
            nome: sub.nome, 
            selecionada: sub.selecionada !== undefined ? sub.selecionada : false, 
            concluida: sub.concluida 
          }))
        );
      } else {
        console.log(`[ServicoTipoSelector] Nenhuma subatividade encontrada para ${tipo}`);
      }
      
      // Se não há subatividades para este tipo de serviço, mas temos padrões, 
      // criar subatividades básicas a partir dos padrões - TODAS DESMARCADAS POR PADRÃO
      if ((!existingSubatividades || existingSubatividades.length === 0) && 
          defaultSubatividades && defaultSubatividades[tipo as TipoServico]) {
        
        console.log(`[ServicoTipoSelector] Nenhuma subatividade encontrada para ${tipo}, criando padrões DESMARCADOS`);
        const defaultSubs = defaultSubatividades[tipo as TipoServico].map(nome => ({
          id: nome,
          nome,
          selecionada: false, // Garantir que subatividades novas sempre começam desmarcadas
          concluida: false,
          tempoEstimado: 0,
          servicoTipo: tipo as TipoServico
        }));
        
        onSubatividadesChange(tipo as TipoServico, defaultSubs);
      } else if (existingSubatividades) {
        // Verificar a fonte de carregamento para decidir sobre a seleção padrão
        // Se NÃO for de uma edição existente, garantir que todas subatividades começam desmarcadas
        const isFromEditing = loadingSources[tipo] === "edição";
        
        if (!isFromEditing) {
          console.log(`[ServicoTipoSelector] Serviço ${tipo} NÃO é de edição, desmarcando todas subatividades`);
          const processedSubs = existingSubatividades.map(sub => ({
            ...sub,
            selecionada: false // Forçar como false para novos serviços
          }));
          
          onSubatividadesChange(tipo as TipoServico, processedSubs);
        } else {
          console.log(`[ServicoTipoSelector] Serviço ${tipo} é de edição, preservando seleções existentes`);
        }
      }
    });
  }, [form, servicosSubatividades, defaultSubatividades, onSubatividadesChange, loadingSources]);

  const getSourceBadge = (tipo: string) => {
    const source = loadingSources[tipo];
    
    if (!source) return null;
    
    if (source.includes("banco")) {
      return <Badge variant="outline" className="ml-2 bg-green-50">Configuração</Badge>;
    } else if (source.includes("edição")) {
      return <Badge variant="outline" className="ml-2 bg-blue-50">Salvo</Badge>;
    } else if (source.includes("padrão") || source.includes("básico")) {
      return <Badge variant="outline" className="ml-2 bg-amber-50">Subatividades</Badge>;
    }
    
    return null;
  };
  
  return (
    <div>
      <FormLabel className="text-base">Serviços a serem realizados</FormLabel>
      <FormDescription className="mb-3">
        Selecione os serviços que serão executados nesta ordem
      </FormDescription>
      
      <div className="rounded-md border border-border p-4 space-y-4">
        {tiposServico.map((tipo) => (
          <FormField
            key={tipo.value}
            control={form.control}
            name="servicosTipos"
            render={({ field }) => {
              const checked = field.value?.includes(tipo.value);
              
              // Registrar quando um serviço é renderizado
              console.log(`[ServicoTipoSelector] Renderizando serviço ${tipo.value}, checked: ${checked}`);
              
              // Verificar se existem subatividades salvas para este serviço
              if (checked) {
                const existingSubatividades = servicosSubatividades[tipo.value];
                if (existingSubatividades) {
                  console.log(`[ServicoTipoSelector] Subatividades existentes para ${tipo.value}:`, 
                    existingSubatividades.map(sub => ({ 
                      id: sub.id, 
                      nome: sub.nome, 
                      selecionada: sub.selecionada !== undefined ? sub.selecionada : false,
                      concluida: sub.concluida 
                    }))
                  );
                } else {
                  console.log(`[ServicoTipoSelector] Nenhuma subatividade encontrada para ${tipo.value}`);
                }
              }

              return (
                <FormItem key={tipo.value} className="flex flex-col space-y-3 my-4">
                  <div className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(checked) => {
                          const updatedValue = checked
                            ? [...(field.value || []), tipo.value]
                            : field.value?.filter((value) => value !== tipo.value) || [];
                          field.onChange(updatedValue);
                          
                          // Log para depuração quando um serviço é selecionado/deselecionado
                          if (checked) {
                            console.log(`[ServicoTipoSelector] Serviço ${tipo.value} selecionado`);
                          } else {
                            console.log(`[ServicoTipoSelector] Serviço ${tipo.value} deselecionado`);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="flex items-center">
                      <FormLabel className="font-normal">{tipo.label}</FormLabel>
                      {checked && getSourceBadge(tipo.value)}
                    </div>
                  </div>

                  {/* Renderiza as subatividades se o serviço estiver selecionado */}
                  {checked && (
                    <div>
                      <ServicoSubatividades
                        tipoServico={tipo.value}
                        subatividades={servicosSubatividades[tipo.value] || []}
                        onChange={getMemoizedChangeHandler(tipo.value)}
                      />
                    </div>
                  )}
                </FormItem>
              );
            }}
          />
        ))}
      </div>
    </div>
  );
});

ServicoTipoSelector.displayName = "ServicoTipoSelector";
