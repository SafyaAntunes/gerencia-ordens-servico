
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useFuncionariosDisponibilidade, { FuncionarioStatus } from '@/hooks/useFuncionariosDisponibilidade';
import { CircleCheck, Clock, CircleX } from "lucide-react";
import { format, formatDistance, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export function FuncionariosDisponibilidade() {
  const { 
    funcionariosStatus, 
    funcionariosDisponiveis, 
    funcionariosOcupados, 
    funcionariosInativos, 
    loading 
  } = useFuncionariosDisponibilidade();
  
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
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Disponibilidade de Funcionários</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50">
              {funcionariosDisponiveis.length} disponíveis
            </Badge>
            <Badge variant="outline" className="bg-amber-50">
              {funcionariosOcupados.length} em serviço
            </Badge>
            {funcionariosInativos.length > 0 && (
              <Badge variant="outline" className="bg-red-50">
                {funcionariosInativos.length} inativos
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {funcionariosStatus.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum funcionário encontrado.</p>
        ) : (
          <div className="space-y-3">
            {/* Funcionários disponíveis */}
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <CircleCheck className="h-4 w-4 text-green-500 mr-1" />
                Disponíveis
              </h3>
              
              {funcionariosDisponiveis.length === 0 ? (
                <p className="text-sm text-muted-foreground pl-5">Todos os funcionários estão ocupados ou inativos.</p>
              ) : (
                <div className="pl-5 space-y-1">
                  {funcionariosDisponiveis.map(funcionario => (
                    <div key={funcionario.id} className="text-sm flex justify-between">
                      <span>{funcionario.nome}</span>
                      <Badge variant="success" className="text-xs">Disponível</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Funcionários ocupados */}
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <Clock className="h-4 w-4 text-amber-500 mr-1" />
                Em Serviço
              </h3>
              
              {funcionariosOcupados.length === 0 ? (
                <p className="text-sm text-muted-foreground pl-5">Nenhum funcionário em serviço no momento.</p>
              ) : (
                <div className="pl-5 space-y-2">
                  {funcionariosOcupados.map(funcionario => (
                    <div key={funcionario.id} className="text-sm">
                      <div className="flex justify-between">
                        <span>{funcionario.nome}</span>
                        <Badge variant="warning" className="text-xs">Ocupado</Badge>
                      </div>
                      {funcionario.atividadeAtual && (
                        <div className="text-xs text-muted-foreground mt-1 pl-2">
                          <div>OS: {funcionario.atividadeAtual.ordemNome}</div>
                          <div>
                            Etapa: {formatEtapa(funcionario.atividadeAtual.etapa)}
                            {funcionario.atividadeAtual.servicoTipo ? 
                              ` - ${formatServicoTipo(funcionario.atividadeAtual.servicoTipo)}` : 
                              ''}
                          </div>
                          <div>
                            Início: {formatTempoAtividade(funcionario.atividadeAtual.inicio)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Funcionários inativos */}
            {funcionariosInativos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium flex items-center mb-2">
                  <CircleX className="h-4 w-4 text-red-500 mr-1" />
                  Inativos
                </h3>
                
                <div className="pl-5 space-y-1">
                  {funcionariosInativos.map(funcionario => (
                    <div key={funcionario.id} className="text-sm flex justify-between">
                      <span>{funcionario.nome}</span>
                      <Badge variant="destructive" className="text-xs">Inativo</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
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

// Função para formatar o tempo de atividade de forma segura
function formatTempoAtividade(data: Date | undefined | null): string {
  if (!data) return 'Sem registro de início';
  
  try {
    const dataInicio = new Date(data);
    if (!isValid(dataInicio)) return 'Data inválida';
    
    return formatDistance(
      dataInicio,
      new Date(),
      { addSuffix: true, locale: ptBR }
    );
  } catch (error) {
    console.error("Erro ao formatar data de início:", error);
    return 'Erro na data';
  }
}
