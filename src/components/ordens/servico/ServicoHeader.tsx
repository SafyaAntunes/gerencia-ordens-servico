
import { TipoServico } from "@/types/ordens";
import { formatTime } from "@/utils/timerUtils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { ServicoStatus } from "./hooks/types/servicoTrackerTypes";
import { Button } from "@/components/ui/button";

interface ServicoHeaderProps {
  tipo: TipoServico;
  displayTime: number;
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
  isOpen,
  onToggleOpen,
  onReiniciarServico
}: ServicoHeaderProps) {
  // Helper function to get the title based on tipo
  const getTipoTitle = (tipo: TipoServico): string => {
    const titles: Record<TipoServico, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      lavagem: "Lavagem"
    };
    
    return titles[tipo] || tipo;
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium">{getTipoTitle(tipo)}</h3>
          
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Clock className="h-4 w-4 mr-1" />
            <span>Tempo: {formatTime(displayTime)}</span>
            {tempoTotalEstimado > 0 && (
              <span className="ml-2">/ Estimado: {formatTime(tempoTotalEstimado * 3600 * 1000)}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {servicoStatus === "concluido" && (
            <Badge variant="success">
              Concluído
            </Badge>
          )}
          
          {servicoStatus === "em_andamento" && (
            <Badge variant="default">
              Em andamento
            </Badge>
          )}
          
          {servicoStatus === "pausado" && (
            <Badge variant="warning" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              Pausado
            </Badge>
          )}
          
          {servicoStatus === "nao_iniciado" && (
            <Badge variant="outline" className="bg-gray-100">
              Não iniciado
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" className="p-0 h-8 w-8" onClick={onToggleOpen}>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {concluido && funcionarioNome && (
        <div className="text-sm text-muted-foreground">
          Concluído por: {funcionarioNome}
          
          {temPermissao && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 text-blue-500 hover:text-blue-700 p-0 h-6"
              onClick={onReiniciarServico}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reiniciar
            </Button>
          )}
        </div>
      )}
      
      {totalSubatividades > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Progresso: {completedSubatividades} / {totalSubatividades}</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}
    </div>
  );
}
