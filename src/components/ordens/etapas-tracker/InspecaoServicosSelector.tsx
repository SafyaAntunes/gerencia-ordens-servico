
import React from "react";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InspecaoServicosSelectorProps {
  etapa: EtapaOS;
  servicosTipo: TipoServico[];
  selectedServicoTipo?: TipoServico;
  onServicoTipoSelect: (tipo: TipoServico) => void;
}

export default function InspecaoServicosSelector({
  etapa,
  servicosTipo,
  selectedServicoTipo,
  onServicoTipoSelect
}: InspecaoServicosSelectorProps) {
  const etapaLabel = etapa === 'inspecao_inicial' ? 'Inspeção Inicial' : 'Inspeção Final';
  
  const getServicoLabel = (tipo: TipoServico) => {
    const labels: Record<string, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando"
    };
    
    return labels[tipo] || tipo;
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Selecione o tipo de serviço para {etapaLabel}</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {servicosTipo.map((tipo) => (
            <Button
              key={tipo}
              variant={selectedServicoTipo === tipo ? "default" : "outline"}
              size="sm"
              className="w-full"
              onClick={() => onServicoTipoSelect(tipo)}
            >
              {getServicoLabel(tipo)}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
