
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TipoServico } from "@/types/ordens";
import { formatTime } from "@/utils/timerUtils";
import { Clock, RefreshCw, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServicoHeaderProps {
  tipo: TipoServico;
  displayTime: number;
  servicoStatus: 'concluido' | 'em_andamento' | 'nao_iniciado';
  progressPercentage: number;
  completedSubatividades: number;
  totalSubatividades: number;
  tempoTotalEstimado: number;
  funcionarioNome?: string;
  concluido: boolean;
  temPermissao: boolean;
  onToggleOpen: () => void;
  onReiniciarServico: (e: React.MouseEvent) => void;
}

export default function ServicoHeader({
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
  onToggleOpen,
  onReiniciarServico,
}: ServicoHeaderProps) {
  
  const formatServicoTipo = (tipo: TipoServico): string => {
    const labels: Record<TipoServico, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      lavagem: "Lavagem"
    };
    return labels[tipo] || tipo;
  };

  return (
    <div onClick={onToggleOpen} className="pb-3 cursor-pointer">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-lg">
            {formatServicoTipo(tipo)}
          </h3>
          {servicoStatus === "concluido" && (
            <Badge variant="success" className="ml-2">Concluído</Badge>
          )}
          {servicoStatus === "em_andamento" && (
            <Badge variant="outline" className="ml-2">Em andamento</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">
            {formatTime(displayTime)}
          </span>
        </div>
      </div>
      <div className="mt-2">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {completedSubatividades} de {totalSubatividades} concluídas
          </p>
          {tempoTotalEstimado > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {tempoTotalEstimado} {tempoTotalEstimado === 1 ? 'hora' : 'horas'} estimadas
              </p>
            </div>
          )}
        </div>
      </div>

      {concluido && funcionarioNome && (
        <div className="mt-2 flex items-center text-xs text-muted-foreground">
          <User className="h-3 w-3 mr-1" />
          <span>Concluído por: {funcionarioNome}</span>
          
          {temPermissao && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-blue-500 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                onReiniciarServico(e);
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reiniciar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
