
import { Button } from "@/components/ui/button";
import { EtapaOS } from "@/types/ordens";
import { cn } from "@/lib/utils";
import { Wrench, Box, Activity, Droplets, Microscope, FileCheck2 } from "lucide-react";

interface EtapasSelectorProps {
  etapasAtivas: EtapaOS[];
  selectedEtapa: EtapaOS | null;
  etapasDisponiveis: Record<EtapaOS, boolean>;
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
  const etapasConfig = {
    retifica: {
      label: "Retífica",
      icon: <Wrench className="h-4 w-4 mr-2" />,
      color: "bg-blue-500",
      text: "text-blue-500",
      border: "border-blue-500",
      isHabilitada: isRetificaHabilitada
    },
    montagem: {
      label: "Montagem",
      icon: <Box className="h-4 w-4 mr-2" />,
      color: "bg-amber-500",
      text: "text-amber-500",
      border: "border-amber-500",
      isHabilitada: () => true
    },
    dinamometro: {
      label: "Dinamômetro",
      icon: <Activity className="h-4 w-4 mr-2" />,
      color: "bg-green-500",
      text: "text-green-500",
      border: "border-green-500",
      isHabilitada: () => true
    },
    lavagem: {
      label: "Lavagem",
      icon: <Droplets className="h-4 w-4 mr-2" />,
      color: "bg-cyan-500",
      text: "text-cyan-500",
      border: "border-cyan-500",
      isHabilitada: () => true
    },
    inspecao_inicial: {
      label: "Inspeção Inicial",
      icon: <Microscope className="h-4 w-4 mr-2" />,
      color: "bg-purple-500",
      text: "text-purple-500",
      border: "border-purple-500",
      isHabilitada: () => true
    },
    inspecao_final: {
      label: "Inspeção Final",
      icon: <FileCheck2 className="h-4 w-4 mr-2" />,
      color: "bg-emerald-500",
      text: "text-emerald-500",
      border: "border-emerald-500",
      isHabilitada: isInspecaoFinalHabilitada
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {etapasAtivas.map((etapa) => {
        const config = etapasConfig[etapa];
        const active = selectedEtapa === etapa;
        const disabled = !etapasDisponiveis[etapa] || !config.isHabilitada();
        
        return (
          <Button
            key={etapa}
            variant={active ? "default" : "outline"}
            className={cn(
              "transition-all",
              active ? config.color : config.text,
              !active && config.border,
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onEtapaSelect(etapa)}
            disabled={disabled}
          >
            {config.icon}
            {config.label}
          </Button>
        );
      })}
    </div>
  );
}
