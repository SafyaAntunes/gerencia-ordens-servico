
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EtapaOS, OrdemServico } from "@/types/ordens";
import { TimeStatusDisplay } from "./TimeStatusDisplay";

interface ProgressoSummaryCardProps {
  ordem: OrdemServico;
  progressoTotal: number;
  tempoTotalRegistrado: number;
  tempoEstimado: number;
  diasEmAndamento: number;
  temposPorEtapa: Record<string, number>;
  etapasNomes: Record<EtapaOS, string>;
  formatarTempo: (ms: number) => string;
}

// Helper function to safely format dates
const formatarData = (data: Date | string | number | undefined) => {
  if (!data) return "Não definido";
  
  try {
    // Ensure we have a valid date object
    const dataObj = data instanceof Date ? data : new Date(data);
    
    // Check if the date is valid
    if (isNaN(dataObj.getTime())) {
      console.warn("Data inválida:", data);
      return "Data inválida";
    }
    
    return format(dataObj, "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error, data);
    return "Erro na data";
  }
};

export function ProgressoSummaryCard({
  ordem,
  progressoTotal,
  tempoTotalRegistrado,
  tempoEstimado,
  diasEmAndamento,
  temposPorEtapa,
  etapasNomes,
  formatarTempo
}: ProgressoSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso Geral da OS #{ordem.id.slice(-5)}</CardTitle>
        <CardDescription>
          Ordem aberta há {diasEmAndamento} dias - {formatarData(ordem.dataAbertura)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progresso Total</span>
            <span className="text-sm font-medium">{progressoTotal}%</span>
          </div>
          <Progress value={progressoTotal} className="h-3" />
        </div>
        
        <TimeStatusDisplay 
          tempoTotalRegistrado={tempoTotalRegistrado}
          tempoEstimado={tempoEstimado}
          diasEmAndamento={diasEmAndamento}
          formatarTempo={formatarTempo}
        />
        
        <Separator className="my-4" />
        
        <div>
          <h3 className="text-lg font-medium mb-4">Tempo por Etapa</h3>
          <div className="space-y-4">
            {Object.entries(temposPorEtapa).map(([etapa, tempo]) => (
              <div key={etapa} className="flex justify-between items-center">
                <span className="font-medium">{etapasNomes[etapa as EtapaOS] || etapa}</span>
                <span>{formatarTempo(tempo)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
