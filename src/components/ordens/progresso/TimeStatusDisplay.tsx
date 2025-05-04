
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface TimeStatusDisplayProps {
  tempoTotalRegistrado: number;
  tempoEstimado: number;
  diasEmAndamento: number;
  formatarTempo: (ms: number) => string;
}

export function TimeStatusDisplay({ tempoTotalRegistrado, tempoEstimado, diasEmAndamento, formatarTempo }: TimeStatusDisplayProps) {
  const getStatusTempo = () => {
    if (tempoEstimado === 0) return "neutro";
    
    const diferenca = tempoEstimado - tempoTotalRegistrado;
    if (Math.abs(diferenca) < tempoEstimado * 0.1) {
      return "neutro"; // Dentro de 10% do estimado
    } else if (diferenca > 0) {
      return "positivo"; // Abaixo do tempo estimado (ganho)
    } else {
      return "negativo"; // Acima do tempo estimado (perda)
    }
  };
  
  const getStatusInfo = () => {
    const status = getStatusTempo();
    
    if (status === "positivo") {
      return {
        texto: "Abaixo do tempo estimado (ganho de produtividade)",
        cor: "text-green-600",
        icone: <CheckCircle2 className="h-5 w-5 mr-1" />
      };
    } else if (status === "negativo") {
      return {
        texto: "Acima do tempo estimado (perda de produtividade)",
        cor: "text-red-600",
        icone: <XCircle className="h-5 w-5 mr-1" />
      };
    } else {
      return {
        texto: "Dentro do tempo estimado",
        cor: "text-amber-600",
        icone: <Clock className="h-5 w-5 mr-1" />
      };
    }
  };
  
  const statusInfo = getStatusInfo();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-muted-foreground">Tempo Total Registrado</p>
        <p className="text-2xl font-bold">{formatarTempo(tempoTotalRegistrado)}</p>
      </div>
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-muted-foreground">Tempo Estimado</p>
        <p className="text-2xl font-bold">{formatarTempo(tempoEstimado)}</p>
      </div>
      <div className={`bg-muted/50 p-4 rounded-lg ${statusInfo.cor}`}>
        <p className="text-muted-foreground">Status de Tempo</p>
        <div className="flex items-center text-xl font-bold">
          {statusInfo.icone}
          {tempoEstimado === 0 ? "Sem estimativa" : (
            Math.abs(tempoEstimado - tempoTotalRegistrado) < 1000 * 60 * 30 ? "No tempo" : formatarTempo(Math.abs(tempoEstimado - tempoTotalRegistrado))
          )}
        </div>
        <p className="text-xs">{statusInfo.texto}</p>
      </div>
    </div>
  );
}
