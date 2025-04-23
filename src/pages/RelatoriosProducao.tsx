
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, ActivitySquare, BarChart, Wrench, Search, Clock, Filter, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS, TipoServico } from "@/types/ordens";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/utils/timerUtils";
import { format, isValid, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import ProgressoRelatorio from "@/components/ordens/ProgressoRelatorio";
import { formatarEtapa } from "@/components/ordens/EtapaCard";

interface RelatoriosProducaoProps extends LogoutProps {}

const RelatoriosProducao = ({ onLogout }: RelatoriosProducaoProps) => {
  const [ordensDados, setOrdensDados] = useState<OrdemServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemServico | null>(null);
  const [filteredOrdens, setFilteredOrdens] = useState<OrdemServico[]>([]);
  const [searchType, setSearchType] = useState<"id" | "cliente" | "nome" | "status">("id");
  const [activeTab, setActiveTab] = useState("resumo");
  
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
  
  const formatarData = (data: Date | undefined): string => {
    if (!data || !isValid(data)) return "Data inválida";
    return format(data, "dd/MM/yyyy", { locale: ptBR });
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
        if (isValid(data)) {
          const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
          
          if (meses[mesAno]) {
            meses[mesAno].ordens += 1;
            meses[mesAno].tempoTotal += 2.5;
          }
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
        setActiveTab("detalhes");
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
  
  const verificarAtraso = (etapa: EtapaOS, etapaInfo: any) => {
    if (!ordemSelecionada) return { status: "neutro", texto: "" };
    
    if (!etapaInfo) return { status: "neutro", texto: "Não iniciada" };
    
    if (etapaInfo.concluido) {
      return { status: "positivo", texto: "Concluída" };
    }
    
    if (!etapaInfo.iniciado) {
      return { status: "neutro", texto: "Não iniciada" };
    }
    
    // Calcular o tempo previsto para a etapa (assumindo médias)
    const tempoMedioPorEtapa: Record<EtapaOS, number> = {
      lavagem: 2 * 60 * 60 * 1000, // 2 horas em ms
      inspecao_inicial: 3 * 60 * 60 * 1000, // 3 horas em ms
      retifica: 16 * 60 * 60 * 1000, // 16 horas em ms
      montagem: 8 * 60 * 60 * 1000, // 8 horas em ms
      dinamometro: 4 * 60 * 60 * 1000, // 4 horas em ms
      inspecao_final: 2 * 60 * 60 * 1000 // 2 horas em ms
    };
    
    const inicioTimestamp = etapaInfo.iniciado instanceof Date ? etapaInfo.iniciado.getTime() : 0;
    if (!inicioTimestamp) return { status: "neutro", texto: "Em andamento" };
    
    const agoraTimestamp = new Date().getTime();
    const tempoDecorrido = agoraTimestamp - inicioTimestamp;
    const tempoPrevisto = tempoMedioPorEtapa[etapa] || 8 * 60 * 60 * 1000; // Default 8 horas
    
    if (tempoDecorrido > tempoPrevisto * 1.5) {
      return { status: "critico", texto: "Muito atrasada" };
    } else if (tempoDecorrido > tempoPrevisto) {
      return { status: "atrasado", texto: "Atrasada" };
    } else {
      return { status: "emDia", texto: "Em andamento (no prazo)" };
    }
  };
  
  const formatarNomeServico = (tipo: TipoServico): string => {
    switch(tipo) {
      case 'bloco': return 'Bloco';
      case 'biela': return 'Biela';
      case 'cabecote': return 'Cabeçote';
      case 'virabrequim': return 'Virabrequim';
      case 'eixo_comando': return 'Eixo de Comando';
      case 'montagem': return 'Montagem';
      case 'dinamometro': return 'Dinamômetro';
      case 'lavagem': return 'Lavagem';
      default: return tipo;
    }
  };
  
  const calcularProgressoEtapa = (etapa: EtapaOS) => {
    if (!ordemSelecionada) return 0;
    
    const etapaInfo = ordemSelecionada.etapasAndamento[etapa];
    
    if (etapaInfo?.concluido) return 100;
    if (!etapaInfo?.iniciado) return 0;
    
    const servicosDaEtapa = ordemSelecionada.servicos.filter(servico => {
      if (etapa === 'retifica') {
        return ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo);
      } else if (etapa === 'montagem') {
        return servico.tipo === 'montagem';
      } else if (etapa === 'dinamometro') {
        return servico.tipo === 'dinamometro';
      } else if (etapa === 'lavagem') {
        return servico.tipo === 'lavagem';
      }
      return false;
    });
    
    if (servicosDaEtapa.length === 0) return etapaInfo.iniciado ? 50 : 0;
    
    const servicosConcluidos = servicosDaEtapa.filter(s => s.concluido).length;
    return Math.round((servicosConcluidos / servicosDaEtapa.length) * 100);
  };
  
  const calcularProgressoGeral = () => {
    if (!ordemSelecionada) return 0;
    
    const etapas: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    const etapasRelevantes = etapas.filter(etapa => {
      if (etapa === "retifica") {
        return ordemSelecionada.servicos?.some(s => 
          ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo));
      } else if (etapa === "montagem") {
        return ordemSelecionada.servicos?.some(s => s.tipo === "montagem");
      } else if (etapa === "dinamometro") {
        return ordemSelecionada.servicos?.some(s => s.tipo === "dinamometro");
      } else if (etapa === "lavagem") {
        return true;
      }
      return true;
    });
    
    let totalPontos = 0;
    let pontosObtidos = 0;
    
    etapasRelevantes.forEach(etapa => {
      totalPontos += 100;
      pontosObtidos += calcularProgressoEtapa(etapa);
    });
    
    return totalPontos > 0 ? Math.round((pontosObtidos / totalPontos) * 100) : 0;
  };
  
  const verificarPrazoCumprimento = () => {
    if (!ordemSelecionada) return { status: "neutro", texto: "Sem informações", diasRestantes: 0 };
    
    const hoje = new Date();
    const dataPrevista = ordemSelecionada.dataPrevistaEntrega;
    
    if (!dataPrevista || !isValid(dataPrevista)) {
      return { status: "neutro", texto: "Data prevista não configurada", diasRestantes: 0 };
    }
    
    const diasRestantes = differenceInDays(dataPrevista, hoje);
    
    if (diasRestantes < 0) {
      return { 
        status: "critico", 
        texto: `Prazo excedido em ${Math.abs(diasRestantes)} dias`, 
        diasRestantes 
      };
    } else if (diasRestantes === 0) {
      return { 
        status: "atencao", 
        texto: "Prazo vence hoje", 
        diasRestantes 
      };
    } else if (diasRestantes <= 2) {
      return { 
        status: "atencao", 
        texto: `Restam ${diasRestantes} dias para o prazo`, 
        diasRestantes 
      };
    } else {
      return { 
        status: "positivo", 
        texto: `Restam ${diasRestantes} dias para o prazo`, 
        diasRestantes 
      };
    }
  };
  
  const renderOrdemDetalhes = () => {
    if (!ordemSelecionada) return null;
    
    const etapas: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    const progressoGeral = calcularProgressoGeral();
    const prazoCumprimento = verificarPrazoCumprimento();
    
    return (
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="resumo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">OS #{ordemSelecionada.id}</CardTitle>
                <CardDescription>
                  {ordemSelecionada.nome} - Cliente: {ordemSelecionada.cliente.nome}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-muted-foreground text-sm">Status</div>
                    <div className="flex items-center mt-1">
                      <Badge className={
                        ordemSelecionada.status === 'finalizado' || ordemSelecionada.status === 'entregue' 
                          ? "bg-green-100 text-green-700 border-green-300" 
                          : "bg-blue-100 text-blue-700 border-blue-300"
                      }>
                        {getStatusLabel(ordemSelecionada.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-muted-foreground text-sm">Data de Abertura</div>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{formatarData(ordemSelecionada.dataAbertura)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-muted-foreground text-sm">Previsão de Entrega</div>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{formatarData(ordemSelecionada.dataPrevistaEntrega)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Progresso Geral</span>
                    <span className="text-sm font-medium">{progressoGeral}%</span>
                  </div>
                  <Progress value={progressoGeral} className="h-2" />
                  
                  <div className={`mt-2 text-sm ${
                    prazoCumprimento.status === "positivo" ? "text-green-600" :
                    prazoCumprimento.status === "atencao" ? "text-amber-600" :
                    prazoCumprimento.status === "critico" ? "text-red-600" : 
                    "text-muted-foreground"
                  }`}>
                    {prazoCumprimento.status === "positivo" && <CheckCircle className="h-4 w-4 inline mr-1" />}
                    {prazoCumprimento.status === "atencao" && <Clock className="h-4 w-4 inline mr-1" />}
                    {prazoCumprimento.status === "critico" && <AlertTriangle className="h-4 w-4 inline mr-1" />}
                    {prazoCumprimento.texto}
                  </div>
                </div>
                
                <ProgressoRelatorio ordem={ordemSelecionada} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="detalhes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Ordem #{ordemSelecionada.id}</CardTitle>
                <CardDescription>
                  {ordemSelecionada.nome} - Cliente: {ordemSelecionada.cliente.nome}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tempos e Status por Etapa</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {etapas.map(etapa => {
                        const etapaInfo = ordemSelecionada.etapasAndamento[etapa];
                        const atrasoInfo = verificarAtraso(etapa, etapaInfo);
                        const progresso = calcularProgressoEtapa(etapa);
                        
                        return (
                          <Card key={etapa} className={`
                            border-l-4 
                            ${etapaInfo?.concluido ? "border-l-green-500" : 
                              atrasoInfo.status === "critico" ? "border-l-red-500" :
                              atrasoInfo.status === "atrasado" ? "border-l-amber-500" :
                              etapaInfo?.iniciado ? "border-l-blue-500" : "border-l-gray-300"}
                          `}>
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                  <h4 className="font-semibold">{formatarEtapa(etapa)}</h4>
                                  
                                  <div className="flex items-center mt-1">
                                    {etapaInfo?.concluido ? (
                                      <Badge className="bg-green-100 text-green-700 border-green-300">
                                        Concluída
                                      </Badge>
                                    ) : etapaInfo?.iniciado ? (
                                      <Badge className={`
                                        ${atrasoInfo.status === "critico" ? "bg-red-100 text-red-700 border-red-300" :
                                          atrasoInfo.status === "atrasado" ? "bg-amber-100 text-amber-700 border-amber-300" :
                                          "bg-blue-100 text-blue-700 border-blue-300"}
                                      `}>
                                        {atrasoInfo.texto}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-gray-100">
                                        Não iniciada
                                      </Badge>
                                    )}
                                    
                                    {etapaInfo?.funcionarioNome && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {etapaInfo.concluido ? "Concluído por" : "Responsável"}: {etapaInfo.funcionarioNome}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex-1 max-w-[300px]">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Progresso</span>
                                    <span>{progresso}%</span>
                                  </div>
                                  <Progress value={progresso} className="h-2" />
                                </div>
                                
                                <div className="min-w-[120px]">
                                  {etapaInfo?.iniciado && etapaInfo?.finalizado ? (
                                    <div className="text-sm">
                                      <div className="text-muted-foreground text-xs">Tempo total</div>
                                      <div className="font-medium">
                                        {formatTime(new Date(etapaInfo.finalizado).getTime() - new Date(etapaInfo.iniciado).getTime())}
                                      </div>
                                    </div>
                                  ) : etapaInfo?.iniciado ? (
                                    <div className="text-sm">
                                      <div className="text-muted-foreground text-xs">Em execução</div>
                                      <div className="font-medium text-blue-600">
                                        {formatTime(new Date().getTime() - new Date(etapaInfo.iniciado).getTime())}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">Não iniciada</div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Serviços e Subatividades</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {ordemSelecionada.servicos.map((servico, index) => (
                        <Card key={index}>
                          <CardHeader className="py-3">
                            <div className="flex justify-between">
                              <CardTitle className="text-base font-medium">
                                {formatarNomeServico(servico.tipo)}
                              </CardTitle>
                              {servico.concluido ? (
                                <Badge className="bg-green-100 text-green-700 border-green-300">
                                  Concluído
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                  Em andamento
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="py-2">
                            {servico.funcionarioNome && (
                              <div className="text-sm text-muted-foreground mb-2">
                                {servico.concluido ? "Concluído por" : "Responsável"}: {servico.funcionarioNome}
                              </div>
                            )}
                            
                            {servico.dataConclusao && (
                              <div className="text-sm text-muted-foreground mb-2">
                                Data de conclusão: {formatarData(new Date(servico.dataConclusao))}
                              </div>
                            )}
                            
                            {servico.subatividades && servico.subatividades.length > 0 && (
                              <div className="mt-2">
                                <h4 className="text-sm font-medium mb-2">Subatividades</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {servico.subatividades
                                    .filter(s => s.selecionada)
                                    .map((sub, idx) => (
                                      <div key={idx} className="flex items-center text-sm">
                                        <div className={`h-2 w-2 rounded-full mr-2 ${
                                          sub.concluida ? "bg-green-500" : "bg-gray-300"
                                        }`} />
                                        <span>{sub.nome}</span>
                                        {sub.concluida && (
                                          <span className="ml-1 text-xs text-green-600">✓</span>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Indicadores de Desempenho</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Tempo vs Prazo</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  { nome: 'Dias em Andamento', valor: differenceInDays(new Date(), ordemSelecionada.dataAbertura) },
                                  { nome: 'Dias Previstos', valor: ordemSelecionada.dataPrevistaEntrega && isValid(ordemSelecionada.dataPrevistaEntrega) ? 
                                    differenceInDays(ordemSelecionada.dataPrevistaEntrega, ordemSelecionada.dataAbertura) : 0 }
                                ]}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nome" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="valor" fill="#8884d8" name="Dias" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Progresso por Etapa</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={etapas.map(etapa => ({
                                  nome: formatarEtapa(etapa).split(' ')[0],
                                  progresso: calcularProgressoEtapa(etapa)
                                }))}
                                layout="vertical"
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis type="category" dataKey="nome" />
                                <Tooltip />
                                <Bar dataKey="progresso" fill="#82ca9d" name="Progresso %" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default RelatoriosProducao;
