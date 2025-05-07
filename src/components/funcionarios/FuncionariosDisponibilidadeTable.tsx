
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFuncionariosDisponibilidade, FuncionarioStatus } from '@/hooks/useFuncionariosDisponibilidade';
import { format, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CircleCheck, Clock, CircleDashed } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { tipoServicoLabels } from "@/types/funcionarios";

export function FuncionariosDisponibilidadeTable() {
  const { funcionariosStatus, funcionariosDisponiveis, funcionariosOcupados, loading } = useFuncionariosDisponibilidade();
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidade de Funcionários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-[150px]" />
                <Skeleton className="h-5 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Status dos Funcionários</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50">
              {funcionariosDisponiveis.length} disponíveis
            </Badge>
            <Badge variant="outline" className="bg-amber-50">
              {funcionariosOcupados.length} em serviço
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atividade Atual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {funcionariosStatus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Nenhum funcionário encontrado
                </TableCell>
              </TableRow>
            ) : (
              funcionariosStatus.map((funcionario) => (
                <TableRow key={funcionario.id}>
                  <TableCell className="font-medium">{funcionario.nome}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {funcionario.especialidades.map((esp) => (
                        <Badge key={esp} variant="secondary" className="text-xs">
                          {tipoServicoLabels[esp as keyof typeof tipoServicoLabels] || esp}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {funcionario.status === 'disponivel' ? (
                      <Badge variant="success" className="flex gap-1 items-center">
                        <CircleCheck className="h-3.5 w-3.5" /> 
                        Disponível
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="flex gap-1 items-center">
                        <Clock className="h-3.5 w-3.5" /> 
                        Ocupado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {funcionario.status === 'ocupado' && funcionario.atividadeAtual ? (
                      <div className="text-sm">
                        <div><strong>OS:</strong> {funcionario.atividadeAtual.ordemNome}</div>
                        <div>
                          <strong>Etapa:</strong> {formatEtapa(funcionario.atividadeAtual.etapa)}
                          {funcionario.atividadeAtual.servicoTipo ? 
                            ` - ${formatServicoTipo(funcionario.atividadeAtual.servicoTipo)}` : ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <strong>Início:</strong> {formatDistance(
                            new Date(funcionario.atividadeAtual.inicio),
                            new Date(),
                            { addSuffix: true, locale: ptBR }
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-muted-foreground">
                        <CircleDashed className="h-3.5 w-3.5 mr-1" /> 
                        Sem atividade
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Helpers para formatação
function formatEtapa(etapa: string): string {
  const etapasMap: Record<string, string> = {
    'lavagem': 'Lavagem',
    'inspecao_inicial': 'Inspeção Inicial',
    'retifica': 'Retífica',
    'montagem': 'Montagem',
    'dinamometro': 'Dinamômetro',
    'inspecao_final': 'Inspeção Final'
  };
  
  return etapasMap[etapa] || etapa;
}

function formatServicoTipo(tipo: string): string {
  const tiposMap: Record<string, string> = {
    'bloco': 'Bloco',
    'biela': 'Biela',
    'cabecote': 'Cabeçote',
    'virabrequim': 'Virabrequim',
    'eixo_comando': 'Eixo de Comando',
    'montagem': 'Montagem',
    'dinamometro': 'Dinamômetro',
    'lavagem': 'Lavagem'
  };
  
  return tiposMap[tipo] || tipo;
}
