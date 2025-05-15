
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Servico } from "@/types/ordens";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { useServicoTracker } from "./hooks/useServicoTracker";
import ServicoHeader from "./ServicoHeader";
import ServicoDetails from "./ServicoDetails";
import ServicoControls from "./ServicoControls";

interface ServicoTrackerProps {
  servico: Servico;
  ordemId?: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
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
  onSubatividadeSelecionadaToggle,
  className,
  etapa,
}: ServicoTrackerProps) {
  const {
    isOpen,
    setIsOpen,
    temPermissao,
    servicoStatus,
    progressPercentage,
    completedSubatividades,
    totalSubatividades,
    subatividadesFiltradas,
    handleLoadFuncionarios,
    handleSubatividadeToggle,
    handleMarcarConcluido,
    funcionariosOptions,
    responsavelSelecionadoId,
    setResponsavelSelecionadoId,
    handleSaveResponsavel,
    isSavingResponsavel,
    lastSavedResponsavelId,
    lastSavedResponsavelNome
  } = useServicoTracker({
    servico,
    ordemId,
    funcionarioId,
    funcionarioNome,
    etapa,
    onServicoStatusChange,
    onSubatividadeToggle
  });

  // Handler for subatividade selecionada toggle
  const handleSubatividadeSelecionadaToggleInternal = (subatividadeId: string, checked: boolean) => {
    if (onSubatividadeSelecionadaToggle) {
      onSubatividadeSelecionadaToggle(subatividadeId, checked);
    }
  };

  // Load funcionarios if needed (when the component mounts)
  useState(() => {
    handleLoadFuncionarios();
  });

  // Verifica se todas subatividades selecionadas estão concluídas
  const todasSubatividadesConcluidas = subatividadesFiltradas.length === 0 || 
    (subatividadesFiltradas.length > 0 && subatividadesFiltradas.every(sub => sub.concluida));

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6">
            <ServicoHeader 
              tipo={servico.tipo}
              servicoStatus={servicoStatus}
              progressPercentage={Number(progressPercentage)}
              completedSubatividades={completedSubatividades}
              totalSubatividades={totalSubatividades}
              funcionarioNome={servico.concluido ? servico.funcionarioNome : undefined}
              concluido={servico.concluido}
              temPermissao={temPermissao}
              isOpen={isOpen}
              onToggleOpen={() => setIsOpen(!isOpen)}
              responsavelNome={lastSavedResponsavelNome || funcionarioNome}
            />
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Etapa</h4>
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="text-sm font-semibold capitalize">{etapa?.replace('_', ' ') || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Serviços</h4>
                <ServicoDetails 
                  descricao={servico.descricao}
                  subatividades={subatividadesFiltradas}
                  temPermissao={temPermissao}
                  onSubatividadeToggle={handleSubatividadeToggle}
                  onSubatividadeSelecionadaToggle={handleSubatividadeSelecionadaToggleInternal}
                />
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Funcionário</h4>
                <ServicoControls 
                  temPermissao={temPermissao}
                  concluido={servico.concluido}
                  todasSubatividadesConcluidas={todasSubatividadesConcluidas}
                  onMarcarConcluido={handleMarcarConcluido}
                  funcionariosOptions={funcionariosOptions}
                  responsavelSelecionadoId={responsavelSelecionadoId}
                  setResponsavelSelecionadoId={setResponsavelSelecionadoId}
                  handleSaveResponsavel={handleSaveResponsavel}
                  isSavingResponsavel={isSavingResponsavel}
                  lastSavedResponsavelId={lastSavedResponsavelId}
                  lastSavedResponsavelNome={lastSavedResponsavelNome}
                  servicoStatus={servicoStatus}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
