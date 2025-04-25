import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Hash, Calendar, Clock, MoveVertical } from "lucide-react";
import { OrdemServico } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface OrdemListRowProps {
  ordem: OrdemServico;
  index: number;
  onReorder: (dragIndex: number, dropIndex: number) => void;
  onClick: () => void;
}

export default function OrdemListRow({ ordem, index, onReorder, onClick }: OrdemListRowProps) {
  const clienteNome = ordem.cliente?.nome || "Cliente não especificado";
  const progresso = ordem.progressoEtapas !== undefined ? Math.round(ordem.progressoEtapas * 100) : 0;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    onReorder(dragIndex, index);
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onClick}
      className="group bg-card border rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-4 p-6">
        <button 
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-accent rounded-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          <MoveVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{ordem.id}</span>
            <StatusBadge status={ordem.status} size="sm" />
          </div>
          <h3 className="font-semibold">{ordem.nome || "Sem título"}</h3>
          <p className="text-sm text-muted-foreground">{clienteNome}</p>
        </div>

        <div className="hidden md:flex flex-col items-start gap-1 flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {ordem.dataAbertura ? 
                format(new Date(ordem.dataAbertura), "dd MMM yyyy", { locale: ptBR }) :
                "Data não definida"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Previsão: {ordem.dataPrevistaEntrega ? 
                format(new Date(ordem.dataPrevistaEntrega), "dd MMM yyyy", { locale: ptBR }) :
                "Não definida"}
            </span>
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-2 w-48">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-xs text-muted-foreground">{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        <div className="hidden lg:block text-right">
          {ordem.valorTotal && (
            <div className="font-medium">{formatCurrency(ordem.valorTotal)}</div>
          )}
          <StatusBadge status={ordem.prioridade || "media"} size="sm" />
        </div>
      </div>
    </div>
  );
}
