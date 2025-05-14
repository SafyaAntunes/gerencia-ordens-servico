import React from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TipoServico } from '@/types/ordens';
import { ServicoStatus } from './hooks/types/servicoTrackerTypes';
import { tipoServicoLabel } from '@/utils/etapaNomes';

interface ServicoHeaderProps {
  tipo: TipoServico;
  displayTime: string;
  servicoStatus: ServicoStatus;
  progressPercentage: number;
  completedSubatividades: number;
  totalSubatividades: number;
  tempoTotalEstimado: number;
  funcionarioNome?: string;
  concluido: boolean;
  temPermissao: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const ServicoHeader: React.FC<ServicoHeaderProps> = ({
  tipo,
  displayTime,
  servicoStatus,
  progressPercentage,
  completedSubatividades,
  totalSubatividades,
  tempoTotalEstimado,
  funcionarioNome,
  concluido,
  temPermissao,
  isOpen,
  onToggleOpen
}) => {
  const StatusBadge = () => {
    let color = "";
    let text = "";

    switch (servicoStatus) {
      case 'em_andamento':
        color = "bg-blue-500";
        text = "Em andamento";
        break;
      case 'pausado':
        color = "bg-yellow-500";
        text = "Pausado";
        break;
      case 'concluido':
        color = "bg-green-500";
        text = "Concluído";
        break;
      case 'nao_iniciado':
        color = "bg-gray-500";
        text = "Não iniciado";
        break;
      default:
        color = "bg-gray-500";
        text = "Não iniciado";
    }
    
    return (
      <Badge className={`${color} text-white`}>{text}</Badge>
    );
  };

  const renderProgressInfo = () => {
    if (completedSubatividades === 0 && totalSubatividades === 0) {
      return null;
    }
    
    return (
      <span className="text-xs text-gray-600">
        {completedSubatividades}/{totalSubatividades} subatividades
        {tempoTotalEstimado > 0 && ` • ${tempoTotalEstimado}h estimadas`}
      </span>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{tipoServicoLabel[tipo] || tipo}</h3>
          <StatusBadge />
          {funcionarioNome && (
            <span className="text-xs text-gray-500">
              Responsável: {funcionarioNome}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm font-mono">{displayTime}</span>
          </div>
          
          <button 
            onClick={onToggleOpen}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            {isOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium">
            {progressPercentage}% concluído
          </span>
          {renderProgressInfo()}
        </div>
        <Progress value={progressPercentage} className="h-1.5" />
      </div>
    </div>
  );
};

export default ServicoHeader;
