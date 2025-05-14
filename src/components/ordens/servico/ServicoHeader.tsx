
import React from 'react';
import { ChevronDown, ChevronUp, Clock, Check } from 'lucide-react';
import { formatTime } from '@/utils/timerUtils';
import { ServicoStatus } from './hooks/types/servicoTrackerTypes';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { tipoServicoLabel } from '@/utils/etapaNomes';

interface ServicoHeaderProps {
  tipo: string;
  displayTime?: string;
  servicoStatus: ServicoStatus;
  progressPercentage: number;
  completedSubatividades: number;
  totalSubatividades: number;
  tempoTotalEstimado?: number;
  funcionarioNome?: string;
  concluido?: boolean;
  temPermissao?: boolean;
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
  concluido = false,
  temPermissao = true,
  isOpen,
  onToggleOpen
}) => {
  const getStatusBadge = () => {
    switch (servicoStatus) {
      case "em_andamento":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Em andamento</Badge>;
      case "pausado":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Pausado</Badge>;
      case "concluido":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Concluído</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Não iniciado</Badge>;
    }
  };
  
  const servicoLabel = tipoServicoLabel[tipo as keyof typeof tipoServicoLabel] || tipo;

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{servicoLabel}</h3>
            {getStatusBadge()}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {displayTime || '00:00:00'}
              {tempoTotalEstimado ? ` / ${tempoTotalEstimado}h estimadas` : ''}
            </span>
          </div>
          
          {funcionarioNome && (
            <div className="text-sm text-muted-foreground mt-1">
              Responsável: {funcionarioNome}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {progressPercentage}%
          </div>
          
          <button
            onClick={onToggleOpen}
            className="p-1 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-label={isOpen ? 'Recolher detalhes' : 'Expandir detalhes'}
          >
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      <div className="mt-2">
        <Progress value={progressPercentage} className="h-1" />
        
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <div>
            {completedSubatividades}/{totalSubatividades} subatividades
          </div>
          {concluido && (
            <div className="flex items-center text-green-600">
              <Check className="h-3 w-3 mr-1" />
              <span>Concluído</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicoHeader;
