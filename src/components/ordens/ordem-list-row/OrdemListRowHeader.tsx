
import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MoveVertical } from "lucide-react";

interface OrdemListRowHeaderProps {
  ordem: OrdemServico;
  index: number;
}

export default function OrdemListRowHeader({ ordem, index }: OrdemListRowHeaderProps) {
  // Tratamento seguro para o nome do cliente
  const clienteNome = ordem.cliente?.nome || "Cliente não especificado";
  
  return (
    <div className="grid grid-cols-12 gap-2 p-4 pb-2 items-center border-b border-gray-100">
      {/* Número de ordenação */}
      <div className="col-span-1 flex items-center">
        <div className="bg-gray-100 text-gray-600 rounded-full w-7 h-7 flex items-center justify-center mr-2 text-sm font-semibold">
          {index + 1}
        </div>
        <MoveVertical size={16} className="text-gray-400" />
      </div>

      {/* OS Número */}
      <div className="col-span-1">
        <div className="text-xs text-gray-500 mb-0.5">OS</div>
        <div className="font-semibold text-gray-900">
          {ordem.id?.substring(0, 6) || "N/D"}
        </div>
      </div>

      {/* Cliente */}
      <div className="col-span-3">
        <div className="text-xs text-gray-500 mb-0.5">Cliente</div>
        <div className="font-medium text-gray-900">
          {clienteNome}
        </div>
      </div>

      {/* Status */}
      <div className="col-span-3">
        <div className="text-xs text-gray-500 mb-0.5">Status</div>
        <StatusBadge status={ordem.status || "fabricacao"} size="md" />
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
