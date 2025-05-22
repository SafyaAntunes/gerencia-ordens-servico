
import React from "react";
import { OrdemServico } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemListRowHeaderProps {
  ordem: OrdemServico;
  index: number;
  isAtrasada?: boolean;
}

export default function OrdemListRowHeader({ ordem, index, isAtrasada = false }: OrdemListRowHeaderProps) {
  // Formatar data com segurança
  const formatDateSafely = (date: any) => {
    if (!date) return "N/D";
    
    try {
      // Ensure date is a Date object
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, "dd/MM/yy", { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error, date);
      return "Data inválida";
    }
  };

  // Conversão de status legado - usando Type Assertion para evitar erro de tipo
  const normalizedStatus = ordem.status === 'fabricacao' ? 
    'executando_servico' as const : 
    ordem.status;
  
  // Log para debug
  console.log(`Ordem ${ordem.id} - Status: ${normalizedStatus}`);

  return (
    <div className={`grid grid-cols-12 gap-4 px-6 py-3 items-center bg-gray-50 ${
      isAtrasada ? 'bg-red-50 border-b border-red-200' : 'border-b border-gray-200'
    }`}>
      {/* OS ID */}
      <div className="col-span-1">
        <div className="text-sm text-gray-500">OS</div>
        <div className={`font-medium ${isAtrasada ? 'text-red-700' : 'text-gray-900'}`}>
          #{ordem.id.substring(0, 8)}
        </div>
      </div>
      
      {/* Cliente */}
      <div className="col-span-3">
        <div className="text-sm text-gray-500">Observação</div>
        <div className={`font-medium truncate ${isAtrasada ? 'text-red-700' : 'text-gray-900'}`}>
          {ordem.nome || "Sem título"}
        </div>
      </div>
      
      {/* Cliente */}
      <div className="col-span-2">
        <div className="text-sm text-gray-500">Cliente</div>
        <div className={`font-medium truncate ${isAtrasada ? 'text-red-700' : 'text-gray-900'}`}>
          {ordem.cliente?.nome || "Cliente não identificado"}
        </div>
      </div>
      
      {/* Status */}
      <div className="col-span-4">
        <div className="text-sm text-gray-500 mb-1">Status</div>
        <div className="flex flex-wrap gap-1">
          <StatusBadge status={normalizedStatus} size="md" />
          
          <StatusBadge status={ordem.prioridade} size="sm" />
          
          {isAtrasada && (
            <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 text-xs px-2 py-0.5 font-medium">
              Atrasada
            </span>
          )}
        </div>
      </div>
      
      {/* Datas */}
      <div className="col-span-2 text-right">
        <div className="text-sm text-gray-500">Abertura</div>
        <div className={`text-sm ${isAtrasada ? 'text-red-700' : 'text-gray-900'}`}>
          {formatDateSafely(ordem.dataAbertura)}
        </div>
        
        <div className="text-sm text-gray-500 mt-1">Prazo</div>
        <div className={`text-sm ${isAtrasada ? 'text-red-700 font-medium' : 'text-gray-900'}`}>
          {formatDateSafely(ordem.dataPrevistaEntrega)}
        </div>
      </div>
    </div>
  );
}
