
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import { formatTime } from "@/utils/timerUtils";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CheckCircle2 } from "lucide-react";
import ServicoTracker from "./ServicoTracker";
import OrdemCronometro from "./OrdemCronometro";

interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  servicos?: Servico[];
  etapaInfo?: {
    concluido?: boolean;
    iniciado?: Date;
    finalizado?: Date;
    usarCronometro?: boolean;
    pausas?: { inicio: number; fim?: number; motivo?: string }[];
    servicoTipo?: TipoServico;
  };
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean) => void;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean) => void;
  servicoTipo?: TipoServico; // Novo prop para identificar o tipo de serviço
}

export default function EtapaCard({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  servicos = [],
  etapaInfo,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange,
  servicoTipo
}: EtapaCardProps) {
  const [progresso, setProgresso] = useState(0);
  const [isAtivo, setIsAtivo] = useState(false);
  
  const etapaServicos = (() => {
    // Se um servicoTipo específico foi passado, filtra apenas esse serviço
    if (servicoTipo) {
      return servicos.filter(servico => servico.tipo === servicoTipo);
    }
    
    // Caso contrário, usa a lógica original
    switch(etapa) {
      case 'retifica':
        return servicos.filter(servico => 
          ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
        );
      case 'montagem':
        return servicos.filter(servico => servico.tipo === 'montagem');
      case 'dinamometro':
        return servicos.filter(servico => servico.tipo === 'dinamometro');
      case 'lavagem':
      case 'inspecao_inicial':
        if (servicoTipo) {
          return servicos.filter(servico => servico.tipo === servicoTipo);
        }
        return servicos;
      case 'inspecao_final':
        return [];
      default:
        return [];
    }
  })();

  useEffect(() => {
    if (etapaServicos.length === 0) return;
    
    const servicosConcluidos = etapaServicos.filter(servico => servico.concluido).length;
    const percentualProgresso = Math.round((servicosConcluidos / etapaServicos.length) * 100);
    setProgresso(percentualProgresso);
  }, [etapaServicos]);

  const etapaComCronometro = ['lavagem', 'inspecao_inicial', 'inspecao_final'].includes(etapa);
  
  const handleEtapaConcluida = (tempoTotal: number) => {
    if (onEtapaStatusChange) {
      onEtapaStatusChange(etapa, true);
    }
  };

  const handleMarcarConcluido = () => {
    if (onEtapaStatusChange) {
      onEtapaStatusChange(etapa, true);
    }
  };
  
  const getEtapaStatus = () => {
    if (etapaInfo?.concluido) {
      return "concluido";
    } else if (etapaInfo?.iniciado) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  // Adicionado para atualizar o status quando o cronômetro estiver ativo
  useEffect(() => {
    if (etapaInfo?.iniciado && !etapaInfo?.concluido) {
      setIsAtivo(true);
    } else {
      setIsAtivo(false);
    }
  }, [etapaInfo]);

  return (
    <Card className="p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
        <div className="flex items-center gap-2">
          {getEtapaStatus() === "concluido" && (
            <Badge variant="success">
              Concluído
            </Badge>
          )}
          {getEtapaStatus() === "em_andamento" && (
            <Badge variant="outline">Em andamento</Badge>
          )}
          {getEtapaStatus() === "nao_iniciado" && (
            <Badge variant="outline" className="bg-gray-100">Não iniciado</Badge>
          )}
        </div>
      </div>
      
      {etapaServicos.length > 0 && (
        <div className="mb-4">
          <Progress value={progresso} className="h-2" />
        </div>
      )}
      
      {etapaComCronometro && (
        <div className="p-4 border rounded-md mb-4">
          <OrdemCronometro
            ordemId={ordemId}
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome}
            etapa={servicoTipo ? `${etapa}_${servicoTipo}` as EtapaOS : etapa}
            onFinish={handleEtapaConcluida}
            isEtapaConcluida={etapaInfo?.concluido}
            onStart={() => setIsAtivo(true)}
          />
          
          {!etapaInfo?.concluido && (
            <div className="mt-4">
              <Button 
                variant="default" 
                size="sm" 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleMarcarConcluido}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Marcar Etapa como Concluída
              </Button>
            </div>
          )}
        </div>
      )}
      
      {etapaServicos.length > 0 && (
        <div className="space-y-4">
          {etapaServicos.map((servico, i) => (
            <ServicoTracker
              key={`${servico.tipo}-${i}`}
              servico={servico}
              ordemId={ordemId}
              funcionarioId={funcionarioId}
              funcionarioNome={funcionarioNome}
              onSubatividadeToggle={
                onSubatividadeToggle ? 
                  (subId, checked) => onSubatividadeToggle(servico.tipo, subId, checked) : 
                  () => {}
              }
              onServicoStatusChange={
                onServicoStatusChange ? 
                  (concluido) => onServicoStatusChange(servico.tipo, concluido) : 
                  () => {}
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}
