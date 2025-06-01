
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFuncionariosDisponibilidade } from "@/hooks/useFuncionariosDisponibilidade";
import { Users, UserCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FuncionariosIndicador() {
  const { funcionariosDisponiveis, funcionariosOcupados, loading } = useFuncionariosDisponibilidade();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Status dos Funcionários
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Status dos Funcionários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Disponíveis</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {funcionariosDisponiveis.length}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Ocupados</span>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {funcionariosOcupados.length}
            </Badge>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Ativo</span>
              <span className="font-medium">
                {funcionariosDisponiveis.length + funcionariosOcupados.length}
              </span>
            </div>
          </div>

          {funcionariosOcupados.length > 0 && (
            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-2">Funcionários Ocupados:</h4>
              <div className="space-y-1">
                {funcionariosOcupados.slice(0, 3).map((funcionario) => (
                  <div key={funcionario.id} className="text-xs text-muted-foreground">
                    <span className="font-medium">{funcionario.nome}</span>
                    {funcionario.atividadeAtual && (
                      <span className="ml-1">- {funcionario.atividadeAtual.ordemNome}</span>
                    )}
                  </div>
                ))}
                {funcionariosOcupados.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{funcionariosOcupados.length - 3} outros...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
