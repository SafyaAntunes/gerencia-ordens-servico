
import { formatTime } from "@/utils/timerUtils";
import { useOrdemTimer } from "@/hooks/useOrdemTimer";
import { EtapaOS, TipoServico, TipoAtividade } from "@/types/ordens";
import TimerControls from "../TimerControls";
import CompletedTimer from "../CompletedTimer";
import { Badge } from "@/components/ui/badge";
import TimerPausas from "./TimerPausas";
import { useEffect, useState } from "react";
import { useConfiguracoesServico } from "@/hooks/useConfiguracoesServico";
import { User } from "lucide-react";

export interface EtapaTimerProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  onStart?: () => void;
  onCustomStart?: () => boolean;
  onPause?: (motivo?: string) => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
  isEtapaConcluida?: boolean;
}

export default function EtapaTimer({
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  tipoServico,
  onStart,
  onCustomStart,
  onPause,
  onResume,
  onFinish,
  isEtapaConcluida = false,
}: EtapaTimerProps) {
  // Logging detalhado para debug de problemas de renderização
  console.log("EtapaTimer renderizando com props:", {
    ordemId, 
    funcionarioId,
    etapa, 
    tipoServico, 
    isEtapaConcluida,
    hasOnCustomStart: !!onCustomStart,
    hasOnStart: !!onStart,
    hasOnFinish: !!onFinish
  });

  const [tempoPadrao, setTempoPadrao] = useState<number>(0);
  
  // Convert EtapaOS to TipoAtividade for the hook
  const getTipoAtividade = (etapa: EtapaOS): TipoAtividade | undefined => {
    if (etapa === 'lavagem') return 'lavagem';
    if (etapa === 'inspecao_inicial') return 'inspecao_inicial';
    if (etapa === 'inspecao_final') return 'inspecao_final';
    return undefined;
  };
  
  const tipoAtividade = getTipoAtividade(etapa);
  
  // Obter configurações de tempo para o tipo de etapa atual
  const { itens } = useConfiguracoesServico(tipoAtividade as TipoAtividade);

  // Atualizar tempo padrão quando as configurações ou tipo de serviço mudarem
  useEffect(() => {
    if (tipoServico && itens.length > 0) {
      const configuracaoServico = itens.find(item => item.tipo === tipoServico);
      if (configuracaoServico) {
        // Converter HH:MM para minutos
        const partes = configuracaoServico.horaPadrao.split(':');
        const horasEmMinutos = parseInt(partes[0], 10) * 60;
        const minutos = parseInt(partes[1], 10);
        setTempoPadrao(horasEmMinutos + minutos);
      }
    }
  }, [tipoServico, itens, etapa]);

  // Validação adicional para prevenir erros
  if (!ordemId || !etapa) {
    console.error("EtapaTimer: props essenciais estão faltando", {
      ordemId, 
      etapa, 
      tipoServico
    });
    return <div className="text-red-500">Erro: Dados insuficientes para iniciar o cronômetro</div>;
  }
  
  const {
    isRunning,
    isPaused,
    usarCronometro,
    displayTime,
    totalSavedTime,
    handleStart,
    handlePause,
    handleResume,
    handleFinish,
    pausas
  } = useOrdemTimer({
    ordemId,
    etapa,
    tipoServico,
    onStart: () => {
      console.log("Timer started for:", {ordemId, etapa, tipoServico});
      if (onStart) onStart();
    },
    onPause,
    onResume,
    onFinish: (tempoTotal) => {
      console.log("Timer finished with total time:", tempoTotal, "for", {ordemId, etapa, tipoServico});
      if (onFinish) onFinish(tempoTotal);
    },
    isEtapaConcluida
  });
  
  // Determine status of the stage/service
  const getStatus = () => {
    if (isEtapaConcluida) {
      return "concluido";
    } else if (isRunning || isPaused) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  // Function to manage timer start, possibly opening dialog
  const handleStartTimer = () => {
    console.log("handleStartTimer called in EtapaTimer", {ordemId, etapa, tipoServico});
    
    if (onCustomStart) {
      const shouldStartTimer = onCustomStart();
      console.log("onCustomStart result:", shouldStartTimer);
      
      // Se onCustomStart retornar true, inicie o timer diretamente
      if (shouldStartTimer) {
        console.log("Iniciando timer após confirmação de onCustomStart");
        handleStart();
      }
    } else {
      console.log("Sem onCustomStart, chamando handleStart diretamente");
      handleStart();
    }
  };
  
  // If the stage is completed, show the saved time without controls but with employee info
  if (isEtapaConcluida) {
    return (
      <div className="w-full">
        {/* Tempo concluído */}
        <CompletedTimer totalSavedTime={totalSavedTime} />
        
        {/* Funcionário que concluiu */}
        {funcionarioNome && (
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-1" />
            <span>Concluído por: {funcionarioNome}</span>
          </div>
        )}
      </div>
    );
  }
  
  const status = getStatus();
  
  return (
    <div className="w-full">
      {/* Nome da etapa e tempo em destaque */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">{formatTime(displayTime)}</h3>
          {status === "em_andamento" && (
            <Badge variant="outline">Em andamento</Badge>
          )}
          {status === "nao_iniciado" && (
            <Badge variant="outline" className="bg-gray-100">Não iniciado</Badge>
          )}
        </div>
      </div>
      
      {/* Tempo estimado para concluir a etapa */}
      {tempoPadrao > 0 && (
        <div className="mb-3 text-sm text-muted-foreground flex items-center gap-1">
          <span>Tempo estimado:</span>
          <span className="font-medium">{tempoPadrao} minutos</span>
        </div>
      )}
      
      {/* Tempo em formato menor abaixo do principal */}
      <div className="mb-3 text-sm text-muted-foreground">
        Tempo registrado: {formatTime(displayTime)}
      </div>
      
      {/* Nome do funcionário */}
      {funcionarioNome && (
        <div className="mb-4 text-base">
          Responsável: {funcionarioNome}
        </div>
      )}
      
      <TimerControls
        isRunning={isRunning}
        isPaused={isPaused}
        usarCronometro={usarCronometro}
        onStart={handleStartTimer}
        onPause={handlePause}
        onResume={handleResume}
        onFinish={handleFinish}
      />
      
      {/* Lista de pausas */}
      <TimerPausas pausas={pausas} />
    </div>
  );
}
