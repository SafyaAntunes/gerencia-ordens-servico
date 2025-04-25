
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Hash } from "lucide-react";
import { OrdemServico } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
      className="group bg-white hover:bg-gray-50 border-b transition-colors duration-200"
    >
      <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
        {/* Headers */}
        {index === 0 && (
          <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-gray-100 text-gray-600 font-medium text-sm">
            <div className="col-span-1">OS</div>
            <div className="col-span-3">Descrição</div>
            <div className="col-span-2">Cliente</div>
            <div className="col-span-4">Status</div>
            <div className="col-span-2">Datas</div>
          </div>
        )}

        {/* OS Number */}
        <div className="col-span-1 flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-medium">
            {index + 1}
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Hash className="h-4 w-4" />
            {ordem.id}
          </div>
        </div>

        {/* Descrição */}
        <div className="col-span-3">
          <h3 className="font-medium text-gray-900">{ordem.nome || "Sem título"}</h3>
        </div>

        {/* Cliente */}
        <div className="col-span-2">
          <p className="text-gray-900">{clienteNome}</p>
        </div>

        {/* Status e Prioridade */}
        <div className="col-span-4 flex items-center gap-4">
          <StatusBadge status={ordem.status} size="md" />
          <StatusBadge status={ordem.prioridade || "media"} size="md" />
        </div>

        {/* Datas */}
        <div className="col-span-2 text-sm text-gray-500">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>Abertura:</span>
              <span>
                {ordem.dataAbertura ? 
                  format(new Date(ordem.dataAbertura), "dd MMM yyyy", { locale: ptBR }) :
                  "Data não definida"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Previsão:</span>
              <span>
                {ordem.dataPrevistaEntrega ? 
                  format(new Date(ordem.dataPrevistaEntrega), "dd MMM yyyy", { locale: ptBR }) :
                  "Não definida"}
              </span>
            </div>
          </div>
        </div>

        {/* Progresso (moved to the end) */}
        <div className="col-span-12 mt-2">
          <div className="flex items-center justify-between text-sm text-gray-500 px-6">
            <span>Progresso</span>
            <span>{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-1.5 mt-1 mx-6" />
        </div>
      </div>
    </div>
  );
}
