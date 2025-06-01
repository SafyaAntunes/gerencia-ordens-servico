
import { OrdemServico } from "@/types/ordens";

interface ClienteMotorInfoProps {
  ordem: OrdemServico;
}

export const ClienteMotorInfo = ({ ordem }: ClienteMotorInfoProps) => {
  const cliente = ordem.cliente;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Cliente</h4>
        <p className="font-medium">{cliente.nome}</p>
        <p className="text-sm text-muted-foreground">{cliente.email || 'Email não informado'}</p>
        <p className="text-sm text-muted-foreground">{cliente.telefone || 'Telefone não informado'}</p>
      </div>
    </div>
  );
};
