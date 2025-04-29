
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Servico } from "@/types/ordens";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { useServicoTracker, ServicoStatus } from "./hooks/useServicoTracker";
import ServicoHeader from "./ServicoHeader";
import ServicoDetails from "./ServicoDetails";
import ServicoControls from "./ServicoControls";
import AtribuirFuncionarioDialog from "./AtribuirFuncionarioDialog";

interface ServicoTrackerProps {
  servico: Servico;
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  className?: string;
  etapa?: string;
}

export default function ServicoTracker({
  servico,
  ordemId = "",
  funcionarioId = "",
  funcionarioNome,
  onSubatividadeToggle,
  onServicoStatusChange,
  className,
  etapa,
}: ServicoTrackerProps) {
  const {
    isOpen,
    setIsOpen,
    funcionariosOptions,
    atribuirFuncionarioDialogOpen,
    setAtribuirFuncionarioDialogOpen,
    dialogAction,
    temPermissao,
    isRunning,
    isPaused,
    displayTime,
    servicoStatus,
    progressPercentage,
    completedSubatividades,
    totalSubatividades,
    tempoTotalEstimado,
    subatividadesFiltradas,
    handleLoadFuncionarios,
    handleSubatividadeToggle,
    handleStartClick,
    handlePause,
    handleResume,
    handleFinish,
    handleMarcarConcluido,
    handleReiniciarServico,
    handleConfirmarAtribuicao,
    handleFuncionarioChange,
    funcionarioSelecionadoId
  } = useServicoTracker({
    servico,
    ordemId,
    funcionarioId,
    funcionarioNome,
    etapa,
    onServicoStatusChange,
    onSubatividadeToggle
  });

  // Load funcionarios if needed (when the component mounts)
  useEffect(() => {
    handleLoadFuncionarios();
  }, []);

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6">
            <ServicoHeader 
              tipo={servico.tipo}
              displayTime={displayTime}
              servicoStatus={servicoStatus}
              progressPercentage={progressPercentage}
              completedSubatividades={completedSubatividades}
              totalSubatividades={totalSubatividades}
              tempoTotalEstimado={tempoTotalEstimado}
              funcionarioNome={servico.funcionarioNome}
              concluido={servico.concluido}
              temPermissao={temPermissao}
              onToggleOpen={() => setIsOpen(!isOpen)}
              onReiniciarServico={handleReiniciarServico}
            />
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ServicoDetails 
              descricao={servico.descricao}
              subatividades={subatividadesFiltradas}
              temPermissao={temPermissao}
              onSubatividadeToggle={handleSubatividadeToggle}
            />
            
            <ServicoControls 
              isRunning={isRunning}
              isPaused={isPaused}
              temPermissao={temPermissao}
              concluido={servico.concluido}
              onStartClick={handleStartClick}
              onPauseClick={handlePause}
              onResumeClick={handleResume}
              onFinishClick={handleFinish}
              onMarcarConcluido={handleMarcarConcluido}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
      
      <AtribuirFuncionarioDialog 
        isOpen={atribuirFuncionarioDialogOpen}
        onOpenChange={setAtribuirFuncionarioDialogOpen}
        funcionariosOptions={funcionariosOptions}
        funcionarioAtual={{ id: funcionarioId, nome: funcionarioNome || "" }}
        onFuncionarioChange={handleFuncionarioChange}
        onConfirm={handleConfirmarAtribuicao}
        dialogAction={dialogAction}
      />
    </Card>
  );
}
