
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Hash } from "lucide-react";
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
      className="group bg-card border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 mb-4"
    >
      <div className="grid grid-cols-12 gap-4 p-6">
        {/* Ordem de Serviço */}
        <div className="col-span-2 flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-medium">
            {index + 1}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{ordem.id}</span>
            </div>
            <StatusBadge status={ordem.status} size="sm" />
          </div>
        </div>

        {/* Descrição */}
        <div className="col-span-3">
          <h3 className="font-semibold">{ordem.nome || "Sem título"}</h3>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <span className="text-xs text-muted-foreground">{progresso}%</span>
            </div>
            <Progress value={progresso} className="h-2" />
          </div>
        </div>

        {/* Cliente */}
        <div className="col-span-2">
          <p className="font-medium">{clienteNome}</p>
        </div>

        {/* Status e Prioridade */}
        <div className="col-span-3 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <StatusBadge status={ordem.status} size="sm" />
            <StatusBadge status={ordem.prioridade || "media"} size="sm" />
          </div>
          {ordem.valorTotal && (
            <div className="font-medium">{formatCurrency(ordem.valorTotal)}</div>
          )}
        </div>

        {/* Datas */}
        <div className="col-span-2 flex flex-col gap-1 text-sm text-muted-foreground">
          <div>
            Abertura: {ordem.dataAbertura ? 
              format(new Date(ordem.dataAbertura), "dd MMM yyyy", { locale: ptBR }) :
              "Data não definida"}
          </div>
          <div>
            Previsão: {ordem.dataPrevistaEntrega ? 
              format(new Date(ordem.dataPrevistaEntrega), "dd MMM yyyy", { locale: ptBR }) :
              "Não definida"}
          </div>
        </div>
      </div>
    </div>
  );
}
