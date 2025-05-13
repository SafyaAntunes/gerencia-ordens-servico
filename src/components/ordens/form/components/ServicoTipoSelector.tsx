
import { memo, useCallback, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { ServicoSubatividades } from "@/components/ordens/subatividades";
import { tiposServico } from "../types";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";

interface ServicoTipoSelectorProps {
  form: UseFormReturn<FormValues>;
  servicosSubatividades: Record<string, SubAtividade[]>;
  onSubatividadesChange: (tipo: TipoServico, subatividades: SubAtividade[]) => void;
}

// Memoize the component to prevent unnecessary re-renders
export const ServicoTipoSelector = memo(({ 
  form, 
  servicosSubatividades,
  onSubatividadesChange 
}: ServicoTipoSelectorProps) => {
  // Get default subatividades for fallback
  const { defaultSubatividades } = useServicoSubatividades();
  
  // Use useCallback to memoize handleSubatividadeChange for each tipo
  const getMemoizedChangeHandler = useCallback((tipo: TipoServico) => {
    return (subatividades: SubAtividade[]) => {
      onSubatividadesChange(tipo, subatividades);
    };
  }, [onSubatividadesChange]);
  
  // Effect to ensure we have subatividades for each selected service type
  useEffect(() => {
    const servicosTipos = form.getValues("servicosTipos") || [];
    
    servicosTipos.forEach(tipo => {
      // If there are no subatividades for this service type but we have defaults, 
      // create basic subatividades from the defaults
      if ((!servicosSubatividades[tipo] || servicosSubatividades[tipo].length === 0) && 
          defaultSubatividades && defaultSubatividades[tipo as TipoServico]) {
        
        const defaultSubs = defaultSubatividades[tipo as TipoServico].map(nome => ({
          id: nome,
          nome,
          selecionada: true,
          concluida: false,
        }));
        
        onSubatividadesChange(tipo as TipoServico, defaultSubs);
      }
    });
  }, [form, servicosSubatividades, defaultSubatividades, onSubatividadesChange]);
  
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

              return (
                <FormItem key={tipo.value} className="flex flex-col space-y-3 my-4">
                  <div className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(checked) => {
                          const updatedValue = checked
                            ? [...(field.value || []), tipo.value]
                            : field.value?.filter((value) => value !== tipo.value) || [];
                          field.onChange(updatedValue);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">{tipo.label}</FormLabel>
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
