
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { MoveVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrdemListRowProps {
  ordem: OrdemServico;
  index: number;
  onReorder: (dragIndex: number, dropIndex: number) => void;
  onClick: () => void;
}

export default function OrdemListRow({ ordem, index, onReorder, onClick }: OrdemListRowProps) {
  const clienteNome = ordem.cliente?.nome || "Cliente não especificado";
  const progresso = ordem.progressoEtapas !== undefined ? Math.round(ordem.progressoEtapas * 100) : 0;
  
  // Determina a cor de destaque com base no status ou progresso da ordem
  const getStatusColor = () => {
    if (ordem.status === "finalizado" || ordem.status === "entregue") {
      return "border-l-4 border-l-green-500 bg-green-50";
    } else if (progresso > 0 && progresso < 100) {
      return "border-l-4 border-l-blue-500 bg-blue-50";
    } else if (ordem.status === "aguardando_peca_cliente" || ordem.status === "aguardando_peca_interno") {
      return "border-l-4 border-l-yellow-500 bg-yellow-50";
    } else {
      return "border-l-4 border-l-red-500 bg-red-50";
    }
  };

  // Define a cor do indicador de progresso baseado no valor
  const getProgressColor = () => {
    if (progresso === 100) {
      return "bg-green-500";
    } else if (progresso >= 75) {
      return "bg-emerald-500";
    } else if (progresso >= 25) {
      return "bg-blue-500";
    } else {
      return "bg-red-500";
    }
  };

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
      className={`group hover:shadow-md border rounded-lg mb-3 shadow-sm transition-all duration-200 cursor-pointer overflow-hidden ${getStatusColor()}`}
    >
      {/* Cabeçalho com informações principais */}
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
            {ordem.id}
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

      {/* Informações secundárias */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 items-center">
        {/* Descrição */}
        <div className="col-span-8">
          <div className="text-sm font-medium text-gray-900 mb-1">Descrição</div>
          <div className="text-sm text-gray-700">
            {ordem.nome || "Sem título"}
          </div>
          
          {/* Lista de serviços */}
          {ordem.servicos && ordem.servicos.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-gray-500 mb-1">Serviços:</div>
              <div className="flex flex-wrap gap-1">
                {ordem.servicos.map((servico, idx) => (
                  <span 
                    key={`${servico.tipo}-${idx}`}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      servico.concluido 
                        ? "bg-green-100 text-green-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {servico.tipo.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data de Término */}
        <div className="col-span-4 text-right">
          <div className="text-sm font-medium text-gray-900 mb-1">Data de Término</div>
          <div className="text-sm text-gray-700">
            {ordem.dataPrevistaEntrega ? 
              format(new Date(ordem.dataPrevistaEntrega), "dd/MM/yy", { locale: ptBR }) :
              "N/D"}
          </div>
          
          {/* Etapas concluídas */}
          {ordem.etapasAndamento && (
            <div className="mt-2 text-xs">
              <div className="text-gray-500">Etapas concluídas:</div>
              <div>
                {Object.entries(ordem.etapasAndamento)
                  .filter(([_, etapa]) => etapa.concluido)
                  .map(([etapaKey], idx, arr) => (
                    <span key={etapaKey}>
                      {etapaKey.replace('_', ' ')}
                      {idx < arr.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                {Object.entries(ordem.etapasAndamento).filter(([_, etapa]) => etapa.concluido).length === 0 && 
                  <span>Nenhuma</span>
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progresso */}
      <div className="px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
          <span>Progresso</span>
          <span>{progresso}%</span>
        </div>
        <Progress 
          value={progresso} 
          className={cn("h-2", getProgressColor())}
        />
      </div>
    </div>
  );
}
