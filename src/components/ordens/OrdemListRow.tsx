
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Calendar, User } from "lucide-react";
import { OrdemServico } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface OrdemListRowProps {
  ordem: OrdemServico;
  index: number;
  onReorder: (dragIndex: number, dropIndex: number) => void;
  onClick: () => void;
}

export default function OrdemListRow({ ordem, index, onReorder, onClick }: OrdemListRowProps) {
  const clienteNome = ordem.cliente?.nome || "Cliente não especificado";
  const progresso = ordem.progressoEtapas !== undefined ? Math.round(ordem.progressoEtapas * 100) : 0;
  const statusConcluido = progresso === 100;

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
      className="group bg-white hover:bg-gray-50 border border-gray-100 rounded-md mb-2 shadow-sm transition-all duration-200 cursor-pointer"
    >
      <div className="grid grid-cols-12 gap-2 p-4 items-center">
        {/* OS Number & Name */}
        <div className="col-span-4 flex items-center space-x-3">
          <div className="flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-medium">
            {ordem.id}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 line-clamp-1">{ordem.nome || "Sem título"}</h3>
            <p className="text-sm text-gray-500">#{index + 1}</p>
          </div>
        </div>

        {/* Cliente */}
        <div className="col-span-3">
          <p className="font-medium text-gray-900">{clienteNome}</p>
          {ordem.etapasAndamento && Object.values(ordem.etapasAndamento).some(etapa => etapa?.funcionarioNome) && (
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <User className="h-3 w-3 mr-1" />
              <span className="truncate">
                {Object.values(ordem.etapasAndamento)
                  .filter(etapa => etapa?.funcionarioNome)
                  .map(etapa => etapa?.funcionarioNome)
                  .join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Status e Prioridade */}
        <div className="col-span-3 flex flex-col space-y-2">
          <StatusBadge status={ordem.status} size="sm" />
          <StatusBadge status={ordem.prioridade || "media"} size="sm" />
        </div>

        {/* Datas e Progresso */}
        <div className="col-span-2 text-xs text-gray-500">
          <div className="flex items-center mb-1">
            <Calendar className="h-3 w-3 mr-1" />
            <span>
              {ordem.dataAbertura ? 
                format(new Date(ordem.dataAbertura), "dd/MM/yy", { locale: ptBR }) :
                "N/D"}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {ordem.dataPrevistaEntrega ? 
                format(new Date(ordem.dataPrevistaEntrega), "dd/MM/yy", { locale: ptBR }) :
                "N/D"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="col-span-12 mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${statusConcluido ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-xs font-medium text-gray-500">{progresso}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
