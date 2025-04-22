
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wrench, FileBarChart, ActivitySquare, BarChart } from "lucide-react";

type ResumoProps = {
  totalServicos: number;
  totalOrdens: number;
  totalOrdensFinalizadas: number;
  totalOrdensEntregues: number;
  taxaFinalizacao: number;
};

export default function RelatorioResumoCards({
  totalServicos,
  totalOrdens,
  totalOrdensFinalizadas,
  totalOrdensEntregues,
  taxaFinalizacao,
}: ResumoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{totalServicos}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <FileBarChart className="h-5 w-5 mr-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{totalOrdens}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ordens Finalizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <ActivitySquare className="h-5 w-5 mr-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{totalOrdensFinalizadas + totalOrdensEntregues}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Finalização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{taxaFinalizacao.toFixed(2)}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
