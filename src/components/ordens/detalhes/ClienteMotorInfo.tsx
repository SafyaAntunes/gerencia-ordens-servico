
import { OrdemServico } from "@/types/ordens";
import { Card, CardContent } from "@/components/ui/card";
import { Motor } from "@/types/clientes";

interface ClienteMotorInfoProps {
  ordem: OrdemServico;
}

export const ClienteMotorInfo = ({ ordem }: ClienteMotorInfoProps) => {
  const motor: Motor | undefined = ordem.cliente.motores?.find(m => m.id === ordem.motorId);

  if (!motor) {
    return (
      <div className="text-muted-foreground">
        Motor não encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Marca</p>
          <p className="font-medium">{motor.marca}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Modelo</p>
          <p className="font-medium">{motor.modelo}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Ano</p>
          <p className="font-medium">{motor.ano || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Cilindrada</p>
          <p className="font-medium">{motor.cilindrada || "N/A"}</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">Combustível</p>
        <p className="font-medium">{motor.combustivel || "N/A"}</p>
      </div>
    </div>
  );
};
