
import { OrdemServico } from "@/types/ordens";

interface ClienteMotorInfoProps {
  ordem: OrdemServico;
}

export const ClienteMotorInfo = ({ ordem }: ClienteMotorInfoProps) => {
  const cliente = ordem.cliente;
  const motor = cliente.motores?.find(m => m.id === ordem.motorId);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Cliente</h4>
        <p className="font-medium">{cliente.nome}</p>
        <p className="text-sm text-muted-foreground">{cliente.email || 'Email não informado'}</p>
        <p className="text-sm text-muted-foreground">{cliente.telefone || 'Telefone não informado'}</p>
      </div>
      
      <div className="pt-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Motor</h4>
        {motor ? (
          <div className="space-y-3">
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
                <p className="font-medium">{motor.cilindradas || "N/A"}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Número de Série</p>
              <p className="font-medium">{motor.numeroSerie || "N/A"}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Motor não encontrado</p>
        )}
      </div>
    </div>
  );
};
