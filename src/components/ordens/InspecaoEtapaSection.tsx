
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, User } from "lucide-react";
import OrdemCronometro from "./OrdemCronometro";
import { EtapaOS, Servico, TipoServico } from "@/types/ordens";

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
  return (
    <div className="space-y-4">
      {servicos.map((servico, index) => (
        <Card key={`${servico.tipo}-${index}`} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {formatarTituloEtapa(etapa, servico.tipo)}
            </h3>
            <div className="flex items-center gap-2">
              {etapaInfo?.concluido ? (
                <Badge variant="success">Concluído</Badge>
              ) : etapaInfo?.iniciado ? (
                <Badge variant="outline">Em andamento</Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100">Não iniciado</Badge>
              )}
            </div>
          </div>
          {etapaInfo?.concluido && etapaInfo?.funcionarioNome && (
            <div className="mb-4 flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-1" />
              <span>Concluído por: {etapaInfo.funcionarioNome}</span>
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
                  onClick={handleMarcarConcluido}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Marcar Etapa como Concluída
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
