
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { OrdemServico } from "@/types/ordens";

interface OrdemListRowProgressProps {
  ordem: OrdemServico;
  isAtrasada?: boolean;
}

export default function OrdemListRowProgress({ ordem, isAtrasada = false }: OrdemListRowProgressProps) {
  // Calculate progress based on service status
  const calculateProgress = (): number => {
    if (!ordem.servicos || ordem.servicos.length === 0) {
      return 0;
    }

    let totalPoints = 0;
    const totalServicos = ordem.servicos.length;
    
    ordem.servicos.forEach(servico => {
      if (servico.concluido) {
        // Concluído: 100%
        totalPoints += 100;
      } else {
        // Verificar se está em andamento
        const emAndamento = isServicoEmAndamento(servico);
        if (emAndamento) {
          // Em Andamento: 50%
          totalPoints += 50;
        }
        // Não Iniciado: 0% (não adiciona nada)
        // Pausado: Não mexe em nada (mantém o valor atual)
      }
    });
    
    return Math.round(totalPoints / totalServicos);
  };

  // Verificar se um serviço está em andamento
  const isServicoEmAndamento = (servico: any): boolean => {
    // Se o serviço estiver concluído, não está em andamento
    if (servico.concluido) return false;
    
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
    
    // 4. Verificar timer ativo
    if (ordem.timers && ordem.timers[servico.tipo] && ordem.timers[servico.tipo].isRunning) {
      return true;
    }
    
    return false;
  };

  const progressoValue = calculateProgress();
  
  return (
    <div className={`px-4 py-3 ${isAtrasada ? 'bg-red-100' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
        <span>Progresso</span>
        <span>{progressoValue}%</span>
      </div>
      <Progress 
        value={progressoValue} 
        className={`h-2 ${isAtrasada ? 'bg-red-200' : 'bg-gray-200'}`}
        indicatorClassName={cn(isAtrasada ? "bg-red-500" : "bg-blue-500")}
      />
    </div>
  );
}
