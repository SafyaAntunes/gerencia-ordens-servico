
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, User, Clock, AlertTriangle, Info, HourglassIcon } from "lucide-react";
import OrdemCronometro from "./OrdemCronometro";
import { EtapaOS, Servico, TipoServico } from "@/types/ordens";
import { formatTime } from "@/utils/timerUtils";
import { useState } from "react";
import AtribuirFuncionarioDialog from "./AtribuirFuncionarioDialog";

interface InspecaoEtapaSectionProps {
  ordemId: string;
  etapa: EtapaOS;
  servicos: Servico[];
  etapaInfo?: {
    concluido?: boolean;
    iniciado?: Date;
    finalizado?: Date;
    usarCronometro?: boolean;
    pausas?: { inicio: number; fim?: number; motivo?: string }[];
    funcionarioId?: string;
    funcionarioNome?: string;
    tempoEstimado?: number;
  };
  funcionarioId: string;
  funcionarioNome?: string;
  onEtapaConcluida: (tempoTotal: number) => void;
  handleMarcarConcluido: () => void;
  isAtivo: boolean;
  setIsAtivo: (ativo: boolean) => void;
}

const formatarEtapa = (etapa: EtapaOS): string => {
  const labels: Record<EtapaOS, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    inspecao_final: "Inspeção Final"
  };
  return labels[etapa] || etapa;
};

const formatarTipoServico = (tipo: TipoServico): string => {
  return {
    bloco: "BLOCO",
    biela: "BIELA",
    cabecote: "CABEÇOTE",
    virabrequim: "VIRABREQUIM",
    eixo_comando: "EIXO DE COMANDO",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    lavagem: "Lavagem"
  }[tipo] || tipo;
};

const formatarTituloEtapa = (etapa: EtapaOS, servico: TipoServico): string => {
  const etapaLabel = formatarEtapa(etapa);
  return `${etapaLabel} ${formatarTipoServico(servico)}`;
};

export default function InspecaoEtapaSection({
  ordemId,
  etapa,
  servicos,
  etapaInfo,
  funcionarioId,
  funcionarioNome,
  onEtapaConcluida,
  handleMarcarConcluido,
  isAtivo,
  setIsAtivo,
}: InspecaoEtapaSectionProps) {
  const [atribuirDialogOpen, setAtribuirDialogOpen] = useState(false);
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState(funcionarioId || "");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState(funcionarioNome || "");
  
  // Verificar se a etapa está em atraso em relação ao tempo estimado
  const verificarAtraso = (): boolean => {
    if (!etapaInfo?.iniciado || !etapaInfo?.tempoEstimado) return false;
    
    const agora = new Date();
    const iniciado = new Date(etapaInfo.iniciado);
    const tempoDecorrido = agora.getTime() - iniciado.getTime();
    const tempoEstimadoMs = etapaInfo.tempoEstimado * 60 * 60 * 1000; // Horas para ms
    
    return tempoDecorrido > tempoEstimadoMs;
  };
  
  const emAtraso = verificarAtraso();
  
  // Calcular tempo decorrido
  const calcularTempoDecorrido = (): number => {
    if (!etapaInfo?.iniciado) return 0;
    
    if (etapaInfo.concluido && etapaInfo.finalizado) {
      return new Date(etapaInfo.finalizado).getTime() - new Date(etapaInfo.iniciado).getTime();
    }
    
    const agora = new Date();
    return agora.getTime() - new Date(etapaInfo.iniciado).getTime();
  };
  
  const tempoDecorrido = calcularTempoDecorrido();
  
  const handleConfirmarAtribuicao = () => {
    onEtapaConcluida(tempoDecorrido);
    setAtribuirDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {servicos.map((servico, index) => (
        <Card key={`${servico.tipo}-${index}`} className={`p-6 ${emAtraso ? 'border-red-300' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {formatarTituloEtapa(etapa, servico.tipo)}
            </h3>
            <div className="flex items-center gap-2">
              {etapaInfo?.concluido ? (
                <Badge variant="success">Concluído</Badge>
              ) : etapaInfo?.iniciado ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Em andamento</Badge>
                  {emAtraso && (
                    <Badge variant="destructive" className="flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Em atraso
                    </Badge>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="bg-gray-100">Não iniciado</Badge>
              )}
            </div>
          </div>
          
          {etapaInfo?.tempoEstimado && (
            <div className="mb-3 flex items-center text-sm text-muted-foreground">
              <HourglassIcon className="h-4 w-4 mr-1" />
              <span>Tempo estimado: {formatTime(etapaInfo.tempoEstimado * 60 * 60 * 1000)}</span>
              
              {etapaInfo.iniciado && !etapaInfo.concluido && (
                <div className="ml-4 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    Tempo decorrido: {formatTime(tempoDecorrido)}
                    {emAtraso && (
                      <span className="text-red-500 ml-1">
                        (+ {formatTime(tempoDecorrido - (etapaInfo.tempoEstimado * 60 * 60 * 1000))} de atraso)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {etapaInfo?.concluido && etapaInfo?.funcionarioNome && (
            <div className="mb-4 flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-1" />
              <span>Concluído por: {etapaInfo.funcionarioNome}</span>
              
              {etapaInfo.iniciado && etapaInfo.finalizado && (
                <div className="ml-4 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    Tempo total: {formatTime(new Date(etapaInfo.finalizado).getTime() - new Date(etapaInfo.iniciado).getTime())}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="p-4 border rounded-md">
            <OrdemCronometro
              ordemId={ordemId}
              funcionarioId={funcionarioId}
              funcionarioNome={funcionarioNome}
              etapa={etapa}
              tipoServico={servico.tipo}
              onFinish={onEtapaConcluida}
              isEtapaConcluida={etapaInfo?.concluido}
              onStart={() => setIsAtivo(true)}
            />
            {!etapaInfo?.concluido && (
              <div className="mt-4">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setAtribuirDialogOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Marcar Etapa como Concluída
                </Button>
              </div>
            )}
          </div>
          
          {etapaInfo?.pausas && etapaInfo.pausas.length > 0 && (
            <div className="mt-4 p-4 border rounded-md bg-amber-50 border-amber-200">
              <h4 className="text-sm font-medium mb-2 flex items-center text-amber-800">
                <Info className="h-4 w-4 mr-1" />
                Pausas Registradas
              </h4>
              <div className="space-y-2">
                {etapaInfo.pausas.map((pausa, i) => (
                  <div key={i} className="text-xs text-amber-700 flex justify-between">
                    <div>
                      {pausa.motivo && <span className="font-medium">{pausa.motivo}: </span>}
                      <span>
                        {new Date(pausa.inicio).toLocaleTimeString()}
                        {pausa.fim && ` - ${new Date(pausa.fim).toLocaleTimeString()}`}
                      </span>
                    </div>
                    {pausa.fim && (
                      <span>
                        Duração: {formatTime(pausa.fim - pausa.inicio)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
      
      <AtribuirFuncionarioDialog
        open={atribuirDialogOpen}
        onOpenChange={setAtribuirDialogOpen}
        funcionariosOptions={[]} // Será preenchido pelo componente
        funcionarioSelecionadoId={funcionarioSelecionadoId}
        setFuncionarioSelecionadoId={setFuncionarioSelecionadoId}
        funcionarioSelecionadoNome={funcionarioSelecionadoNome}
        setFuncionarioSelecionadoNome={setFuncionarioSelecionadoNome}
        onConfirmarAtribuicao={handleConfirmarAtribuicao}
      />
    </div>
  );
}
