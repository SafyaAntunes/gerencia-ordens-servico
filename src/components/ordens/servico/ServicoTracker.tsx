
import { useState, useEffect } from 'react';
import { Servico, EtapaOS } from '@/types/ordens';
import { useServicoTracker } from './hooks/useServicoTracker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, RotateCcw, User, ChevronDown, ChevronUp } from 'lucide-react';
import ServicoHeader from './ServicoHeader';
import ServicoDetails from './ServicoDetails';
import { ServicoTrackerProps } from './hooks/types/servicoTrackerTypes';
import { formatTime } from '@/utils/timerUtils';

export function ServicoTracker({
  servico,
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  onSubatividadeToggle,
  onServicoStatusChange,
  onSubatividadeSelecionadaToggle,
  onServicoUpdate
}: ServicoTrackerProps) {
  const [localServico, setLocalServico] = useState<Servico>(servico);
  
  // Effect to update local state when servico prop changes
  useEffect(() => {
    setLocalServico(servico);
  }, [servico]);
  
  const {
    isShowingDetails,
    toggleDetails,
    handleSubatividadeToggle,
    handleServicoConcluidoToggle,
    handleSubatividadeSelecionadaToggle,
    temPermissao,
    timer
  } = useServicoTracker({
    servico: localServico,
    ordemId,
    funcionarioId,
    funcionarioNome,
    etapa,
    onSubatividadeToggle,
    onServicoStatusChange,
    onSubatividadeSelecionadaToggle,
    onServicoUpdate: (updatedServico) => {
      setLocalServico(updatedServico);
      if (onServicoUpdate) {
        onServicoUpdate(updatedServico);
      }
    }
  });

  // Calculate progress
  const totalSubatividades = localServico.subatividades?.length || 0;
  const completedSubatividades = localServico.subatividades?.filter(sub => sub.concluida).length || 0;
  const progressPercentage = totalSubatividades > 0 
    ? Math.round((completedSubatividades / totalSubatividades) * 100) 
    : 0;

  // Determine service status
  const servicoStatus = localServico.concluido 
    ? 'concluido' 
    : timer.isRunning && !timer.isPaused 
      ? 'em_andamento' 
      : timer.isPaused 
        ? 'pausado'
        : localServico.funcionarioId 
          ? 'em_andamento' 
          : 'nao_iniciado';

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <ServicoHeader
          tipo={localServico.tipo}
          servicoStatus={servicoStatus}
          progressPercentage={progressPercentage}
          completedSubatividades={completedSubatividades}
          totalSubatividades={totalSubatividades}
          funcionarioNome={localServico.funcionarioNome}
          concluido={localServico.concluido}
          isOpen={isShowingDetails}
          onToggleOpen={toggleDetails}
          displayTime={timer.displayTime}
        />
      </CardHeader>

      {isShowingDetails && (
        <CardContent>
          <ServicoDetails
            servico={localServico}
            onSubatividadeToggle={handleSubatividadeToggle}
            onServicoConcluidoToggle={handleServicoConcluidoToggle}
            onSubatividadeSelecionadaToggle={handleSubatividadeSelecionadaToggle}
            temPermissao={temPermissao}
            timer={timer}
          />
        </CardContent>
      )}
    </Card>
  );
}
