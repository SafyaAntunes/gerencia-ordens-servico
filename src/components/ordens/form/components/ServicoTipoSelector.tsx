
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface ServicoTipoSelectorProps {
  form: UseFormReturn<FormValues>;
  onServicoDescricaoChange?: (tipo: string, descricao: string) => void;
  servicosDescricoes?: Record<string, string>;
}

export function ServicoTipoSelector({
  form,
  onServicoDescricaoChange,
  servicosDescricoes = {}
}: ServicoTipoSelectorProps) {
  const servicosTipos = form.watch("servicosTipos") || [];

  // Helper para obter o label amigável do tipo de serviço
  const getServicoLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_inicial: "Inspeção Inicial",
      inspecao_final: "Inspeção Final",
      lavagem: "Lavagem"
    };
    return labels[tipo] || tipo;
  };

  // Lista de serviços disponíveis
  const servicosDisponiveis = [
    { value: "bloco", label: "Bloco" },
    { value: "biela", label: "Biela" },
    { value: "cabecote", label: "Cabeçote" },
    { value: "virabrequim", label: "Virabrequim" },
    { value: "eixo_comando", label: "Eixo de Comando" },
    { value: "montagem", label: "Montagem" },
    { value: "dinamometro", label: "Dinamômetro" },
    { value: "lavagem", label: "Lavagem" },
    { value: "inspecao_inicial", label: "Inspeção Inicial" },
    { value: "inspecao_final", label: "Inspeção Final" }
  ];

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="servicosTipos"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel className="text-base">Serviços</FormLabel>
              <FormDescription>
                Selecione os tipos de serviço para esta ordem
              </FormDescription>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {servicosDisponiveis.map((item) => (
                <FormField
                  key={item.value}
                  control={form.control}
                  name="servicosTipos"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.value}
                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.value)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.value])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item.value
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Descrições dos serviços selecionados */}
      {servicosTipos.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-md font-medium">Detalhes dos Serviços</h3>
          <div className="space-y-4">
            {servicosTipos.map((tipo) => (
              <div key={tipo} className="border rounded-md p-4">
                <h4 className="font-medium mb-2">{getServicoLabel(tipo)}</h4>
                <Textarea
                  placeholder={`Descrição para o serviço de ${getServicoLabel(
                    tipo
                  ).toLowerCase()}...`}
                  value={servicosDescricoes[tipo] || ""}
                  onChange={(e) => {
                    if (onServicoDescricaoChange) {
                      onServicoDescricaoChange(tipo, e.target.value);
                    }
                  }}
                  className="resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
