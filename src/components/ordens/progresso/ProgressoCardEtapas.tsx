
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EtapaOS } from "@/types/ordens";

interface ProgressoCardEtapasProps {
  progressoEtapas: {
    etapa: EtapaOS;
    nome: string;
    progresso: number;
    concluida: boolean;
  }[];
}

export function ProgressoCardEtapas({ progressoEtapas }: ProgressoCardEtapasProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso por Etapa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {progressoEtapas.map((etapa) => (
            <div key={etapa.etapa}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="font-medium">{etapa.nome}</span>
                  {etapa.concluida && (
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                      Concluída
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-medium">{etapa.progresso}%</span>
              </div>
              <Progress value={etapa.progresso} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
