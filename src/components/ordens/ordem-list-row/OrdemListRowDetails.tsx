
import React, { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico } from "@/types/ordens";
import ServicoTag from "./ServicoTag";

interface OrdemListRowDetailsProps {
  ordem: OrdemServico;
}

export default function OrdemListRowDetails({ ordem }: OrdemListRowDetailsProps) {
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

  return (
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
                <ServicoTag
                  key={`${servico.tipo}-${idx}`}
                  servico={servico}
                  emAndamento={isServicoEmAndamento(servico)}
                  pausado={isServicoPausado(servico)}
                />
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
  );
}
