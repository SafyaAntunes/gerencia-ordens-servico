
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressoCardServicosProps {
  progressoServicos: {
    tipo: string;
    nome: string;
    progresso: number;
    concluido: boolean;
  }[];
}

export function ProgressoCardServicos({ progressoServicos }: ProgressoCardServicosProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso por Serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {progressoServicos.map((servico) => (
            <div key={servico.tipo}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="font-medium">{servico.nome}</span>
                  {servico.concluido && (
                    <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                      Concluído
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-medium">{servico.progresso}%</span>
              </div>
              <Progress value={servico.progresso} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
