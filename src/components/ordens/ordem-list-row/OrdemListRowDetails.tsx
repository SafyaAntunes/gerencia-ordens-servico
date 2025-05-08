
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico } from "@/types/ordens";
import ServicoTag from "./ServicoTag";

interface OrdemListRowDetailsProps {
  ordem: OrdemServico;
  isAtrasada?: boolean;
}

export default function OrdemListRowDetails({ ordem, isAtrasada = false }: OrdemListRowDetailsProps) {
  // Verificar se um serviço está em andamento
  const isServicoEmAndamento = (servico: any) => {
    // Se o serviço estiver concluído, não está em andamento
    if (servico.concluido) return false;
    
    // Se tem funcionário atribuído, está em andamento
    if (servico.funcionarioId) return true;
    
    // Se tem data de início, está em andamento
    if (servico.dataInicio) return true;
    
    return false;
  };

  // Verificar se um serviço está pausado
  const isServicoPausado = (servico: any) => {
    // Se estiver explicitamente marcado como pausado
    if (!servico.concluido && servico.pausado === true) return true;
    
    return false;
  };

  return (
    <div className={`grid grid-cols-12 gap-2 px-4 py-2 items-center ${
      isAtrasada ? 'bg-red-50' : ''
    }`}>
      {/* Descrição */}
      <div className="col-span-8">
        <div className={`text-sm font-medium mb-1 ${isAtrasada ? 'text-red-700' : 'text-gray-900'}`}>
          Descrição
        </div>
        <div className={`text-sm ${isAtrasada ? 'text-red-700' : 'text-gray-700'}`}>
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
        <div className={`text-sm font-medium mb-1 ${isAtrasada ? 'text-red-700' : 'text-gray-900'}`}>
          Data de Término
        </div>
        <div className={`text-sm ${isAtrasada ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
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
