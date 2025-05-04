
import { OrdemServico } from "@/types/ordens";
import { useProgressoData } from "./progresso/useProgressoData";
import { ProgressoSummaryCard } from "./progresso/ProgressoSummaryCard";
import { ProgressoCardEtapas } from "./progresso/ProgressoCardEtapas";
import { ProgressoCardServicos } from "./progresso/ProgressoCardServicos";

interface ProgressoRelatorioProps {
  ordem: OrdemServico;
}

export default function ProgressoRelatorio({ ordem }: ProgressoRelatorioProps) {
  const {
    progressoEtapas,
    progressoServicos,
    tempoTotalRegistrado,
    tempoEstimado,
    diasEmAndamento,
    temposPorEtapa,
    etapasNomes,
    progressoTotal,
    formatarTempo
  } = useProgressoData(ordem);

  return (
    <div className="space-y-6">
      <ProgressoSummaryCard
        ordem={ordem}
        progressoTotal={progressoTotal}
        tempoTotalRegistrado={tempoTotalRegistrado}
        tempoEstimado={tempoEstimado}
        diasEmAndamento={diasEmAndamento}
        temposPorEtapa={temposPorEtapa}
        etapasNomes={etapasNomes}
        formatarTempo={formatarTempo}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProgressoCardEtapas progressoEtapas={progressoEtapas} />
        <ProgressoCardServicos progressoServicos={progressoServicos} />
      </div>
    </div>
  );
}
