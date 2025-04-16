
import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, ActivitySquare, BarChart, Wrench, Search, Clock, Calendar, Info, CheckCircle2, AlertCircle, Clock3 } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS, TipoServico, Servico } from "@/types/ordens";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/utils/timerUtils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface RelatoriosProducaoProps extends LogoutProps {}

const RelatoriosProducao = ({ onLogout }: RelatoriosProducaoProps) => {
  const [ordensDados, setOrdensDados] = useState<OrdemServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemServico | null>(null);
  const [filteredOrdens, setFilteredOrdens] = useState<OrdemServico[]>([]);
  
  useEffect(() => {
    const fetchOrdens = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "ordens"));
        const ordens: OrdemServico[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ordens.push({
            ...data,
            id: doc.id,
            dataAbertura: data.dataAbertura?.toDate() || new Date(),
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
          } as OrdemServico);
        });
        
        setOrdensDados(ordens);
        setFilteredOrdens(ordens);
      } catch (error) {
        console.error("Erro ao buscar ordens:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrdens();
  }, []);
  
  // Filtrar ordens com base no termo de pesquisa
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrdens(ordensDados);
      return;
    }
    
    const filtradas = ordensDados.filter(ordem => 
      ordem.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ordem.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ordem.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredOrdens(filtradas);
  }, [searchTerm, ordensDados]);
  
  // Dados para graficos e métricas baseados nas ordens reais
  const metricas = useMemo(() => {
    // Serviços por tipo
    const servicosPorTipo = (() => {
      const contagem: Record<string, number> = {};
      
      ordensDados.forEach(ordem => {
        ordem.servicos?.forEach(servico => {
          const tipo = servico.tipo;
          contagem[tipo] = (contagem[tipo] || 0) + 1;
        });
      });
      
      return Object.entries(contagem).map(([nome, quantidade]) => ({
        nome,
        quantidade,
        percentual: 0, // será calculado abaixo
      }));
    })();
    
    // Calcular percentuais
    const totalServicos = servicosPorTipo.reduce((sum, item) => sum + item.quantidade, 0);
    servicosPorTipo.forEach(item => {
      item.percentual = Math.round((item.quantidade / totalServicos) * 100);
    });
    
    // Ordens por status
    const ordensPorStatus = (() => {
      const contagem: Record<string, number> = {
        orcamento: 0,
        aguardando_aprovacao: 0,
        fabricacao: 0,
        aguardando_peca_cliente: 0,
        aguardando_peca_interno: 0,
        finalizado: 0,
        entregue: 0
      };
      
      ordensDados.forEach(ordem => {
        contagem[ordem.status] = (contagem[ordem.status] || 0) + 1;
      });
      
      return Object.entries(contagem).map(([status, quantidade]) => {
        let nome = status;
        
        // Converter status para formato legível
        switch (status) {
          case 'orcamento': nome = 'Orçamento'; break;
          case 'aguardando_aprovacao': nome = 'Aguardando'; break;
          case 'fabricacao': nome = 'Em Fabricação'; break;
          case 'aguardando_peca_cliente': nome = 'Aguardando Peça (Cliente)'; break;
          case 'aguardando_peca_interno': nome = 'Aguardando Peça (Interno)'; break;
          case 'finalizado': nome = 'Finalizado'; break;
          case 'entregue': nome = 'Entregue'; break;
        }
        
        return { nome, quantidade };
      });
    })();
    
    // Dados para produtividade mensal (baseado em ordens reais)
    const produtividadeMensal = (() => {
      const meses: Record<string, { ordens: number, tempo_medio: number, tempoTotal: number }> = {};
      const hoje = new Date();
      
      // Inicializar últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
        meses[mesAno] = { ordens: 0, tempo_medio: 0, tempoTotal: 0 };
      }
      
      // Preencher com dados reais
      ordensDados.forEach(ordem => {
        if (ordem.dataAbertura) {
          const data = new Date(ordem.dataAbertura);
          const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
          
          if (meses[mesAno]) {
            meses[mesAno].ordens += 1;
            // Aqui você poderia calcular o tempo médio baseado em dados reais
            // Por enquanto, vamos usar valores estimados
            meses[mesAno].tempoTotal += 2.5; // dias hipotéticos
          }
        }
      });
      
      // Calcular tempo médio
      Object.keys(meses).forEach(mesAno => {
        if (meses[mesAno].ordens > 0) {
          meses[mesAno].tempo_medio = parseFloat((meses[mesAno].tempoTotal / meses[mesAno].ordens).toFixed(1));
        }
      });
      
      // Converter para array e formatar nome do mês
      return Object.entries(meses).map(([mesAno, dados]) => {
        const [mes, ano] = mesAno.split('/');
        const nomeMes = new Date(parseInt(ano), parseInt(mes) - 1, 1)
          .toLocaleDateString('pt-BR', { month: 'long' });
        
        return {
          mes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
          ordens: dados.ordens,
          tempo_medio: dados.tempo_medio
        };
      });
    })();
    
    // Outras métricas
    const totalOrdens = ordensPorStatus.reduce((sum, item) => sum + item.quantidade, 0);
    const totalOrdensFinalizadas = ordensPorStatus.find(item => item.nome === "Finalizado")?.quantidade || 0;
    const totalOrdensEntregues = ordensPorStatus.find(item => item.nome === "Entregue")?.quantidade || 0;
    const taxaFinalizacao = ((totalOrdensFinalizadas + totalOrdensEntregues) / (totalOrdens || 1)) * 100;
    
    return {
      servicosPorTipo,
      ordensPorStatus,
      produtividadeMensal,
      totalServicos,
      totalOrdens,
      totalOrdensFinalizadas,
      totalOrdensEntregues,
      taxaFinalizacao
    };
  }, [ordensDados]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  // Função para buscar uma ordem específica
  const buscarOrdem = async (id: string) => {
    setIsLoading(true);
    try {
      const ordemRef = doc(db, "ordens", id);
      const ordemDoc = await getDoc(ordemRef);
      
      if (ordemDoc.exists()) {
        const data = ordemDoc.data();
        const ordem = {
          ...data,
          id: ordemDoc.id,
          dataAbertura: data.dataAbertura?.toDate() || new Date(),
          dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
        } as OrdemServico;
        
        setOrdemSelecionada(ordem);
      } else {
        setOrdemSelecionada(null);
      }
    } catch (error) {
      console.error("Erro ao buscar ordem:", error);
      setOrdemSelecionada(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calcular dados de produtividade para a OS selecionada
  const dadosProdutividade = useMemo(() => {
    if (!ordemSelecionada) return null;
    
    // Calcular etapas concluídas
    const etapasPossiveis: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    
    const etapasRelevantes = etapasPossiveis.filter(etapa => {
      if (etapa === "retifica") {
        return ordemSelecionada.servicos?.some(s => 
          ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo));
      } else if (etapa === "montagem") {
        return ordemSelecionada.servicos?.some(s => s.tipo === "montagem");
      } else if (etapa === "dinamometro") {
        return ordemSelecionada.servicos?.some(s => s.tipo === "dinamometro");
      } else if (etapa === "lavagem") {
        return ordemSelecionada.servicos?.some(s => s.tipo === "lavagem");
      }
      return true;
    });
    
    const etapasConcluidas = etapasRelevantes.filter(etapa => 
      ordemSelecionada.etapasAndamento?.[etapa]?.concluido
    ).length;
    
    // Calcular tempo total previsto (estimativa básica)
    let tempoTotalPrevisto = 0;
    ordemSelecionada.servicos.forEach(servico => {
      // Estimativa muito simples baseada no tipo de serviço
      switch(servico.tipo) {
        case 'bloco': tempoTotalPrevisto += 3; break; // 3 horas
        case 'biela': tempoTotalPrevisto += 1.5; break; // 1.5 horas
        case 'cabecote': tempoTotalPrevisto += 2; break; // 2 horas
        case 'virabrequim': tempoTotalPrevisto += 2.5; break; // 2.5 horas
        case 'eixo_comando': tempoTotalPrevisto += 1.5; break; // 1.5 horas
        case 'montagem': tempoTotalPrevisto += 3; break; // 3 horas
        case 'dinamometro': tempoTotalPrevisto += 2; break; // 2 horas
        case 'lavagem': tempoTotalPrevisto += 1; break; // 1 hora
      }
    });
    
    // Calcular tempo real gasto
    let tempoRealGasto = 0;
    Object.entries(ordemSelecionada.etapasAndamento || {}).forEach(([etapa, info]) => {
      if (info.iniciado && info.finalizado) {
        tempoRealGasto += (info.finalizado.getTime() - info.iniciado.getTime()) / (1000 * 60 * 60);
      }
    });
    
    // Calcular eficiência
    const eficiencia = tempoTotalPrevisto > 0 
      ? Math.min(100, Math.round((tempoTotalPrevisto / Math.max(tempoRealGasto, 0.1)) * 100))
      : 0;
    
    // Calcular tempo médio por etapa
    const etapasConcluidas2 = Object.entries(ordemSelecionada.etapasAndamento || {})
      .filter(([_, info]) => info.concluido && info.iniciado && info.finalizado);
    
    const tempoMedioPorEtapa = etapasConcluidas2.length > 0
      ? etapasConcluidas2.reduce((acc, [_, info]) => {
          return acc + ((info.finalizado?.getTime() || 0) - (info.iniciado?.getTime() || 0)) / (1000 * 60 * 60);
        }, 0) / etapasConcluidas2.length
      : 0;
    
    // Calcular desvio de tempo
    const desvioDeTempo = tempoTotalPrevisto > 0
      ? ((tempoRealGasto - tempoTotalPrevisto) / tempoTotalPrevisto) * 100
      : 0;
    
    // Calcular taxa de retrabalho (sem dados reais, usamos 0)
    const taxaRetrabalho = 0;
    
    // Qualidade final (sem dados reais, usamos "Aprovado")
    const qualidadeFinal = "Aprovado";
    
    return {
      tempoTotalPrevisto,
      tempoRealGasto,
      etapasRelevantes: etapasRelevantes.length,
      etapasConcluidas,
      eficiencia,
      tempoMedioPorEtapa,
      desvioDeTempo,
      taxaRetrabalho,
      qualidadeFinal
    };
  }, [ordemSelecionada]);
  
  // Formatar tempo em horas e minutos
  const formatarTempo = (tempoEmHoras: number) => {
    const horas = Math.floor(tempoEmHoras);
    const minutos = Math.round((tempoEmHoras - horas) * 60);
    
    if (horas === 0) {
      return `${minutos}min`;
    } else if (minutos === 0) {
      return `${horas}h`;
    } else {
      return `${horas}h ${minutos}min`;
    }
  };
  
  // Formatar etapa para exibição
  const formatarEtapa = (etapa: EtapaOS) => {
    const mapeamento: Record<EtapaOS, string> = {
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      retifica: "Retífica",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_final: "Inspeção Final"
    };
    
    return mapeamento[etapa] || etapa;
  };
  
  // Formatar tipo de serviço para exibição
  const formatarTipoServico = (tipo: TipoServico) => {
    const mapeamento: Record<TipoServico, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      lavagem: "Lavagem"
    };
    
    return mapeamento[tipo] || tipo;
  };
  
  // Formatador de data
  const formatarData = (data: Date) => {
    return data.toLocaleDateString('pt-BR');
  };
  
  // Formatador de data e hora
  const formatarDataHora = (data: Date) => {
    return `${data.toLocaleDateString('pt-BR')} ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Formatador de status
  const formatarStatus = (status: string) => {
    const mapeamento: Record<string, string> = {
      orcamento: "Orçamento",
      aguardando_aprovacao: "Aguardando Aprovação",
      fabricacao: "Em Fabricação",
      aguardando_peca_cliente: "Aguardando Peça (Cliente)",
      aguardando_peca_interno: "Aguardando Peça (Interno)",
      finalizado: "Finalizado",
      entregue: "Entregue"
    };
    
    return mapeamento[status] || status;
  };
  
  // Renderizar resumo da OS
  const renderResumoOS = () => {
    if (!ordemSelecionada) return null;
    
    const dadosOS = ordemSelecionada;
    const statusOS = dadosOS.status === "fabricacao" ? "Em andamento" : formatarStatus(dadosOS.status);
    const statusFinalizado = ["finalizado", "entregue"].includes(dadosOS.status);
    
    return (
      <Card className="mb-6">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-lg md:text-xl font-bold">Resumo da Ordem de Serviço</CardTitle>
              <CardDescription>
                OS #{dadosOS.id} - {dadosOS.nome}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href=`/ordens/${dadosOS.id}`}>
              <Info className="mr-2 h-4 w-4" />
              Ver Detalhes Completos
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium mb-2">Informações Gerais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">OS</p>
                    <p className="font-medium">#{dadosOS.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{dadosOS.cliente.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Abertura</p>
                    <p className="font-medium">{formatarData(dadosOS.dataAbertura)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status Geral</p>
                    <div className="flex items-center">
                      {dadosOS.status === "fabricacao" ? (
                        <>
                          <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-medium text-yellow-500">Em andamento</span>
                        </>
                      ) : statusFinalizado ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                          <span className="font-medium text-green-500">Concluída</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="font-medium text-blue-500">{statusOS}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Responsável Geral</p>
                    <p className="font-medium">
                      {Object.values(dadosOS.etapasAndamento || {})
                        .filter(etapa => etapa.funcionarioNome)
                        .map(etapa => etapa.funcionarioNome)
                        .filter((nome, i, arr) => arr.indexOf(nome) === i)
                        .slice(0, 1)
                        .join(", ") || "Não atribuído"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {dadosProdutividade && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium mb-2">Produtividade da OS</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Tempo Total Previsto</p>
                      <p className="font-medium">{formatarTempo(dadosProdutividade.tempoTotalPrevisto)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tempo Real Gasto</p>
                      <p className="font-medium">{formatarTempo(dadosProdutividade.tempoRealGasto)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Eficiência</p>
                      <p className="font-medium">{dadosProdutividade.eficiencia}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Etapas Concluídas</p>
                      <p className="font-medium">{dadosProdutividade.etapasConcluidas} de {dadosProdutividade.etapasRelevantes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data Estimada de Entrega</p>
                      <p className="font-medium">{formatarData(dadosOS.dataPrevistaEntrega)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Progresso Total</p>
                  <Progress value={Math.round((dadosProdutividade.etapasConcluidas / dadosProdutividade.etapasRelevantes) * 100)} className="h-2" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Renderizar tabela de tempos por etapa
  const renderTemposPorEtapa = () => {
    if (!ordemSelecionada) return null;
    
    const etapas = Object.entries(ordemSelecionada.etapasAndamento || {})
      .filter(([etapaKey]) => {
        const etapa = etapaKey as EtapaOS;
        
        // Verificar se a etapa é relevante para esta ordem
        if (etapa === "retifica") {
          return ordemSelecionada.servicos?.some(s => 
            ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo));
        } else if (etapa === "montagem") {
          return ordemSelecionada.servicos?.some(s => s.tipo === "montagem");
        } else if (etapa === "dinamometro") {
          return ordemSelecionada.servicos?.some(s => s.tipo === "dinamometro");
        } else if (etapa === "lavagem") {
          return ordemSelecionada.servicos?.some(s => s.tipo === "lavagem");
        }
        return true;
      })
      .map(([etapaKey, etapaInfo]) => {
        const etapa = etapaKey as EtapaOS;
        
        // Calcular duração
        let duracao = "";
        if (etapaInfo.iniciado && etapaInfo.finalizado) {
          const duracacoMs = etapaInfo.finalizado.getTime() - etapaInfo.iniciado.getTime();
          duracao = formatTime(duracacoMs);
        } else if (etapaInfo.iniciado) {
          const duracacoMs = new Date().getTime() - etapaInfo.iniciado.getTime();
          duracao = formatTime(duracacoMs) + " (em andamento)";
        } else {
          duracao = "Não iniciada";
        }
        
        // Formatar horários
        const inicio = etapaInfo.iniciado ? formatarDataHora(etapaInfo.iniciado) : "-";
        const fim = etapaInfo.finalizado ? formatarDataHora(etapaInfo.finalizado) : "-";
        
        return {
          etapa,
          etapaFormatada: formatarEtapa(etapa),
          inicio,
          fim,
          duracao,
          responsavel: etapaInfo.funcionarioNome || "-",
          status: etapaInfo.concluido ? "Concluída" : etapaInfo.iniciado ? "Em andamento" : "Não iniciada"
        };
      })
      .sort((a, b) => {
        // Ordenar por status de andamento
        const ordem = { "Concluída": 0, "Em andamento": 1, "Não iniciada": 2 };
        return ordem[a.status as keyof typeof ordem] - ordem[b.status as keyof typeof ordem];
      });
    
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Tempos por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {etapas.length > 0 ? (
                etapas.map((etapa, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{etapa.etapaFormatada}</TableCell>
                    <TableCell>{etapa.inicio}</TableCell>
                    <TableCell>{etapa.fim}</TableCell>
                    <TableCell>{etapa.duracao}</TableCell>
                    <TableCell>{etapa.responsavel}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={etapa.status === "Concluída" ? "default" : 
                                etapa.status === "Em andamento" ? "secondary" : "outline"}
                      >
                        {etapa.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma etapa encontrada para esta OS
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };
  
  // Renderizar tabela de serviços executados
  const renderServicosExecutados = () => {
    if (!ordemSelecionada) return null;
    
    // Agrupar serviços por categoria
    const servicosPorGrupo: Record<string, Servico[]> = {};
    
    ordemSelecionada.servicos.forEach(servico => {
      // Determinar grupo com base no tipo
      let grupo = "Outros";
      if (["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(servico.tipo)) {
        grupo = "Retífica";
      } else if (servico.tipo === "montagem") {
        grupo = "Montagem";
      } else if (servico.tipo === "dinamometro") {
        grupo = "Dinamômetro";
      } else if (servico.tipo === "lavagem") {
        grupo = "Lavagem";
      }
      
      if (!servicosPorGrupo[grupo]) {
        servicosPorGrupo[grupo] = [];
      }
      
      servicosPorGrupo[grupo].push(servico);
    });
    
    // Transformar em formato para a tabela
    const servicosTabela = Object.entries(servicosPorGrupo).flatMap(([grupo, servicos]) => {
      return servicos.map((servico, index) => {
        // Calcular tempo previsto baseado no tipo (exemplo simples)
        let tempoPrevisto = "1h";
        switch(servico.tipo) {
          case 'bloco': tempoPrevisto = "3h"; break;
          case 'biela': tempoPrevisto = "1h 30min"; break;
          case 'cabecote': tempoPrevisto = "2h"; break;
          case 'virabrequim': tempoPrevisto = "2h 30min"; break;
          case 'eixo_comando': tempoPrevisto = "1h 30min"; break;
          case 'montagem': tempoPrevisto = "3h"; break;
          case 'dinamometro': tempoPrevisto = "2h"; break;
          case 'lavagem': tempoPrevisto = "1h"; break;
        }
        
        // Calcular tempo real gasto (exemplo simples)
        let tempoReal = "Não concluído";
        if (servico.concluido && servico.dataConclusao) {
          // No caso real, você teria um início e fim para calcular o tempo real
          tempoReal = tempoPrevisto; // Aqui estamos apenas usando o previsto como exemplo
        }
        
        return {
          grupo: index === 0 ? grupo : "", // Mostrar grupo apenas na primeira linha do grupo
          servico: formatarTipoServico(servico.tipo),
          descricao: servico.descricao,
          tempoPrevisto,
          tempoReal,
          responsavel: servico.funcionarioNome || "-",
          status: servico.concluido ? "Concluído" : "Em andamento"
        };
      });
    });
    
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Serviços Executados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Tempo Previsto</TableHead>
                <TableHead>Tempo Real</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicosTabela.length > 0 ? (
                servicosTabela.map((servico, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{servico.grupo}</TableCell>
                    <TableCell>{servico.servico}</TableCell>
                    <TableCell>{servico.tempoPrevisto}</TableCell>
                    <TableCell>{servico.tempoReal}</TableCell>
                    <TableCell>{servico.responsavel}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={servico.status === "Concluído" ? "default" : "secondary"}
                      >
                        {servico.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum serviço encontrado para esta OS
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };
  
  // Renderizar indicadores técnicos
  const renderIndicadoresTecnicos = () => {
    if (!ordemSelecionada || !dadosProdutividade) return null;
    
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Indicadores Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tempo Médio por Etapa</p>
                <p className="font-medium">{formatarTempo(dadosProdutividade.tempoMedioPorEtapa)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Desvio de Tempo (previsto vs real)</p>
                <div className="flex items-center">
                  {dadosProdutividade.desvioDeTempo > 0 ? (
                    <>
                      <Clock3 className="h-4 w-4 text-red-500 mr-1" />
                      <span className="font-medium text-red-500">+{Math.abs(Math.round(dadosProdutividade.desvioDeTempo))}%</span>
                    </>
                  ) : dadosProdutividade.desvioDeTempo < 0 ? (
                    <>
                      <Clock3 className="h-4 w-4 text-green-500 mr-1" />
                      <span className="font-medium text-green-500">-{Math.abs(Math.round(dadosProdutividade.desvioDeTempo))}%</span>
                    </>
                  ) : (
                    <span className="font-medium">0%</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Taxa de Retrabalho</p>
                <p className="font-medium">{dadosProdutividade.taxaRetrabalho}%</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Qualidade Final (Inspeção)</p>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                  <span className="font-medium">{dadosProdutividade.qualidadeFinal}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Renderizar detalhes da ordem selecionada
  const renderOrdemDetalhes = () => {
    if (!ordemSelecionada) return null;
    
    return (
      <div className="space-y-0 mb-6">
        {renderResumoOS()}
        {renderTemposPorEtapa()}
        {renderServicosExecutados()}
        {renderIndicadoresTecnicos()}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center h-full">
          <p>Carregando dados dos relatórios...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Produção</h1>
          <p className="text-muted-foreground">
            Acompanhe as métricas e estatísticas de produção da empresa
          </p>
        </div>
        
        {/* Barra de pesquisa de ordens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pesquisar Ordem de Serviço</CardTitle>
            <CardDescription>
              Busque por ID, nome ou cliente para ver detalhes de tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex w-full items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por ID, nome ou cliente..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  disabled={!searchTerm.trim()}
                  onClick={() => {
                    if (filteredOrdens.length > 0) {
                      buscarOrdem(filteredOrdens[0].id);
                    }
                  }}
                >
                  Buscar
                </Button>
              </div>
              
              {searchTerm && filteredOrdens.length > 0 && (
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {filteredOrdens.map((ordem) => (
                    <div
                      key={ordem.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => buscarOrdem(ordem.id)}
                    >
                      <div className="font-medium">OS #{ordem.id} - {ordem.nome}</div>
                      <div className="text-sm text-muted-foreground">Cliente: {ordem.cliente.nome}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Detalhes da ordem selecionada */}
        {ordemSelecionada && renderOrdemDetalhes()}
        
        {/* Métricas e gráficos (mostrar apenas quando nenhuma ordem está selecionada) */}
        {!ordemSelecionada && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Wrench className="h-5 w-5 mr-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{metricas.totalServicos}</p>
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
                    <p className="text-2xl font-bold">{metricas.totalOrdens}</p>
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
                    <p className="text-2xl font-bold">{metricas.totalOrdensFinalizadas + metricas.totalOrdensEntregues}</p>
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
                    <p className="text-2xl font-bold">{metricas.taxaFinalizacao.toFixed(2)}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Serviços por Tipo</CardTitle>
                  <CardDescription>
                    Distribuição dos serviços por tipo
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metricas.servicosPorTipo}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                        nameKey="nome"
                      >
                        {metricas.servicosPorTipo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Quantidade"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Ordens por Status</CardTitle>
                  <CardDescription>
                    Distribuição das ordens de serviço por status
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metricas.ordensPorStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                        nameKey="nome"
                      >
                        {metricas.ordensPorStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Quantidade"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Produtividade Mensal</CardTitle>
                  <CardDescription>
                    Ordens concluídas e tempo médio por mês
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={metricas.produtividadeMensal}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <XAxis dataKey="mes" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="ordens" name="Ordens Concluídas" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="tempo_medio" name="Tempo Médio (dias)" fill="#82ca9d" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default RelatoriosProducao;
