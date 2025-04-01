
import { Card } from "@/components/ui/card";
import { EtapaOS } from "@/types/ordens";
import OrdemCronometro from "./OrdemCronometro";
import { formatTime } from "@/utils/timerUtils";

interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  isConcluida: boolean;
  isIniciada: boolean;
  onStart: () => void;
  onFinish: (tempoTotal: number) => void;
}

export default function EtapaCard({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  isConcluida,
  isIniciada,
  onStart,
  onFinish
}: EtapaCardProps) {
  return (
    <Card className={`p-6 ${isConcluida ? "border-green-500/50" : ""} mb-4`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
      </div>
      
      {isConcluida ? (
        <OrdemCronometro
          ordemId={ordemId}
          funcionarioId={funcionarioId}
          funcionarioNome={funcionarioNome}
          etapa={etapa}
          isEtapaConcluida={true}
        />
      ) : isIniciada ? (
        <OrdemCronometro
          ordemId={ordemId}
          funcionarioId={funcionarioId}
          funcionarioNome={funcionarioNome}
          etapa={etapa}
          onStart={() => {}}
          onPause={() => {}}
          onResume={() => {}}
          onFinish={(tempoTotal) => onFinish(tempoTotal)}
        />
      ) : (
        <div className="text-center py-4">
          <OrdemCronometro
            ordemId={ordemId}
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome || ""}
            etapa={etapa}
            onStart={onStart}
            onPause={() => {}}
            onResume={() => {}}
            onFinish={() => {}}
          />
        </div>
      )}
    </Card>
  );
}
