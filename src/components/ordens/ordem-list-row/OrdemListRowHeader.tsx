
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MoveVertical } from "lucide-react";

interface OrdemListRowHeaderProps {
  ordem: OrdemServico;
  index: number;
  isAtrasada?: boolean;
}

export default function OrdemListRowHeader({ ordem, index, isAtrasada = false }: OrdemListRowHeaderProps) {
  return (
    <div className={`grid grid-cols-12 gap-2 p-4 pb-2 items-center border-b ${
      isAtrasada ? 'border-red-200' : 'border-gray-100'
    }`}>
      {/* Número de ordenação */}
      <div className="col-span-1 flex items-center">
        <div className={`${isAtrasada ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'} rounded-full w-7 h-7 flex items-center justify-center mr-2 text-sm font-semibold`}>
          {index + 1}
        </div>
        <MoveVertical size={16} className="text-gray-400" />
      </div>

      {/* OS Número */}
      <div className="col-span-1">
        <div className="text-xs text-gray-500 mb-0.5">OS</div>
        <div className={`font-semibold ${isAtrasada ? 'text-red-700' : 'text-gray-900'}`}>
          {ordem.id.substring(0, 8)}
        </div>
      </div>

      {/* Cliente */}
      <div className="col-span-3">
        <div className="text-xs text-gray-500 mb-0.5">Cliente</div>
        <div className={`font-medium ${isAtrasada ? 'text-red-700' : 'text-gray-900'}`}>
          {ordem.cliente?.nome || "Cliente não especificado"}
        </div>
      </div>

      {/* Status */}
      <div className="col-span-3">
        <div className="text-xs text-gray-500 mb-0.5">Status</div>
        <StatusBadge status={ordem.status} size="md" />
      </div>
      
      {/* Prioridade */}
      <div className="col-span-2">
        <div className="text-xs text-gray-500 mb-0.5">Prioridade</div>
        <StatusBadge status={ordem.prioridade || "media"} size="md" />
      </div>

      {/* Data de Entrada */}
      <div className="col-span-2 text-right">
        <div className="text-xs text-gray-500 mb-0.5">Data de Entrada</div>
        <div className="text-gray-600">
          {ordem.dataAbertura ? 
            format(new Date(ordem.dataAbertura), "dd/MM/yy", { locale: ptBR }) :
            "N/D"}
        </div>
      </div>
    </div>
  );
}
