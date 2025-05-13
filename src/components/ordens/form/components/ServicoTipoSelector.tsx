
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { ServicoSubatividades } from "@/components/ordens/subatividades";
import { tiposServico } from "../types";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";

interface ServicoTipoSelectorProps {
  form: UseFormReturn<FormValues>;
  servicosSubatividades: Record<string, SubAtividade[]>;
  onSubatividadesChange: (tipo: TipoServico, subatividades: SubAtividade[]) => void;
}

export const ServicoTipoSelector = ({ 
  form, 
  servicosSubatividades,
  onSubatividadesChange 
}: ServicoTipoSelectorProps) => {
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
                        onChange={(subatividades) => onSubatividadesChange(tipo.value, subatividades)}
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
};
