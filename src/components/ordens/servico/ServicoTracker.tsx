
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
  const {
    isShowingDetails,
    toggleDetails,
    handleSubatividadeToggle,
    handleServicoConcluidoToggle,
    handleSubatividadeSelecionadaToggle,
    temPermissao
  } = useServicoTracker({
    servico,
    ordemId,
    funcionarioId,
    funcionarioNome,
    etapa,
    onSubatividadeToggle,
    onServicoStatusChange,
    onSubatividadeSelecionadaToggle
  });

  // Calculate progress
  const totalSubatividades = servico.subatividades?.length || 0;
  const completedSubatividades = servico.subatividades?.filter(sub => sub.concluida).length || 0;
  const progressPercentage = totalSubatividades > 0 
    ? Math.round((completedSubatividades / totalSubatividades) * 100) 
    : 0;

  // Determine service status
  const servicoStatus = servico.concluido 
    ? 'concluido' 
    : servico.funcionarioId 
      ? 'em_andamento' 
      : 'nao_iniciado';

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <ServicoHeader
          tipo={servico.tipo}
          servicoStatus={servicoStatus}
          progressPercentage={progressPercentage}
          completedSubatividades={completedSubatividades}
          totalSubatividades={totalSubatividades}
          funcionarioNome={servico.funcionarioNome}
          concluido={servico.concluido}
          isOpen={isShowingDetails}
          onToggleOpen={toggleDetails}
        />
      </CardHeader>

      {isShowingDetails && (
        <CardContent>
          <ServicoDetails
            servico={servico}
            onSubatividadeToggle={handleSubatividadeToggle}
            onServicoConcluidoToggle={handleServicoConcluidoToggle}
            onSubatividadeSelecionadaToggle={handleSubatividadeSelecionadaToggle}
            temPermissao={temPermissao}
          />
        </CardContent>
      )}
    </Card>
  );
}
