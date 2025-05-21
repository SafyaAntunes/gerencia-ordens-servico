
import React, { useEffect } from "react";
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
  
  // Define a cor do indicador de progresso baseado no valor
  const getProgressColor = () => {
    return "bg-blue-500"; // Mantém a parte concluída da barra de progresso azul
  };

  // Define a cor de fundo para cada serviço de acordo com seu status
  const getServicoStatusColor = (concluido: boolean, estaEmAndamento: boolean = false, estaPausado: boolean = false) => {
    if (concluido) {
      return "bg-green-100 text-green-800"; // Verde para serviços concluídos
    } else if (estaPausado) {
      return "bg-yellow-100 text-yellow-800"; // Amarelo para serviços pausados
    } else if (estaEmAndamento) {
      return "bg-blue-100 text-blue-800"; // Azul para serviços em andamento
    } else {
      return "bg-red-100 text-red-800"; // Vermelho para serviços não iniciados
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

  // Verificar se um serviço está em andamento (iniciado mas não concluído)
  const isServicoEmAndamento = (servico: any) => {
    // Se o serviço estiver concluído, não está em andamento
    if (servico.concluido) return false;
    
    // Verificações para determinar se está em andamento
    
    // 1. Verificar se tem funcionário atribuído
    if (servico.funcionarioId) return true;
    
    // 2. Verificar se tem data de início
    if (servico.dataInicio) return true;
    
    // 3. Verificação nas etapasAndamento
    if (typeof servico.tipo === 'string' && ordem.etapasAndamento) {
      // 3.1 Verificar etapa direta correspondente ao tipo
      const etapaDireta = ordem.etapasAndamento[servico.tipo as any];
      if (etapaDireta?.iniciado && !etapaDireta?.concluido) return true;
      
      // 3.2 Verificar etapa de retífica para serviços específicos
      if (['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo) && 
          ordem.etapasAndamento['retifica']?.iniciado && 
          !ordem.etapasAndamento['retifica']?.concluido) {
        return true;
      }
      
      // 3.3 Verificar etapas específicas que possam estar associadas a este serviço
      for (const [etapaKey, etapaValue] of Object.entries(ordem.etapasAndamento)) {
        const etapaObj = etapaValue as any;
        if (etapaObj?.servicoTipo === servico.tipo && etapaObj.iniciado && !etapaObj.concluido) {
          return true;
        }
      }
    }
    
    // 4. Verificar timer ativo (caso o serviço tenha um timer associado)
    if (ordem.timers && ordem.timers[servico.tipo] && ordem.timers[servico.tipo].isRunning) {
      return true;
    }
    
    return false;
  };

  // Verificar se um serviço está pausado
  const isServicoPausado = (servico: any) => {
    // Se estiver explicitamente marcado como pausado
    if (!servico.concluido && servico.pausado === true) return true;
    
    // Verificação nas etapasAndamento
    if (typeof servico.tipo === 'string' && ordem.etapasAndamento) {
      // Verificar etapa direta
      const etapaDireta = ordem.etapasAndamento[servico.tipo as any];
      if (etapaDireta?.pausas?.length > 0 && etapaDireta.pausas.some(p => !p.fim)) return true;
      
      // Verificar etapa de retífica para serviços específicos
      if (['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo) && 
          ordem.etapasAndamento['retifica']?.pausas?.length > 0 && 
          ordem.etapasAndamento['retifica']?.pausas?.some(p => !p.fim)) {
        return true;
      }
      
      // Verificar outras etapas relacionadas
      for (const [etapaKey, etapaValue] of Object.entries(ordem.etapasAndamento)) {
        const etapaObj = etapaValue as any;
        if (etapaObj?.servicoTipo === servico.tipo && 
            etapaObj.pausas?.length > 0 && 
            etapaObj.pausas.some((p: any) => !p.fim)) {
          return true;
        }
      }
    }
    
    // Verificar timer pausado
    if (ordem.timers && ordem.timers[servico.tipo] && ordem.timers[servico.tipo].isPaused) {
      return true;
    }
    
    return false;
  };

  // Verificar os status dos serviços para debugging
  useEffect(() => {
    if (ordem?.servicos) {
      ordem.servicos.forEach(servico => {
        const emAndamento = isServicoEmAndamento(servico);
        const pausado = isServicoPausado(servico);
        console.log(`Serviço: ${servico.tipo}, Concluído: ${servico.concluido}, Em Andamento: ${emAndamento}, Pausado: ${pausado}`);
      });
    }
  }, [ordem]);

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onClick}
      className="group hover:shadow-md border rounded-lg mb-3 shadow-sm transition-all duration-200 cursor-pointer overflow-hidden bg-white"
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
        {/* Observação */}
        <div className="col-span-8">
          <div className="text-sm font-medium text-gray-900 mb-1">Observação</div>
          <div className="text-sm text-gray-700">
            {ordem.nome || "Sem título"}
          </div>
          
          {/* Lista de serviços */}
          {ordem.servicos && ordem.servicos.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-gray-500 mb-1">Serviços:</div>
              <div className="flex flex-wrap gap-1">
                {ordem.servicos.map((servico, idx) => {
                  const emAndamento = isServicoEmAndamento(servico);
                  const pausado = isServicoPausado(servico);
                  
                  return (
                    <span 
                      key={`${servico.tipo}-${idx}`}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        getServicoStatusColor(servico.concluido, emAndamento, pausado)
                      }`}
                    >
                      {servico.tipo.replace('_', ' ')}
                    </span>
                  );
                })}
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
          className="h-2 bg-gray-200"
          indicatorClassName={cn(getProgressColor())}
        />
      </div>
    </div>
  );
}
