
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
import { collection, getDocs, doc, getDoc, query, where, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS, Cliente } from "@/types/ordens";
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
import RelatorioResumoCards from "@/components/relatorios/RelatorioResumoCards";
import RelatorioGraficos from "@/components/relatorios/RelatorioGraficos";
import OSDetalhesSection from "@/components/relatorios/OSDetalhesSection";
import { 
  getStatusLabel, 
  calcularPercentualConclusao, 
  calcularTempoTotal, 
  calcularTempoEstimado,
  verificarEtapasParadas,
  contarPessoasTrabalhando,
  verificarAtrasos,
  formatarTempoParado
} from "@/utils/relatoriosProducaoUtils";

interface RelatoriosProducaoProps extends LogoutProps {}

interface ExtendedOrdemServico extends OrdemServico {
  dataAbertura: Date;
  dataFinalizacao?: Date;
  dataCriacao?: Date | string;
  identificacao?: string;
  descricao?: string;
  funcionariosData?: any[];
}

const RelatoriosProducao = ({ onLogout }: RelatoriosProducaoProps) => {
  const [ordens, setOrdens] = useState<ExtendedOrdemServico[]>([]);
  const [filteredOrdens, setFilteredOrdens] = useState<ExtendedOrdemServico[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedOrdem, setSelectedOrdem] = useState<ExtendedOrdemServico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState<string>("30dias");
  
  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", 
    "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"
  ];
  
  useEffect(() => {
    const fetchOrdens = async () => {
      setIsLoading(true);
      try {
        const ordensRef = collection(db, "ordens");
        const querySnapshot = await getDocs(ordensRef);
        
        const ordensData: ExtendedOrdemServico[] = [];
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data() as DocumentData;
          const ordemCompleta = { 
            id: docSnap.id, 
            ...data,
            dataAbertura: new Date(data.dataAbertura?.toDate?.() || data.dataAbertura || new Date()),
            dataCriacao: data.dataCriacao?.toDate?.() || data.dataCriacao || new Date(),
          } as ExtendedOrdemServico;
          
          if (data.cliente?.id) {
            const clienteRef = doc(db, "clientes", data.cliente.id);
            const clienteSnap = await getDoc(clienteRef);
            if (clienteSnap.exists()) {
              const clienteData = clienteSnap.data();
              ordemCompleta.cliente = {
                id: clienteSnap.id,
                nome: clienteData.nome || "Sem nome",
                telefone: clienteData.telefone || "",
                email: clienteData.email || "",
                ...clienteData
              } as Cliente;
            }
          }
          
          ordensData.push(ordemCompleta);
        }
        
        setOrdens(ordensData);
        setFilteredOrdens(ordensData);
      } catch (error) {
        console.error("Error fetching orders: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrdens();
  }, []);
  
  // Função para pesquisar ordem de serviço específica
  const handlePesquisaOS = () => {
    if (!searchTerm.trim()) {
      setFilteredOrdens(ordens);
      setSelectedOrdem(null);
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    // Busca exata pelo ID ou parcial pelo nome/identificação
    const osEncontrada = ordens.find(ordem => 
      ordem.id?.toLowerCase() === searchLower || 
      ordem.id?.toLowerCase().includes(searchLower)
    );
    
    if (osEncontrada) {
      setFilteredOrdens([osEncontrada]);
      handleSelectOrdem(osEncontrada);
      // Automaticamente muda para a aba de detalhes
      setTimeout(() => {
        document.querySelector('[data-value="detalhes"]')?.dispatchEvent(new MouseEvent('click'));
      }, 100);
    } else {
      // Se não encontrar pelo ID exato, busca por outros campos
      const resultados = ordens.filter(ordem =>
        ordem.id?.toLowerCase().includes(searchLower) ||
        ordem.identificacao?.toLowerCase().includes(searchLower) ||
        ordem.cliente?.nome?.toLowerCase().includes(searchLower) ||
        ordem.descricao?.toLowerCase().includes(searchLower)
      );
      
      setFilteredOrdens(resultados);
      setSelectedOrdem(null);
    }
  };
  
  // Executar pesquisa ao pressionar Enter
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handlePesquisaOS();
    }
  };
  
  useEffect(() => {
    let filtered = [...ordens];
    
    const dataAtual = new Date();
    
    if (periodo === "7dias") {
      const sevenDaysAgo = new Date(dataAtual);
      sevenDaysAgo.setDate(dataAtual.getDate() - 7);
      filtered = filtered.filter(ordem => ordem.dataCriacao && new Date(ordem.dataCriacao) >= sevenDaysAgo);
    } else if (periodo === "30dias") {
      const thirtyDaysAgo = new Date(dataAtual);
      thirtyDaysAgo.setDate(dataAtual.getDate() - 30);
      filtered = filtered.filter(ordem => ordem.dataCriacao && new Date(ordem.dataCriacao) >= thirtyDaysAgo);
    } else if (periodo === "90dias") {
      const ninetyDaysAgo = new Date(dataAtual);
      ninetyDaysAgo.setDate(dataAtual.getDate() - 90);
      filtered = filtered.filter(ordem => ordem.dataCriacao && new Date(ordem.dataCriacao) >= ninetyDaysAgo);
    }
    
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(ordem => ordem.status === statusFilter);
    }
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        ordem =>
          ordem.id?.toLowerCase().includes(searchLower) ||
          ordem.identificacao?.toLowerCase().includes(searchLower) ||
          ordem.cliente?.nome?.toLowerCase().includes(searchLower) ||
          ordem.descricao?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredOrdens(filtered);
  }, [ordens, statusFilter, periodo]);
  
  const statusMap = {
    aguardando_aprovacao: "Aguardando Aprovação",
    aguardando_peca_cliente: "Aguardando Peça (Cliente)",
    aguardando_peca_interno: "Aguardando Peça (Interno)",
    fabricacao: "Em Fabricação",
    finalizado: "Finalizado",
    entregue: "Entregue",
    orcamento: "Orçamento"
  };
  
  const buscarNomeFuncionario = (funcionarioId: string, listaFuncionarios: any[]) => {
    const funcionario = listaFuncionarios.find(func => func.id === funcionarioId);
    return funcionario ? funcionario.nome : "Não atribuído";
  };
  
  const formatarData = (data: string | Date) => {
    if (!data) return "N/A";
    
    try {
      const dateObj = data instanceof Date ? data : new Date(data);
      
      if (isNaN(dateObj.getTime())) {
        return "Data inválida";
      }
      
      return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error, data);
      return "Erro na data";
    }
  };
  
  const calcularDadosResumo = () => {
    let totalServicos = 0;
    let totalOrdens = filteredOrdens.length;
    let totalOrdensFinalizadas = 0;
    let totalOrdensEntregues = 0;
    
    filteredOrdens.forEach(ordem => {
      if (ordem.servicos && Array.isArray(ordem.servicos)) {
        totalServicos += ordem.servicos.length;
      }
      
      if (ordem.status === "finalizado") {
        totalOrdensFinalizadas++;
      } else if (ordem.status === "entregue") {
        totalOrdensEntregues++;
      }
    });
    
    const taxaFinalizacao = totalOrdens > 0 
      ? ((totalOrdensFinalizadas + totalOrdensEntregues) / totalOrdens) * 100 
      : 0;
    
    return {
      totalServicos,
      totalOrdens,
      totalOrdensFinalizadas,
      totalOrdensEntregues,
      taxaFinalizacao
    };
  };
  
  const prepararDadosGraficos = () => {
    const dataAtual = new Date();
    
    const servicosPorTipoMap = new Map<string, number>();
    
    filteredOrdens.forEach(ordem => {
      if (ordem.servicos && Array.isArray(ordem.servicos)) {
        ordem.servicos.forEach(servico => {
          const tipoServico = servico.tipo || "Sem tipo";
          servicosPorTipoMap.set(
            tipoServico, 
            (servicosPorTipoMap.get(tipoServico) || 0) + 1
          );
        });
      }
    });
    
    const servicosPorTipo = Array.from(servicosPorTipoMap.entries())
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
        percentual: quantidade / calcularDadosResumo().totalServicos
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    const ordensPorStatusMap = new Map<string, number>();
    
    filteredOrdens.forEach(ordem => {
      const statusNome = statusMap[ordem.status as keyof typeof statusMap] || ordem.status;
      ordensPorStatusMap.set(
        statusNome, 
        (ordensPorStatusMap.get(statusNome) || 0) + 1
      );
    });
    
    const ordensPorStatus = Array.from(ordensPorStatusMap.entries())
      .map(([nome, quantidade]) => ({
        nome,
        quantidade
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
    
    const produtividadeMensal: {
      mes: string;
      ordens: number;
      tempo_medio: number;
    }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const dataAlvo = new Date(dataAtual);
      dataAlvo.setMonth(dataAtual.getMonth() - i);
      
      const mes = format(dataAlvo, "MMM", { locale: ptBR });
      const ordensDoMes = filteredOrdens.filter(ordem => {
        if (!ordem.dataCriacao) return false;
        const dataOrdem = new Date(ordem.dataCriacao);
        return dataOrdem.getMonth() === dataAlvo.getMonth() && 
               dataOrdem.getFullYear() === dataAlvo.getFullYear();
      });
      
      let tempoTotalDias = 0;
      let ordensFinalizadas = 0;
      
      ordensDoMes.forEach(ordem => {
        if (ordem.status === "finalizado" || ordem.status === "entregue") {
          ordensFinalizadas++;
          if (ordem.dataCriacao && ordem.dataFinalizacao) {
            const inicio = new Date(ordem.dataCriacao);
            const fim = new Date(ordem.dataFinalizacao);
            const diferencaDias = Math.max(differenceInDays(fim, inicio), 1);
            tempoTotalDias += diferencaDias;
          }
        }
      });
      
      const tempoMedioDias = ordensFinalizadas > 0 ? tempoTotalDias / ordensFinalizadas : 0;
      
      produtividadeMensal.push({
        mes,
        ordens: ordensFinalizadas,
        tempo_medio: Number(tempoMedioDias.toFixed(1))
      });
    }
    
    return { servicosPorTipo, ordensPorStatus, produtividadeMensal };
  };
  
  const verificarServicoEmAtraso = (servico: any) => {
    if (!servico.dataInicio || !servico.tempoEstimado) return false;
    
    const inicio = new Date(servico.dataInicio).getTime();
    const estimadoMs = servico.tempoEstimado * 60 * 60 * 1000;
    const estimadoFim = inicio + estimadoMs;
    
    if (servico.dataConclusao) {
      const conclusao = new Date(servico.dataConclusao).getTime();
      return conclusao > estimadoFim;
    }
    
    return Date.now() > estimadoFim;
  };
  
  const handleSelectOrdem = async (ordem: ExtendedOrdemServico) => {
    setSelectedOrdem(ordem);
    
    const funcionariosIds = new Set<string>();
    
    Object.values(ordem.etapasAndamento || {}).forEach(etapa => {
      if (etapa.funcionarioId) {
        funcionariosIds.add(etapa.funcionarioId);
      }
    });
    
    if (funcionariosIds.size > 0) {
      try {
        const funcionariosData: any[] = [];
        
        for (const funcionarioId of funcionariosIds) {
          const funcionarioRef = doc(db, "funcionarios", funcionarioId);
          const funcionarioSnap = await getDoc(funcionarioRef);
          
          if (funcionarioSnap.exists()) {
            funcionariosData.push({
              id: funcionarioSnap.id,
              ...funcionarioSnap.data()
            });
          }
        }
        
        setSelectedOrdem({
          ...ordem,
          funcionariosData: funcionariosData
        });
      } catch (error) {
        console.error("Erro ao buscar dados dos funcionários:", error);
      }
    }
  };
  
  const analisarOrdemServico = (ordem: ExtendedOrdemServico) => {
    if (!ordem) return null;
    
    const etapasParadas = verificarEtapasParadas(ordem);
    const pessoasTrabalhando = contarPessoasTrabalhando(ordem);
    const atrasos = verificarAtrasos(ordem);
    const percentualConclusao = calcularPercentualConclusao(ordem);
    const tempoTotalMs = calcularTempoTotal(ordem);
    const tempoTotalHoras = tempoTotalMs / (1000 * 60 * 60);
    const tempoEstimadoMs = calcularTempoEstimado(ordem);
    const tempoEstimadoHoras = tempoEstimadoMs / (1000 * 60 * 60);
    const dentroDoPrazo = tempoTotalMs <= tempoEstimadoMs;
    const diferencaTempo = Math.abs(tempoTotalHoras - tempoEstimadoHoras);
    
    return {
      percentualConclusao,
      tempoTotalHoras,
      tempoEstimadoHoras,
      dentroDoPrazo,
      diferencaTempo,
      etapasParadas,
      pessoasTrabalhando,
      atrasos
    };
  };
  
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-4 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">
              Relatórios de Produção
            </h1>
            <p className="text-muted-foreground">Análise de produtividade e performance das ordens de serviço.</p>
          </div>
        </div>
        
        {/* Barra de pesquisa principal */}
        <div className="w-full flex gap-2 mt-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar por número da OS, cliente ou descrição"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button onClick={handlePesquisaOS}>
            Pesquisar
          </Button>
        </div>
        
        <Tabs defaultValue="resumo" className="mt-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="resumo">
              <BarChart className="h-4 w-4 mr-2" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="ordens">
              <FileBarChart className="h-4 w-4 mr-2" />
              Ordens
            </TabsTrigger>
            <TabsTrigger value="detalhes">
              <Wrench className="h-4 w-4 mr-2" />
              Detalhes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="resumo" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                  <SelectItem value="todos">Todos os tempos</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                  <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                  <SelectItem value="fabricacao">Em Fabricação</SelectItem>
                  <SelectItem value="aguardando_peca_cliente">Aguardando Peça (Cliente)</SelectItem>
                  <SelectItem value="aguardando_peca_interno">Aguardando Peça (Interno)</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <p>Carregando dados...</p>
              </div>
            ) : (
              <>
                <RelatorioResumoCards {...calcularDadosResumo()} />
                <RelatorioGraficos {...prepararDadosGraficos()} COLORS={COLORS} />
              </>
            )}
          </TabsContent>
          
          <TabsContent value="ordens" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                  <SelectItem value="todos">Todos os tempos</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                  <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                  <SelectItem value="fabricacao">Em Fabricação</SelectItem>
                  <SelectItem value="aguardando_peca_cliente">Aguardando Peça (Cliente)</SelectItem>
                  <SelectItem value="aguardando_peca_interno">Aguardando Peça (Interno)</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <p>Carregando dados...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrdens.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-muted-foreground">
                    Nenhuma ordem de serviço encontrada.
                  </div>
                ) : (
                  filteredOrdens.map(ordem => {
                    const analise = analisarOrdemServico(ordem);
                    
                    if (!analise) return null;
                    
                    const atrasos = verificarAtrasos(ordem);
                    const etapasParadas = verificarEtapasParadas(ordem);
                    const pessoasTrabalhando = contarPessoasTrabalhando(ordem);
                    
                    return (
                      <Card
                        key={ordem.id}
                        className="cursor-pointer hover:bg-accent/50 transition-all duration-200"
                        onClick={() => handleSelectOrdem(ordem)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg font-medium mb-1">
                                {ordem.identificacao || `OS #${ordem.id?.slice(-6)}`}
                              </CardTitle>
                              <CardDescription>
                                {ordem.cliente?.nome || "Cliente não identificado"}
                              </CardDescription>
                            </div>
                            <Badge 
                              variant={ordem.status === "finalizado" || ordem.status === "entregue" ? "default" : "outline"}
                              className={ordem.status === "fabricacao" ? "bg-orange-500 hover:bg-orange-500" : undefined}
                            >
                              {getStatusLabel(ordem.status)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Criação:</span>
                                <p>{ordem.dataCriacao ? formatarData(ordem.dataCriacao) : "N/A"}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Previsão:</span>
                                <p>{ordem.dataPrevistaEntrega ? formatarData(ordem.dataPrevistaEntrega) : "N/A"}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">Progresso</span>
                                <span className="text-sm">{analise.percentualConclusao}%</span>
                              </div>
                              <Progress value={analise.percentualConclusao} />
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {atrasos.length > 0 && (
                                <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Atrasos
                                </Badge>
                              )}
                              
                              {etapasParadas.length > 0 && (
                                <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
                                  <HourglassIcon className="h-3 w-3 mr-1" />
                                  Etapas paradas
                                </Badge>
                              )}
                              
                              {pessoasTrabalhando > 0 && (
                                <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">
                                  <Users className="h-3 w-3 mr-1" />
                                  {pessoasTrabalhando} trabalhando
                                </Badge>
                              )}
                              
                              {analise.dentroDoPrazo ? (
                                <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  No prazo
                                </Badge>
                              ) : (
                                ordem.status !== "finalizado" && ordem.status !== "entregue" && (
                                  <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Fora do prazo
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="detalhes" className="space-y-4 mt-4">
            {selectedOrdem ? (
              <OSDetalhesSection 
                ordemSelecionada={selectedOrdem} 
                atrasos={verificarAtrasos(selectedOrdem)} 
                etapasParadas={verificarEtapasParadas(selectedOrdem)}
                pessoasTrabalhando={contarPessoasTrabalhando(selectedOrdem)}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Ordem de Serviço</CardTitle>
                  <CardDescription>
                    Pesquise uma ordem no campo acima ou selecione uma ordem na aba "Ordens" para visualizar os detalhes completos
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                  <div className="text-center">
                    <FileBarChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p>Nenhuma ordem selecionada</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => document.querySelector('[data-value="ordens"]')?.dispatchEvent(new MouseEvent('click'))}
                    >
                      Ver lista de ordens
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RelatoriosProducao;
