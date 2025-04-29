
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
      className="group bg-white hover:bg-gray-50 border border-gray-200 rounded-lg mb-3 shadow-sm transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Cabeçalho com informações principais */}
      <div className="grid grid-cols-12 gap-2 p-4 pb-2 items-center border-b border-gray-100">
        {/* OS Número */}
        <div className="col-span-1">
          <div className="font-semibold text-gray-900">
            {ordem.id}
          </div>
        </div>

        {/* Cliente */}
        <div className="col-span-3">
          <div className="font-medium text-gray-900">
            {clienteNome}
          </div>
        </div>

        {/* Status */}
        <div className="col-span-3">
          <StatusBadge status={ordem.status} size="md" />
        </div>
        
        {/* Prioridade */}
        <div className="col-span-2">
          <StatusBadge status={ordem.prioridade || "media"} size="md" />
        </div>

        {/* Data de Entrada */}
        <div className="col-span-3 text-gray-600">
          {ordem.dataAbertura ? 
            format(new Date(ordem.dataAbertura), "dd/MM/yy", { locale: ptBR }) :
            "N/D"}
        </div>
      </div>

      {/* Informações secundárias */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 items-center">
        {/* Descrição */}
        <div className="col-span-8">
          <div className="text-sm font-medium text-gray-900 mb-1">Descrição</div>
          <div className="text-sm text-gray-700">
            {ordem.nome || "Sem título"}
          </div>
        </div>

        {/* Data de Término */}
        <div className="col-span-4">
          <div className="text-sm font-medium text-gray-900 mb-1">Data de Término</div>
          <div className="text-sm text-gray-700">
            {ordem.dataPrevistaEntrega ? 
              format(new Date(ordem.dataPrevistaEntrega), "dd/MM/yy", { locale: ptBR }) :
              "N/D"}
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
          <span>Progresso</span>
          <span>{progresso}%</span>
        </div>
        <Progress value={progresso} className="h-2" />
      </div>
    </div>
  );
}
