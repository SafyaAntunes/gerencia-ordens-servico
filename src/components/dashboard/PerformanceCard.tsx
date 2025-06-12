
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

interface PerformanceCardProps {
  dataInicio?: Date;
  dataFim?: Date;
}

export default function PerformanceCard({ dataInicio, dataFim }: PerformanceCardProps) {
  const { data, loading } = useDashboardData({ dataInicio, dataFim });

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular taxa de finalização
  const taxaFinalizacao = data.totalOrdens > 0 
    ? Math.round((data.ordensFinalizadas / data.totalOrdens) * 100)
    : 0;

  // Calcular taxa de atraso
  const taxaAtraso = data.totalOrdens > 0 
    ? Math.round((data.ordensAtrasadas / data.totalOrdens) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Indicadores de performance do sistema
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Taxa de Finalização</span>
          <span className="font-medium">{taxaFinalizacao}%</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Ordens Ativas</span>
          <span className="font-medium">{data.ordensEmAndamento}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Taxa de Atraso</span>
          <span className={`font-medium ${taxaAtraso > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {taxaAtraso}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
