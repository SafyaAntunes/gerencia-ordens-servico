
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

interface ResumoOperacionalCardProps {
  dataInicio?: Date;
  dataFim?: Date;
}

export default function ResumoOperacionalCard({ dataInicio, dataFim }: ResumoOperacionalCardProps) {
  const { data, loading } = useDashboardData({ dataInicio, dataFim });

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Resumo Operacional
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

  // Contar tipos diferentes de status
  const statusDiferentes = data.ordensPorStatus.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Resumo Operacional
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Informações operacionais importantes
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Novos Orçamentos</span>
          <span className="font-medium">{data.ordensOrcamento}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tipos de Serviços</span>
          <span className="font-medium">{data.servicosPorTipo.length}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status Diferentes</span>
          <span className="font-medium">{statusDiferentes}</span>
        </div>
      </CardContent>
    </Card>
  );
}
