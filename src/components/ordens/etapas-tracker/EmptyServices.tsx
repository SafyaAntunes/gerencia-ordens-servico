
import { EtapaOS } from "@/types/ordens";
import { Card } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

interface EmptyServicesProps {
  etapa: EtapaOS;
}

export function EmptyServices({ etapa }: EmptyServicesProps) {
  // Obter rótulo personalizado com base na etapa
  const getEtapaLabel = () => {
    switch (etapa) {
      case 'lavagem':
        return 'serviços de lavagem';
      case 'inspecao_inicial':
        return 'serviços de inspeção inicial';
      case 'inspecao_final':
        return 'serviços de inspeção final';
      case 'retifica':
        return 'serviços de retífica';
      case 'montagem':
        return 'serviços de montagem';
      case 'dinamometro':
        return 'serviços de dinamômetro';
      default:
        return 'serviços';
    }
  };

  return (
    <Card className="p-8 flex flex-col items-center justify-center text-center">
      <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Nenhum serviço encontrado</h3>
      <p className="text-muted-foreground mt-1">
        Não há {getEtapaLabel()} disponíveis para esta ordem de serviço.
      </p>
    </Card>
  );
}
