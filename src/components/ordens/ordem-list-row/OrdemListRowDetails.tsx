
import { OrdemServico } from "@/types/ordens";
import ServicoTag from "./ServicoTag";

interface OrdemListRowDetailsProps {
  ordem: OrdemServico;
  isOverdue?: boolean;
}

export default function OrdemListRowDetails({ 
  ordem,
  isOverdue = false 
}: OrdemListRowDetailsProps) {
  // Sort services to show the in-progress ones first
  const sortedServicos = [...(ordem.servicos || [])].sort((a, b) => {
    // First priority: services that have a worker assigned
    if (a.funcionarioId && !b.funcionarioId) return -1;
    if (!a.funcionarioId && b.funcionarioId) return 1;
    
    // Second priority: completed status
    if (a.concluido && !b.concluido) return 1;
    if (!a.concluido && b.concluido) return -1;
    
    return 0;
  });
  
  return (
    <div className={`p-3 ${isOverdue ? 'bg-red-50' : ''}`}>
      <div className="flex flex-col space-y-2">
        <div className="flex flex-wrap gap-2">
          {sortedServicos.map((servico, index) => (
            <ServicoTag 
              key={`${servico.tipo}-${index}`} 
              tipo={servico.tipo}
              concluido={servico.concluido}
              emAndamento={Boolean(servico.funcionarioId)}
              pausado={false}
            />
          ))}
        </div>
        
        {ordem.cliente?.id && (
          <div className="text-sm mt-2">
            <span className="font-medium">Motor: </span>
            <span className="text-muted-foreground">
              {ordem.motorId ? '✓' : '✗'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
