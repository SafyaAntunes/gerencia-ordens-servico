
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, XCircle, Clock, Users, HourglassIcon } from "lucide-react";
import { OrdemServico, EtapaOS } from "@/types/ordens";
import { formatTime } from "@/utils/timerUtils";
import { formatDistance, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProgressoRelatorio from "@/components/ordens/ProgressoRelatorio";
import { getStatusLabel, calcularPercentualConclusao, calcularTempoTotal, calcularTempoEstimado } from "@/utils/relatoriosProducaoUtils";
import React from "react";

interface OSDetalhesSectionProps {
  ordemSelecionada: OrdemServico;
  atrasos: { tipo: 'etapa' | 'ordem'; nome: string; atraso: number }[];
  etapasParadas: { etapa: string; tempoParado: number }[];
  pessoasTrabalhando: number;
}

const renderTempoEtapa = (ordemSelecionada: OrdemServico, etapa: EtapaOS) => {
  const etapaInfo = ordemSelecionada?.etapasAndamento[etapa];
  if (!etapaInfo) return "Não iniciada";

  if (etapaInfo.concluido) {
    if (etapaInfo.iniciado && etapaInfo.finalizado) {
      const tempoTotal = etapaInfo.finalizado.getTime() - etapaInfo.iniciado.getTime();
      const tempoEstimadoMs = (etapaInfo.tempoEstimado || 0) * 60 * 60 * 1000;
      const emAtraso = tempoEstimadoMs > 0 && tempoTotal > tempoEstimadoMs;

      return (
        <div>
          <div className="flex items-center gap-1">
            <span>Concluída em: {formatTime(tempoTotal)}</span>
            {tempoEstimadoMs > 0 && (
              <Badge variant={emAtraso ? "destructive" : "success"} className="ml-2">
                {emAtraso ? (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Atraso: {formatTime(tempoTotal - tempoEstimadoMs)}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    No prazo
                  </>
                )}
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center">
            <Users className="h-3 w-3 mr-1" />
            Executado por: {etapaInfo.funcionarioNome || "Não atribuído"}
          </div>
          {tempoEstimadoMs > 0 && (
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <HourglassIcon className="h-3 w-3 mr-1" />
              Tempo estimado: {formatTime(tempoEstimadoMs)}
            </div>
          )}
        </div>
      );
    }
    return "Concluída";
  }

  if (etapaInfo.iniciado) {
    const agora = new Date();
    const tempoDecorrido = agora.getTime() - etapaInfo.iniciado.getTime();
    const tempoEstimadoMs = (etapaInfo.tempoEstimado || 0) * 60 * 60 * 1000;
    const emAtraso = tempoEstimadoMs > 0 && tempoDecorrido > tempoEstimadoMs;

    return (
      <div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1 text-amber-500" />
          <span>Em andamento: {formatTime(tempoDecorrido)}</span>
          {tempoEstimadoMs > 0 && (
            <Badge variant={emAtraso ? "destructive" : "outline"} className="ml-2">
              {emAtraso ? (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Atraso: {formatTime(tempoDecorrido - tempoEstimadoMs)}
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Restante: {formatTime(tempoEstimadoMs - tempoDecorrido)}
                </>
              )}
            </Badge>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1 flex items-center">
          <Users className="h-3 w-3 mr-1" />
          Executado por: {etapaInfo.funcionarioNome || "Não atribuído"}
        </div>
        {tempoEstimadoMs > 0 && (
          <div className="text-xs text-gray-500 mt-1 flex items-center">
            <HourglassIcon className="h-3 w-3 mr-1" />
            Tempo estimado: {formatTime(tempoEstimadoMs)}
          </div>
        )}
      </div>
    );
  }

  return "Não iniciada";
};

const formatarTempoParado = (ms: number): string => {
  const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
  const horas = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (dias > 0) {
    return `${dias} dia${dias > 1 ? 's' : ''} ${horas > 0 ? `e ${horas} hora${horas > 1 ? 's' : ''}` : ''}`;
  }
  return `${horas} hora${horas > 1 ? 's' : ''}`;
};

export default function OSDetalhesSection({
  ordemSelecionada,
  atrasos,
  etapasParadas,
  pessoasTrabalhando,
}: OSDetalhesSectionProps) {
  const percentualConclusao = calcularPercentualConclusao(ordemSelecionada);
  const tempoTotal = calcularTempoTotal(ordemSelecionada);
  const tempoEstimado = calcularTempoEstimado(ordemSelecionada);

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Detalhes da Ordem #{ordemSelecionada.id}</CardTitle>
              <CardDescription>
                {ordemSelecionada.nome} - Cliente: {ordemSelecionada.cliente.nome}
              </CardDescription>
            </div>
            <Badge
              variant={
                ordemSelecionada.status === 'entregue' ? "success" :
                ordemSelecionada.status === 'finalizado' ? "success" :
                ordemSelecionada.status === 'fabricacao' ? "default" :
                ordemSelecionada.status === 'aguardando_aprovacao' ? "outline" :
                ordemSelecionada.status === 'aguardando_peca_cliente' ? "destructive" :
                ordemSelecionada.status === 'aguardando_peca_interno' ? "destructive" :
                "outline"
              }
              className="ml-2"
            >
              {getStatusLabel(ordemSelecionada.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conclusão</span>
                    <span className="text-sm font-medium">{percentualConclusao}%</span>
                  </div>
                  <Progress value={percentualConclusao} className="h-2" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tempo Registrado vs. Estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Real: {formatTime(tempoTotal)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <HourglassIcon className="h-4 w-4 text-amber-500" />
                    <span>Estimado: {formatTime(tempoEstimado)}</span>
                  </div>
                  {tempoEstimado > 0 && (
                    <Badge
                      variant={tempoTotal > tempoEstimado ? "destructive" : "success"}
                      className="mt-2 self-start"
                    >
                      {tempoTotal > tempoEstimado ? (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Acima do estimado: {formatTime(tempoTotal - tempoEstimado)}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Abaixo do estimado: {formatTime(tempoEstimado - tempoTotal)}
                        </>
                      )}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col text-sm gap-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <span>Pessoas trabalhando: {pessoasTrabalhando}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span>
                      Aberta há: {differenceInDays(new Date(), new Date(ordemSelecionada.dataAbertura))} dias
                    </span>
                  </div>
                  {ordemSelecionada.dataPrevistaEntrega && (
                    <div className="flex items-center gap-1">
                      <Clock className={`h-4 w-4 ${new Date() > new Date(ordemSelecionada.dataPrevistaEntrega) ? 'text-red-500' : 'text-blue-500'}`} />
                      <span>
                        {new Date() > new Date(ordemSelecionada.dataPrevistaEntrega)
                          ? `Atrasada: ${formatDistance(new Date(), new Date(ordemSelecionada.dataPrevistaEntrega), { locale: ptBR })}`
                          : `Prazo: ${formatDistance(new Date(ordemSelecionada.dataPrevistaEntrega), new Date(), { locale: ptBR })}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          {atrasos.length > 0 && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-red-700">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Alertas de Atraso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {atrasos.map((atraso, index) => (
                    <div key={index} className="flex items-center text-sm text-red-700">
                      <AlertTriangle className="h-3 w-3 mr-2" />
                      <span>
                        {atraso.tipo === 'ordem'
                          ? `A OS está atrasada em relação à data de entrega (${formatarTempoParado(atraso.atraso)})`
                          : `A etapa "${atraso.nome}" está em atraso (${formatarTempoParado(atraso.atraso)})`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {etapasParadas.length > 0 && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-amber-700">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Etapas Paradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {etapasParadas.map((etapa, index) => (
                    <div key={index} className="flex items-center text-sm text-amber-700">
                      <Clock className="h-3 w-3 mr-2" />
                      <span>
                        A etapa "{etapa.etapa}" está parada há {formatarTempoParado(etapa.tempoParado)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Tempos por Etapa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"] as EtapaOS[]).map((etapa) => (
                <Card key={etapa}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {{
                        lavagem: "Lavagem",
                        inspecao_inicial: "Inspeção Inicial",
                        retifica: "Retífica",
                        montagem: "Montagem",
                        dinamometro: "Dinamômetro",
                        inspecao_final: "Inspeção Final"
                      }[etapa]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>{renderTempoEtapa(ordemSelecionada, etapa)}</CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Tempos por Serviço</h3>
            <div className="grid grid-cols-1 gap-4">
              {ordemSelecionada.servicos.map((servico, index) => {
                const etapaRelacionada = Object.entries(ordemSelecionada.etapasAndamento)
                  .find(([_, etapaInfo]) => etapaInfo.servicoTipo === servico.tipo);
                const tempoEtapaMs = etapaRelacionada?.[1].iniciado && etapaRelacionada[1].finalizado
                  ? new Date(etapaRelacionada[1].finalizado).getTime() - new Date(etapaRelacionada[1].iniciado).getTime()
                  : 0;
                let tempoEstimadoServico = 0;
                if (servico.subatividades) {
                  servico.subatividades
                    .filter(sub => sub.selecionada)
                    .forEach(sub => {
                      if (sub.tempoEstimado) {
                        tempoEstimadoServico += sub.tempoEstimado * 60 * 60 * 1000;
                      }
                    });
                }
                const emAtraso = tempoEstimadoServico > 0 && tempoEtapaMs > tempoEstimadoServico;

                return (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-sm font-medium">
                          {{
                            bloco: "Bloco",
                            biela: "Biela",
                            cabecote: "Cabeçote",
                            virabrequim: "Virabrequim",
                            eixo_comando: "Eixo de Comando",
                            montagem: "Montagem",
                            dinamometro: "Dinamômetro",
                            lavagem: "Lavagem"
                          }[servico.tipo] || servico.tipo}
                        </CardTitle>
                        <Badge variant={servico.concluido ? "success" : "outline"}>
                          {servico.concluido ? "Concluído" : "Em andamento"}
                        </Badge>
                      </div>
                      <CardDescription>{servico.descricao}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tempoEtapaMs > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span>Tempo registrado: {formatTime(tempoEtapaMs)}</span>
                          </div>
                        )}
                        {tempoEstimadoServico > 0 && (
                          <div className="flex items-center gap-1">
                            <HourglassIcon className="h-4 w-4 text-amber-500" />
                            <span>Tempo estimado: {formatTime(tempoEstimadoServico)}</span>
                          </div>
                        )}
                        {tempoEtapaMs > 0 && tempoEstimadoServico > 0 && (
                          <Badge
                            variant={emAtraso ? "destructive" : "success"}
                            className="mt-1"
                          >
                            {emAtraso ? (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Acima do estimado: {formatTime(tempoEtapaMs - tempoEstimadoServico)}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Abaixo do estimado: {formatTime(tempoEstimadoServico - tempoEtapaMs)}
                              </>
                            )}
                          </Badge>
                        )}
                        {servico.concluido && servico.funcionarioNome && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            Concluído por: {servico.funcionarioNome}
                          </div>
                        )}
                        {servico.dataConclusao && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Data de conclusão: {new Date(servico.dataConclusao).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {!servico.concluido && servico.subatividades && servico.subatividades.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-medium mb-1">Progresso das subatividades:</div>
                            <div className="space-y-2">
                              {servico.subatividades
                                .filter(sub => sub.selecionada)
                                .map((sub, i) => (
                                  <div key={i} className="flex justify-between items-center">
                                    <div className="flex items-center">
                                      {sub.concluida
                                        ? <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                                        : <Clock className="h-3 w-3 mr-1 text-amber-500" />
                                      }
                                      <span className="text-xs">{sub.nome}</span>
                                    </div>
                                    <Badge
                                      variant={sub.concluida ? "success" : "outline"}
                                      className="text-xs py-0 px-2 h-5"
                                    >
                                      {sub.concluida ? "Concluída" : "Pendente"}
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      <ProgressoRelatorio ordem={ordemSelecionada} />
    </div>
  );
}
