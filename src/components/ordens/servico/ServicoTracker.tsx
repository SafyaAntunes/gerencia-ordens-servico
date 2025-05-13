
import { useState } from "react";
import { Servico, EtapaOS } from "@/types/ordens";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useServicoTracker } from "./hooks";
import ServicoHeader from "./ServicoHeader";
import ServicoDetails from "./ServicoDetails";
import ServicoControls from "./ServicoControls";

interface ServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
}

export function ServicoTracker({
  servico,
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  onSubatividadeToggle,
  onServicoStatusChange,
  onSubatividadeSelecionadaToggle
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

  const subatividadesSelecionadas = servico.subatividades?.filter(s => s.selecionada)?.length || 0;
  const totalSubatividades = servico.subatividades?.length || 0;
  const subatividadesConcluidas = servico.subatividades?.filter(s => s.concluida)?.length || 0;

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <ServicoHeader 
          tipo={servico.tipo} 
          concluido={servico.concluido}
          onToggleDetails={toggleDetails}
          isExpanded={isShowingDetails}
        />
      </CardHeader>
      
      {isShowingDetails && (
        <CardContent className="p-4 pt-2">
          <ServicoDetails
            descricao={servico.descricao}
            subatividades={servico.subatividades || []}
            temPermissao={temPermissao}
            onSubatividadeToggle={handleSubatividadeToggle}
          />
          
          <ServicoControls
            subatividadesConcluidas={subatividadesConcluidas}
            subatividadesSelecionadas={subatividadesSelecionadas}
            totalSubatividades={totalSubatividades}
            servico={servico}
            temPermissao={temPermissao}
            onServicoConcluidoToggle={handleServicoConcluidoToggle}
          />
        </CardContent>
      )}
    </Card>
  );
}
