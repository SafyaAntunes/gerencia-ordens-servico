
import { OrdemServico } from "@/types/ordens";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import ServicoTag from "./ServicoTag";

interface OrdemListRowDetailsProps {
  ordem: OrdemServico;
  isOverdue?: boolean;
}

export default function OrdemListRowDetails({ 
  ordem,
  isOverdue = false
}: OrdemListRowDetailsProps) {
  // Formato da data de entrega
  const timeUntilDeadline = ordem.dataPrevistaEntrega 
    ? formatDistance(
        new Date(ordem.dataPrevistaEntrega), 
        new Date(),
        { addSuffix: true, locale: ptBR }
      )
    : 'Data não definida';

  // Get priority badge styling
  const getPrioridadeBadgeVariant = () => {
    switch (ordem.prioridade) {
      case 'baixa': return 'outline';
      case 'media': return 'secondary';
      case 'alta': return 'warning';
      case 'urgente': return 'destructive';
      default: return 'outline';
    }
  };
  
  // Get priority text
  const getPrioridadeText = () => {
    switch (ordem.prioridade) {
      case 'baixa': return 'Baixa';
      case 'media': return 'Média';
      case 'alta': return 'Alta';
      case 'urgente': return 'Urgente';
      default: return ordem.prioridade;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3">
      {/* Serviços */}
      <div className="md:col-span-3 flex flex-wrap gap-1">
        {ordem.servicos?.map((servico) => (
          <ServicoTag 
            key={servico.tipo} 
            tipo={servico.tipo} 
            concluido={servico.concluido} 
          />
        ))}
      </div>
      
      {/* Prioridade */}
      <div className="md:col-span-1 flex flex-col">
        <span className="text-xs text-muted-foreground mb-0.5">Prioridade:</span>
        <Badge variant={getPrioridadeBadgeVariant()}>
          {getPrioridadeText()}
        </Badge>
      </div>
      
      {/* Data de entrega */}
      <div className="md:col-span-2 flex flex-col">
        <span className="text-xs text-muted-foreground mb-0.5">Entrega:</span>
        <span className={isOverdue ? "text-red-600 font-medium" : ""}>
          {timeUntilDeadline}
        </span>
      </div>
    </div>
  );
}
