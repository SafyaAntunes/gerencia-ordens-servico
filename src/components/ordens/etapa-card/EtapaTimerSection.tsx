
import React from "react";
import { EtapaOS, TipoServico } from "@/types/ordens";
import EtapaTimer from "../etapa/EtapaTimer";

interface EtapaTimerSectionProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  isEtapaConcluida: boolean;
  onEtapaConcluida?: (tempoTotal: number) => void;
  onMarcarConcluido?: () => void;
  onTimerStart?: () => void;
  onCustomStart?: () => boolean;
  onSaveResponsavel?: () => Promise<void>;
}

export default function EtapaTimerSection({
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  tipoServico,
  isEtapaConcluida,
  onEtapaConcluida,
  onTimerStart,
  onCustomStart,
  onSaveResponsavel
}: EtapaTimerSectionProps) {
  return (
    <div className="my-4 p-4 border rounded-lg">
      <EtapaTimer
        ordemId={ordemId}
        funcionarioId={funcionarioId}
        funcionarioNome={funcionarioNome}
        etapa={etapa}
        servicoTipo={tipoServico}
        isEtapaConcluida={isEtapaConcluida}
        onFinish={onEtapaConcluida}
        onCustomTimerStart={onCustomStart}
        onEtapaConcluida={onEtapaConcluida} // Compatibilidade com interfaces antigas
      />
    </div>
  );
}
