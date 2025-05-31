
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Wrench, AlertTriangle } from "lucide-react";
import { FuncionariosDisponibilidadeTable } from "@/components/funcionarios/FuncionariosDisponibilidadeTable";
import { FuncionarioStatus } from "@/hooks/useFuncionariosDisponibilidade";
import { diagnosticarStatusFuncionario, forcarLiberacaoFuncionario } from "@/services/funcionarioEmServicoService";
import { toast } from "sonner";

interface FuncionarioStatusTabProps {
  funcionariosStatus: FuncionarioStatus[];
  loading: boolean;
}

export default function FuncionarioStatusTab({ funcionariosStatus, loading }: FuncionarioStatusTabProps) {
  const [diagnosticando, setDiagnosticando] = useState<string | null>(null);
  const [liberando, setLiberando] = useState<string | null>(null);

  const funcionariosDisponiveis = funcionariosStatus.filter(f => f.status === 'disponivel' && f.ativo !== false);
  const funcionariosOcupados = funcionariosStatus.filter(f => f.status === 'ocupado' && f.ativo !== false);
  const funcionariosInativos = funcionariosStatus.filter(f => f.ativo === false || f.status === 'inativo');
  
  // Funcionários com possível inconsistência (marcados como ocupados mas ordem não existe)
  const funcionariosInconsistentes = funcionariosOcupados.filter(f => 
    f.statusOrigem === 'statusAtividade' && 
    f.atividadeAtual?.ordemNome === 'Ordem Não Encontrada'
  );

  const handleDiagnosticar = async (funcionarioId: string) => {
    setDiagnosticando(funcionarioId);
    try {
      const resultado = await diagnosticarStatusFuncionario(funcionarioId);
      
      if ('erro' in resultado) {
        toast.error(`Erro no diagnóstico: ${resultado.erro}`);
      } else {
        const status = resultado.inconsistente ? 'Inconsistente' : 'OK';
        toast.success(`Diagnóstico concluído: ${status}`, {
          description: `Status: ${resultado.statusAtividade} | Ordem existe: ${resultado.ordemExiste ? 'Sim' : 'Não'}`
        });
      }
    } catch (error) {
      toast.error('Erro ao executar diagnóstico');
    } finally {
      setDiagnosticando(null);
    }
  };

  const handleLiberarForcado = async (funcionarioId: string) => {
    setLiberando(funcionarioId);
    try {
      const sucesso = await forcarLiberacaoFuncionario(funcionarioId);
      if (sucesso) {
        toast.success('Funcionário liberado com sucesso');
        // Forçar atualização da página após 1 segundo
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      toast.error('Erro ao liberar funcionário');
    } finally {
      setLiberando(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">{funcionariosDisponiveis.length}</div>
              <Badge variant="success" className="text-xs">Livres</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-amber-600">{funcionariosOcupados.length}</div>
              <Badge variant="warning" className="text-xs">Ocupados</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">{funcionariosInativos.length}</div>
              <Badge variant="destructive" className="text-xs">Inativos</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inconsistentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-600">{funcionariosInconsistentes.length}</div>
              <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Erro
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ferramentas de Diagnóstico */}
      {funcionariosInconsistentes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Funcionários com Dados Inconsistentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-orange-700">
              Foram detectados funcionários marcados como ocupados, mas suas ordens de serviço não existem mais.
            </p>
            
            <div className="space-y-2">
              {funcionariosInconsistentes.map(funcionario => (
                <div key={funcionario.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">{funcionario.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      Ordem: {funcionario.atividadeAtual?.ordemId || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDiagnosticar(funcionario.id)}
                      disabled={diagnosticando === funcionario.id}
                    >
                      {diagnosticando === funcionario.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Wrench className="h-4 w-4 mr-1" />
                      )}
                      Diagnosticar
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleLiberarForcado(funcionario.id)}
                      disabled={liberando === funcionario.id}
                    >
                      {liberando === funcionario.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        'Liberar'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Status */}
      <FuncionariosDisponibilidadeTable />
    </div>
  );
}
