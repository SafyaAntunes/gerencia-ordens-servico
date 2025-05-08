
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Search, Wrench, Gauge, CheckCircle } from "lucide-react";
import { EtapaOS } from "@/types/ordens";

interface EtapasSelectorProps {
  etapasAtivas: EtapaOS[];
  selectedEtapa: EtapaOS | null;
  etapasDisponiveis: {
    montagem: boolean;
    dinamometro: boolean;
  };
  onEtapaSelect: (etapa: EtapaOS) => void;
  isRetificaHabilitada: () => boolean;
  isInspecaoFinalHabilitada: () => boolean;
}

export function EtapasSelector({
  etapasAtivas,
  selectedEtapa,
  etapasDisponiveis,
  onEtapaSelect,
  isRetificaHabilitada,
  isInspecaoFinalHabilitada
}: EtapasSelectorProps) {
  const getEtapaIcon = (etapa: EtapaOS) => {
    switch (etapa) {
      case 'lavagem':
        return <Clock className="h-4 w-4 mr-2" />;
      case 'inspecao_inicial':
        return <Search className="h-4 w-4 mr-2" />;
      case 'retifica':
        return <Wrench className="h-4 w-4 mr-2" />;
      case 'montagem':
        return <Wrench className="h-4 w-4 mr-2" />;
      case 'dinamometro':
        return <Gauge className="h-4 w-4 mr-2" />;
      case 'inspecao_final':
        return <CheckCircle className="h-4 w-4 mr-2" />;
      default:
        return <Clock className="h-4 w-4 mr-2" />;
    }
  };

  const getEtapaTitulo = (etapa: EtapaOS) => {
    const etapaLabel: Record<EtapaOS, string> = {
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      retifica: "Retífica",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_final: "Inspeção Final"
    };
    
    return etapaLabel[etapa] || etapa;
  };

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {etapasAtivas.map(etapa => {
          const isDisabled =
            (etapa === 'retifica' && !isRetificaHabilitada()) ||
            (etapa === 'inspecao_final' && !isInspecaoFinalHabilitada()) ||
            (etapa === 'montagem' && !etapasDisponiveis.montagem) ||
            (etapa === 'dinamometro' && !etapasDisponiveis.dinamometro);

          return (
            <Button
              key={etapa}
              variant={selectedEtapa === etapa ? "default" : "outline"}
              className="flex items-center"
              onClick={() => {
                !isDisabled && onEtapaSelect(etapa);
              }}
              disabled={isDisabled}
            >
              {getEtapaIcon(etapa)}
              {getEtapaTitulo(etapa)}
              {isDisabled && (
                <Badge variant="outline" className="ml-2 text-xs bg-opacity-50">
                  Bloqueado
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
      <Separator className="my-4" />
    </>
  );
}
