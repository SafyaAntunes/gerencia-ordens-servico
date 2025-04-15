import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, ActivitySquare, BarChart, Wrench, Clock } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS } from "@/types/ordens";
import OrdemSearch from "@/components/ordens/OrdemSearch";
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
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RelatoriosProducaoProps extends LogoutProps {}

const RelatoriosProducao = ({ onLogout }: RelatoriosProducaoProps) => {
  const [ordensDados, setOrdensDados] = useState<OrdemServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemServico | null>(null);
  const [activeTab, setActiveTab] = useState<"geral" | "detalhes">("geral");
  
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
      } catch (error) {
        console.error("Erro ao buscar ordens:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrdens();
  }, []);
  
  const handleOrdemSearch = (ordem: OrdemServico | null) => {
    setSelectedOrdem(ordem);
    if (ordem) {
      setActiveTab("detalhes");
    }
  };
  
  const getTemposExecucaoOS = () => {
    if (!selectedOrdem) return [];
    
    const etapas: {
      etapa: string;
      tempoTotal: number;
      tempoFormatado: string;
      funcionario: string;
      status: string;
      iniciado?: string;
      finalizado?: string;
    }[] = [];
    
    Object.entries(selectedOrdem.etapasAndamento || {}).forEach(([etapaKey, info]) => {
      let tempoTotal = 0;
      
      selectedOrdem.tempoRegistros?.forEach(reg => {
        if (reg.etapa === etapaKey && reg.inicio && reg.fim) {
          const duracao = new Date(reg.fim).getTime() - new Date(reg.inicio).getTime();
          tempoTotal += duracao;
        }
      });
      
      const storageKey = `timer_${selectedOrdem.id}_${etapaKey}`;
      const data = localStorage.getItem(storageKey);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.totalTime) {
            tempoTotal += parsed.totalTime;
          }
        } catch {
          // Ignorar erro de parsing
        }
      }
      
      etapas.push({
        etapa: formatarEtapa(etapaKey as EtapaOS),
        tempoTotal,
        tempoFormatado: formatarTempo(tempoTotal),
        funcionario: info.funcionarioNome || "Não atribuído",
        status: info.concluido ? "Concluído" : (info.iniciado ? "Em andamento" : "Não iniciado"),
        iniciado: info.iniciado ? format(new Date(info.iniciado), "dd/MM/yyyy HH:mm", { locale: ptBR }) : undefined,
        finalizado: info.finalizado ? format(new Date(info.finalizado), "dd/MM/yyyy HH:mm", { locale: ptBR }) : undefined
      });
    });
    
    selectedOrdem.servicos.forEach(servico => {
      let tempoTotal = 0;
      
      const storageKey = `timer_${selectedOrdem.id}_retifica_${servico.tipo}`;
      const data = localStorage.getItem(storageKey);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.totalTime) {
            tempoTotal += parsed.totalTime;
          }
        } catch {
          // Ignorar erro de parsing
        }
      }
      
      etapas.push({
        etapa: `Serviço: ${formatarEtapa(servico.tipo)}`,
        tempoTotal,
        tempoFormatado: formatarTempo(tempoTotal),
        funcionario: servico.funcionarioNome || "Não atribuído",
        status: servico.concluido ? "Concluído" : "Em andamento",
        iniciado: undefined,
        finalizado: servico.dataConclusao ? format(new Date(servico.dataConclusao), "dd/MM/yyyy HH:mm", { locale: ptBR }) : undefined
      });
    });
    
    return etapas;
  };
  
  const formatarEtapa = (etapaKey: string): string => {
    const labels: Record<string, string> = {
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      retifica: "Retífica",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_final: "Inspeção Final",
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      fabricacao: "Fabricação"
    };
    return labels[etapaKey] || etapaKey;
  };
  
  const formatarTempo = (ms: number) => {
    const segundos = Math.floor((ms / 1000) % 60);
    const minutos = Math.floor((ms / (1000 * 60)) % 60);
    const horas = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    return dias > 0 
      ? `${dias}d ${horas}h ${minutos}m ${segundos}s`
      : `${horas}h ${minutos}m ${segundos}s`;
  };
  
  const calcularTempoTotalOS = () => {
    if (!selectedOrdem) return 0;
    
    const tempos = getTemposExecucaoOS();
    return tempos.reduce((total, item) => total + item.tempoTotal, 0);
  };
  
  const tempoTotal = calcularTempoTotalOS();
  
  const totalOrdens = ordensPorStatus?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
  const totalOrdensFinalizadas = ordensPorStatus?.find(item => item.nome === "Finalizado")?.quantidade || 0;
  const totalOrdensEntregues = ordensPorStatus?.find(item => item.nome === "Entregue")?.quantidade || 0;
  const taxaFinalizacao = ((totalOrdensFinalizadas + totalOrdensEntregues) / (totalOrdens || 1)) * 100;
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
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
        
        <OrdemSearch 
          ordens={ordensDados} 
          onSearch={handleOrdemSearch} 
          placeholder="Buscar OS por ID ou nome para ver detalhes de tempo..."
        />
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "geral" | "detalhes")}>
          <TabsList className="mb-6">
            <TabsTrigger value="geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="detalhes" disabled={!selectedOrdem}>Detalhes de Execução</TabsTrigger>
          </TabsList>
          
          <TabsContent value="geral">
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
          </TabsContent>
          
          <TabsContent value="detalhes">
            {selectedOrdem ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Detalhes de Execução - OS #{selectedOrdem.id.slice(-5)}
                    </CardTitle>
                    <CardDescription>
                      {selectedOrdem.nome} - Cliente: {selectedOrdem.cliente.nome}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-muted-foreground">Data de Abertura</p>
                        <p className="text-xl font-bold">
                          {format(new Date(selectedOrdem.dataAbertura), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-muted-foreground">Previsão de Entrega</p>
                        <p className="text-xl font-bold">
                          {format(new Date(selectedOrdem.dataPrevistaEntrega), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-muted-foreground">Tempo Total de Execução</p>
                        <p className="text-xl font-bold">
                          {formatarTempo(tempoTotal)}
                        </p>
                      </div>
                    </div>
                    
                    <Table>
                      <TableCaption>Detalhamento de tempos de execução por etapa e serviço</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Etapa/Serviço</TableHead>
                          <TableHead>Funcionário</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tempo de Execução</TableHead>
                          <TableHead>Iniciado em</TableHead>
                          <TableHead>Finalizado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getTemposExecucaoOS().map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.etapa}</TableCell>
                            <TableCell>{item.funcionario}</TableCell>
                            <TableCell>
                              <span 
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === "Concluído" 
                                    ? "bg-green-100 text-green-800" 
                                    : item.status === "Em andamento" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {item.status}
                              </span>
                            </TableCell>
                            <TableCell>{item.tempoFormatado}</TableCell>
                            <TableCell>{item.iniciado || "-"}</TableCell>
                            <TableCell>{item.finalizado || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <FileBarChart className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Busque uma OS específica para ver os detalhes de execução
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RelatoriosProducao;
