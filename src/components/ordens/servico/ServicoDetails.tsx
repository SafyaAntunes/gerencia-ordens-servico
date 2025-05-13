
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Check, RotateCcw } from "lucide-react";
import { Servico, SubAtividade } from "@/types/ordens";
import TimerControls from "../TimerControls";
import { UseOrdemTimerResult } from "@/hooks/timer/types";
import { useState, useEffect } from "react";

interface ServicoDetailsProps {
  servico: Servico;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  onServicoConcluidoToggle: (checked: boolean) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
  temPermissao: boolean;
  timer?: UseOrdemTimerResult;
}

export default function ServicoDetails({
  servico,
  onSubatividadeToggle,
  onServicoConcluidoToggle,
  onSubatividadeSelecionadaToggle,
  temPermissao,
  timer
}: ServicoDetailsProps) {
  // Add state to handle subactivities locally for immediate UI feedback
  const [subatividades, setSubatividades] = useState<SubAtividade[]>(servico.subatividades || []);
  
  // Update local state when servico prop changes
  useEffect(() => {
    setSubatividades(servico.subatividades || []);
  }, [servico]);
  
  // Calculate subactivity counts
  const selectedSubatividades = subatividades.filter(sub => sub.selecionada);
  const completedSelectedSubatividades = selectedSubatividades.filter(sub => sub.concluida);
  
  const handleSubatividadeToggle = (subId: string, checked: boolean) => {
    // Update local state first for immediate UI feedback
    setSubatividades(prevSubatividades => 
      prevSubatividades.map(sub => 
        sub.id === subId ? { ...sub, concluida: checked } : sub
      )
    );
    
    // Then call the parent handler
    onSubatividadeToggle(subId, checked);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">Descrição</h3>
        <p className="text-sm text-gray-600">{servico.descricao || "Nenhuma descrição disponível."}</p>
      </div>
      
      {timer && (
        <div className="my-3">
          <TimerControls
            isRunning={timer.isRunning}
            isPaused={timer.isPaused}
            usarCronometro={timer.usarCronometro}
            onStart={timer.handleStart}
            onPause={timer.handlePause}
            onResume={timer.handleResume}
            onFinish={timer.handleFinish}
          />
        </div>
      )}
      
      {subatividades.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Subatividades</h3>
            <span className="text-xs text-gray-500">
              {completedSelectedSubatividades.length}/{selectedSubatividades.length} selecionadas concluídas
            </span>
          </div>
          <div className="space-y-2">
            {subatividades.map(sub => (
              <div key={sub.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`sub-${sub.id}`}
                  checked={sub.concluida || false}
                  onCheckedChange={(checked) => {
                    handleSubatividadeToggle(sub.id, !!checked);
                  }}
                  disabled={!temPermissao || servico.concluido}
                  className={sub.selecionada ? 'bg-blue-100' : ''}
                />
                <label 
                  htmlFor={`sub-${sub.id}`}
                  className={`text-sm ${sub.concluida ? 'line-through text-gray-500' : ''} ${
                    sub.selecionada ? 'font-medium' : ''
                  }`}
                >
                  {sub.nome}
                  {!sub.selecionada && temPermissao && (
                    <span className="text-xs text-gray-400 ml-2">(não selecionada)</span>
                  )}
                </label>
                {onSubatividadeSelecionadaToggle && (
                  <Checkbox
                    id={`sel-${sub.id}`}
                    checked={sub.selecionada || false}
                    onCheckedChange={(checked) => {
                      if (onSubatividadeSelecionadaToggle) {
                        onSubatividadeSelecionadaToggle(sub.id, !!checked);
                      }
                    }}
                    disabled={!temPermissao || servico.concluido}
                    className="ml-auto"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!servico.concluido ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onServicoConcluidoToggle(true)}
          className="flex items-center"
          disabled={!temPermissao || (selectedSubatividades.length > 0 && completedSelectedSubatividades.length < selectedSubatividades.length)}
          title={
            selectedSubatividades.length > 0 && completedSelectedSubatividades.length < selectedSubatividades.length
              ? "Complete todas as subatividades selecionadas primeiro"
              : "Concluir serviço"
          }
        >
          <Check className="h-4 w-4 mr-1" />
          Concluir
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onServicoConcluidoToggle(false)}
          className="flex items-center"
          disabled={!temPermissao}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reabrir
        </Button>
      )}
    </div>
  );
}
