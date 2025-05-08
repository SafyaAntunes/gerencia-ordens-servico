
import { OrdemServico } from "@/types/ordens";
import { Badge } from "@/components/ui/badge";

interface OrdemListRowHeaderProps {
  ordem: OrdemServico;
  index: number;
  isOverdue?: boolean;
}

export default function OrdemListRowHeader({ 
  ordem,
  index,
  isOverdue = false
}: OrdemListRowHeaderProps) {
  // Get status badge styling
  const getStatusBadgeVariant = () => {
    switch (ordem.status) {
      case 'aguardando_aprovacao': return 'warning';
      case 'fabricacao': return 'default';
      case 'finalizado': return 'success';
      case 'entregue': return 'success';
      case 'aguardando_peca_cliente':
      case 'aguardando_peca_interno': return 'warning';
      default: return 'secondary';
    }
  };
  
  // Get status text
  const getStatusText = () => {
    switch (ordem.status) {
      case 'orcamento': return 'Orçamento';
      case 'aguardando_aprovacao': return 'Aguardando Aprovação';
      case 'fabricacao': return 'Em Fabricação';
      case 'aguardando_peca_cliente': return 'Aguardando Peça (Cliente)';
      case 'aguardando_peca_interno': return 'Aguardando Peça (Interno)';
      case 'finalizado': return 'Finalizado';
      case 'entregue': return 'Entregue';
      default: return ordem.status;
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border-b">
      <div className="md:col-span-2">
        <div className="flex flex-col">
          <div className="text-lg font-medium">
            {ordem.id && <span className="mr-2 text-sm font-bold bg-primary/10 px-2 py-0.5 rounded-md">{ordem.id}</span>}
            {ordem.nome}
          </div>
          <div className="text-sm text-muted-foreground">{ordem.cliente?.nome}</div>
        </div>
      </div>
      <div className="flex justify-end items-start space-x-2">
        <Badge variant={getStatusBadgeVariant()}>
          {getStatusText()}
        </Badge>
        {isOverdue && (
          <Badge variant="destructive">
            Atrasada
          </Badge>
        )}
      </div>
    </div>
  );
}
