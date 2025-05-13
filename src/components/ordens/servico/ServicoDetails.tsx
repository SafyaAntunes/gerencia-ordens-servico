
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Check, RotateCcw } from "lucide-react";
import { Servico, SubAtividade } from "@/types/ordens";
import TimerControls from "../TimerControls";
import { UseOrdemTimerResult } from "@/hooks/timer/types";

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
      
      {servico.subatividades && servico.subatividades.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Subatividades</h3>
          <div className="space-y-2">
            {servico.subatividades.map(sub => (
              <div key={sub.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`sub-${sub.id}`}
                  checked={sub.concluida || false}
                  onCheckedChange={(checked) => {
                    onSubatividadeToggle(sub.id, !!checked);
                  }}
                  disabled={!temPermissao || servico.concluido}
                />
                <label 
                  htmlFor={`sub-${sub.id}`}
                  className={`text-sm ${sub.concluida ? 'line-through text-gray-500' : ''}`}
                >
                  {sub.nome}
                </label>
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
          disabled={!temPermissao}
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
