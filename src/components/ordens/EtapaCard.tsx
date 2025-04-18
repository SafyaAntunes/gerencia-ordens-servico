
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrdemServico, TipoServico, EtapaOS, Servico } from "@/types/ordens";
import ServicoTracker from "./ServicoTracker";
import OrdemCronometro from "./OrdemCronometro";

interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  servicos: Servico[];
  etapaInfo?: {
    concluido?: boolean;
    funcionarioId?: string;
    funcionarioNome?: string;
    iniciado?: Date;
    finalizado?: Date;
    pausas?: { inicio: Date; fim?: Date; motivo?: string }[];
  };
  onSubatividadeToggle: (servicoTipo: TipoServico, subId: string, checked: boolean) => void;
  onServicoStatusChange: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
}

export default function EtapaCard({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  servicos,
  etapaInfo,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange,
}: EtapaCardProps) {
  // Group activities by service type for etapas that need it
  const isSharedEtapa = etapa === 'lavagem' || etapa === 'inspecao_inicial' || etapa === 'inspecao_final';
  
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">{etapaNome}</CardTitle>
          {etapaInfo?.concluido && (
            <Badge variant="success">Concluída</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSharedEtapa ? (
          <div className="space-y-6">
            {servicos.map((servico, index) => (
              <div key={servico.tipo}>
                <div className="mb-2">
                  <Badge variant="outline" className="text-base">
                    {formatServicoTipo(servico.tipo)}
                  </Badge>
                </div>
                <div className="pl-4">
                  <OrdemCronometro
                    ordemId={ordemId}
                    funcionarioId={funcionarioId}
                    funcionarioNome={funcionarioNome}
                    etapa={etapa}
                    tipoServico={servico.tipo}
                    onStart={() => {}}
                    onPause={() => {}}
                    onResume={() => {}}
                    onFinish={() => {}}
                    isEtapaConcluida={etapaInfo?.concluido}
                  />
                </div>
                {index < servicos.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        ) : (
          <OrdemCronometro
            ordemId={ordemId}
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome}
            etapa={etapa}
            onStart={() => {}}
            onPause={() => {}}
            onResume={() => {}}
            onFinish={() => {}}
            isEtapaConcluida={etapaInfo?.concluido}
          />
        )}

        {servicos.map((servico) => (
          <ServicoTracker
            key={servico.tipo}
            servico={servico}
            ordemId={ordemId}
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome}
            onSubatividadeToggle={(subId, checked) => 
              onSubatividadeToggle(servico.tipo, subId, checked)
            }
            onServicoStatusChange={(concluido, funcId, funcNome) => 
              onServicoStatusChange(servico.tipo, concluido, funcId, funcNome)
            }
            className="mt-4"
          />
        ))}
      </CardContent>
    </Card>
  );
}
