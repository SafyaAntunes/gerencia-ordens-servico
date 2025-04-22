
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileBarChart, 
  ActivitySquare, 
  BarChart, 
  Wrench, 
  Search, 
  Clock, 
  Filter,
  AlertTriangle,
  Users,
  CheckCircle,
  XCircle,
  HourglassIcon
} from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS } from "@/types/ordens";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/utils/timerUtils";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, formatDistance, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProgressoRelatorio from "@/components/ordens/ProgressoRelatorio";

interface RelatoriosProducaoProps extends LogoutProps {}

const RelatoriosProducao = ({ onLogout }: RelatoriosProducaoProps) => {
  const [ordensDados, setOrdensDados] = useState<OrdemServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemServico | null>(null);
  const [filteredOrdens, setFilteredOrdens] = useState<OrdemServico[]>([]);
  const [searchType, setSearchType] = useState<"id" | "cliente" | "nome" | "status">("id");
  
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
  
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrdens(ordensDados);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    
    const filtradas = ordensDados.filter(ordem => {
      switch (searchType) {
        case "id":
          return ordem.id.toLowerCase().includes(searchTermLower);
        case "cliente":
          return ordem.cliente.nome.toLowerCase().includes(searchTermLower);
        case "nome":
          return ordem.nome.toLowerCase().includes(searchTermLower);
        case "status":
          const statusLabel = getStatusLabel(ordem.status).toLowerCase();
          return statusLabel.includes(searchTermLower);
        default:
          return false;
      }
    });
    
    setFilteredOrdens(filtradas);
  }, [searchTerm, ordensDados, searchType]);
  
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'orcamento': return 'Orçamento';
      case 'aguardando_aprovacao': return 'Aguardando Aprovação';
      case 'fabricacao': return 'Em Fabricação';
      case 'aguardando_peca_cliente': return 'Aguardando Peça (Cliente)';
      case 'aguardando_peca_interno': return 'Aguardando Peça (Interno)';
      case 'finalizado': return 'Finalizado';
      case 'entregue': return 'Entregue';
      default: return status;
    }
  };
  
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
      percentual: 0,
    }));
  })();
  
  const totalServicos = servicosPorTipo.reduce((sum, item) => sum + item.quantidade, 0);
  servicosPorTipo.forEach(item => {
    item.percentual = Math.round((item.quantidade / totalServicos) * 100);
  });
  
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
  
  const produtividadeMensal = (() => {
    const meses: Record<string, { ordens: number, tempo_medio: number, tempoTotal: number }> = {};
    const hoje = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
      meses[mesAno] = { ordens: 0, tempo_medio: 0, tempoTotal: 0 };
    }
    
    ordensDados.forEach(ordem => {
      if (ordem.dataAbertura) {
        const data = new Date(ordem.dataAbertura);
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
        
        if (meses[mesAno]) {
          meses[mesAno].ordens += 1;
          meses[mesAno].tempoTotal += 2.5;
        }
      }
    });
    
    Object.keys(meses).forEach(mesAno => {
      if (meses[mesAno].ordens > 0) {
        meses[mesAno].tempo_medio = parseFloat((meses[mesAno].tempoTotal / meses[mesAno].ordens).toFixed(1));
      }
    });
    
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
  
  const totalOrdens = ordensPorStatus.reduce((sum, item) => sum + item.quantidade, 0);
  const totalOrdensFinalizadas = ordensPorStatus.find(item => item.nome === "Finalizado")?.quantidade || 0;
  const totalOrdensEntregues = ordensPorStatus.find(item => item.nome === "Entregue")?.quantidade || 0;
  const taxaFinalizacao = ((totalOrdensFinalizadas + totalOrdensEntregues) / (totalOrdens || 1)) * 100;
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
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
  
  const calcularPercentualConclusao = (ordem: OrdemServico): number => {
    if (!ordem) return 0;
    
    // Calcular o percentual de etapas concluídas
    const etapas: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    const etapasConcluidas = etapas.filter(etapa => ordem.etapasAndamento[etapa]?.concluido).length;
    const percentualEtapas = (etapasConcluidas / etapas.length) * 100;
    
    // Calcular o percentual de serviços concluídos
    const totalServicos = ordem.servicos.length;
    const servicosConcluidos = ordem.servicos.filter(servico => servico.concluido).length;
    const percentualServicos = totalServicos > 0 ? (servicosConcluidos / totalServicos) * 100 : 0;
    
    // Média ponderada: etapas têm peso 2, serviços têm peso 1
    return Math.round((percentualEtapas * 2 + percentualServicos * 1) / 3);
  };
  
  const calcularTempoTotal = (ordem: OrdemServico): number => {
    let tempoTotal = 0;
    
    // Somar o tempo de todas as etapas que têm registro
    Object.values(ordem.etapasAndamento).forEach(etapa => {
      if (etapa.iniciado && etapa.finalizado) {
        const inicio = new Date(etapa.iniciado).getTime();
        const fim = new Date(etapa.finalizado).getTime();
        tempoTotal += fim - inicio;
      }
    });
    
    return tempoTotal;
  };
  
  const calcularTempoEstimado = (ordem: OrdemServico): number => {
    let tempoEstimado = 0;
    
    // Calcular tempo estimado baseado nas subatividades selecionadas
    ordem.servicos.forEach(servico => {
      if (servico.subatividades) {
        servico.subatividades
          .filter(sub => sub.selecionada)
          .forEach(sub => {
            if (sub.tempoEstimado) {
              // Converter horas para milissegundos
              tempoEstimado += sub.tempoEstimado * 60 * 60 * 1000;
            }
          });
      }
    });
    
    return tempoEstimado;
  };
  
  const verificarEtapasParadas = (ordem: OrdemServico): { etapa: string; tempoParado: number }[] => {
    const etapasParadas: { etapa: string; tempoParado: number }[] = [];
    const etapasNomes: Record<EtapaOS, string> = {
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      retifica: "Retífica",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_final: "Inspeção Final"
    };
    
    // Verificar etapas iniciadas mas não concluídas
    Object.entries(ordem.etapasAndamento).forEach(([etapaKey, etapaInfo]) => {
      if (etapaInfo.iniciado && !etapaInfo.concluido) {
        const iniciado = new Date(etapaInfo.iniciado).getTime();
        const agora = new Date().getTime();
        const tempoParado = agora - iniciado;
        
        // Se estiver parada há mais de 2 dias (172800000 ms)
        if (tempoParado > 172800000) {
          etapasParadas.push({
            etapa: etapasNomes[etapaKey as EtapaOS] || etapaKey,
            tempoParado
          });
        }
      }
    });
    
    return etapasParadas;
  };
  
  const contarPessoasTrabalhando = (ordem: OrdemServico): number => {
    // Conjunto para armazenar IDs únicos de funcionários trabalhando atualmente
    const funcionariosAtivos = new Set<string>();
    
    // Verificar etapas em andamento
    Object.values(ordem.etapasAndamento).forEach(etapaInfo => {
      if (etapaInfo.iniciado && !etapaInfo.concluido && etapaInfo.funcionarioId) {
        funcionariosAtivos.add(etapaInfo.funcionarioId);
      }
    });
    
    return funcionariosAtivos.size;
  };
  
  const verificarAtrasos = (ordem: OrdemServico): { tipo: 'etapa' | 'ordem'; nome: string; atraso: number }[] => {
    const atrasos: { tipo: 'etapa' | 'ordem'; nome: string; atraso: number }[] = [];
    const etapasNomes: Record<EtapaOS, string> = {
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      retifica: "Retífica",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_final: "Inspeção Final"
    };
    
    // Verificar atraso na entrega da ordem
    const hoje = new Date();
    const dataEntrega = new Date(ordem.dataPrevistaEntrega);
    
    if (hoje > dataEntrega && ordem.status !== 'entregue' && ordem.status !== 'finalizado') {
      const atraso = hoje.getTime() - dataEntrega.getTime();
      atrasos.push({
        tipo: 'ordem',
        nome: 'Data de Entrega',
        atraso
      });
    }
    
    // Verificar atrasos nas etapas
    Object.entries(ordem.etapasAndamento).forEach(([etapaKey, etapaInfo]) => {
      if (etapaInfo.iniciado && !etapaInfo.concluido && etapaInfo.tempoEstimado) {
        const iniciado = new Date(etapaInfo.iniciado).getTime();
        const tempoEstimadoMs = etapaInfo.tempoEstimado * 60 * 60 * 1000; // Horas para ms
        const tempoLimite = iniciado + tempoEstimadoMs;
        const agora = new Date().getTime();
        
        if (agora > tempoLimite) {
          atrasos.push({
            tipo: 'etapa',
            nome: etapasNomes[etapaKey as EtapaOS] || etapaKey,
            atraso: agora - tempoLimite
          });
        }
      }
    });
    
    return atrasos;
  };
  
  const formatarTempoParado = (ms: number): string => {
    const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
    const horas = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (dias > 0) {
      return `${dias} dia${dias > 1 ? 's' : ''} ${horas > 0 ? `e ${horas} hora${horas > 1 ? 's' : ''}` : ''}`;
    }
    
    return `${horas} hora${horas > 1 ? 's' : ''}`;
  };
  
  const renderOrdemDetalhes = () => {
    if (!ordemSelecionada) return null;
    
    const percentualConclusao = calcularPercentualConclusao(ordemSelecionada);
    const tempoTotal = calcularTempoTotal(ordemSelecionada);
    const tempoEstimado = calcularTempoEstimado(ordemSelecionada);
    const etapasParadas = verificarEtapasParadas(ordemSelecionada);
    const pessoasTrabalhando = contarPessoasTrabalhando(ordemSelecionada);
    const atrasos = verificarAtrasos(ordemSelecionada);
    
    const renderTempoEtapa = (etapa: EtapaOS) => {
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
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Lavagem</CardTitle>
                  </CardHeader>
                  <CardContent>{renderTempoEtapa('lavagem')}</CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Inspeção Inicial</CardTitle>
                  </CardHeader>
                  <CardContent>{renderTempoEtapa('inspecao_inicial')}</CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Retífica</CardTitle>
                  </CardHeader>
                  <CardContent>{renderTempoEtapa('retifica')}</CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Montagem</CardTitle>
                  </CardHeader>
                  <CardContent>{renderTempoEtapa('montagem')}</CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Dinamômetro</CardTitle>
                  </CardHeader>
                  <CardContent>{renderTempoEtapa('dinamometro')}</CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Inspeção Final</CardTitle>
                  </CardHeader>
                  <CardContent>{renderTempoEtapa('inspecao_final')}</CardContent>
                </Card>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Tempos por Serviço</h3>
              <div className="grid grid-cols-1 gap-4">
                {ordemSelecionada.servicos.map((servico, index) => {
                  // Encontrar o tempo total do serviço nas etapas
                  const etapaRelacionada = Object.entries(ordemSelecionada.etapasAndamento)
                    .find(([_, etapaInfo]) => etapaInfo.servicoTipo === servico.tipo);
                  
                  const tempoEtapaMs = etapaRelacionada?.[1].iniciado && etapaRelacionada[1].finalizado
                    ? new Date(etapaRelacionada[1].finalizado).getTime() - new Date(etapaRelacionada[1].iniciado).getTime()
                    : 0;
                  
                  // Calcular tempo estimado baseado nas subatividades selecionadas
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
                            {(() => {
                              switch(servico.tipo) {
                                case 'bloco': return 'Bloco';
                                case 'biela': return 'Biela';
                                case 'cabecote': return 'Cabeçote';
                                case 'virabrequim': return 'Virabrequim';
                                case 'eixo_comando': return 'Eixo de Comando';
                                case 'montagem': return 'Montagem';
                                case 'dinamometro': return 'Dinamômetro';
                                case 'lavagem': return 'Lavagem';
                                default: return servico.tipo;
                              }
                            })()}
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
                                  ))
                                }
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
        
        {/* Componente de Progresso com visualização gráfica */}
        <ProgressoRelatorio ordem={ordemSelecionada} />
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
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pesquisar Ordem de Serviço</CardTitle>
            <CardDescription>
              Pesquise por diferentes critérios para analisar detalhes da OS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row w-full items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Select 
                  value={searchType} 
                  onValueChange={(value) => setSearchType(value as any)}
                  defaultValue="id"
                >
                  <SelectTrigger className="sm:w-[180px]">
                    <SelectValue placeholder="Tipo de pesquisa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Número da OS</SelectItem>
                    <SelectItem value="cliente">Nome do Cliente</SelectItem>
                    <SelectItem value="nome">Descrição da OS</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={`Pesquisar por ${
                      searchType === "id" ? "número da OS" : 
                      searchType === "cliente" ? "nome do cliente" : 
                      searchType === "nome" ? "descrição da OS" : 
                      "status"
                    }...`}
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
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {filteredOrdens.map((ordem) => (
                    <div
                      key={ordem.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => buscarOrdem(ordem.id)}
                    >
                      <div className="font-medium">OS #{ordem.id} - {ordem.nome}</div>
                      <div className="text-sm text-muted-foreground">Cliente: {ordem.cliente.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        Status: {getStatusLabel(ordem.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchTerm && filteredOrdens.length === 0 && (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                  Nenhuma ordem encontrada com os critérios informados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {ordemSelecionada && renderOrdemDetalhes()}
        
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
                    data={servicosPorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                    nameKey="nome"
                  >
                    {servicosPorTipo.map((entry, index) => (
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
                    data={ordensPorStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                    nameKey="nome"
                  >
                    {ordensPorStatus.map((entry, index) => (
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
                  data={produtividadeMensal}
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
      </div>
    </Layout>
  );
};

export default RelatoriosProducao;
