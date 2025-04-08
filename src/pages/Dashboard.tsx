
import {
  FileText,
  Clock,
  Users,
  CheckCircle,
  TrendingUp,
  BarChart
} from "lucide-react";
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import MetricCard from "@/components/dashboard/MetricCard";
import StatusChart from "@/components/dashboard/StatusChart";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { toast } from "sonner";

interface DashboardProps extends LogoutProps {}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [metricas, setMetricas] = useState({
    osTotal: 0,
    osPendentes: 0,
    tempoOperacao: "0h 0m",
    tempoPausa: "0h 0m",
    eficiencia: 0,
  });
  const [statusData, setStatusData] = useState<{ name: string; total: number }[]>([]);
  const [servicosData, setServicosData] = useState<{ name: string; total: number }[]>([]);
  
  useEffect(() => {
    const fetchOrdens = async () => {
      setIsLoading(true);
      try {
        // Buscar todas as ordens ordenadas por data de abertura
        const q = query(collection(db, "ordens"), orderBy("dataAbertura", "desc"));
        const querySnapshot = await getDocs(q);
        
        const ordensData: OrdemServico[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          ordensData.push({
            ...data,
            id: doc.id,
            dataAbertura: data.dataAbertura?.toDate() || new Date(),
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
          } as OrdemServico);
        });
        
        setOrdens(ordensData);
        
        // Calcular métricas
        calcularMetricas(ordensData);
        
        // Calcular dados para os gráficos
        calcularDadosGraficos(ordensData);
        
      } catch (error) {
        console.error("Erro ao buscar ordens:", error);
        toast.error("Erro ao carregar dados do dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrdens();
  }, []);
  
  const calcularMetricas = (ordensData: OrdemServico[]) => {
    // Total de OSs
    const total = ordensData.length;
    
    // OSs pendentes (não finalizadas ou entregues)
    const pendentes = ordensData.filter(
      ordem => !['finalizado', 'entregue'].includes(ordem.status)
    ).length;
    
    // Calcular tempo de operação total
    let tempoTotalMs = 0;
    let tempoPausaMs = 0;
    
    ordensData.forEach(ordem => {
      if (ordem.tempoRegistros) {
        ordem.tempoRegistros.forEach(registro => {
          const inicio = registro.inicio instanceof Date ? registro.inicio : new Date(registro.inicio);
          const fim = registro.fim instanceof Date ? registro.fim : (registro.fim ? new Date(registro.fim) : new Date());
          
          const duracaoMs = fim.getTime() - inicio.getTime();
          tempoTotalMs += duracaoMs;
          
          // Somar tempo de pausas
          if (registro.pausas && registro.pausas.length > 0) {
            registro.pausas.forEach(pausa => {
              const pausaInicio = pausa.inicio instanceof Date ? pausa.inicio : new Date(pausa.inicio);
              const pausaFim = pausa.fim instanceof Date ? 
                pausa.fim : (pausa.fim ? new Date(pausa.fim) : new Date());
              
              tempoPausaMs += pausaFim.getTime() - pausaInicio.getTime();
            });
          }
        });
      }
    });
    
    // Converter para formato de horas
    const tempoOperacaoHoras = Math.floor(tempoTotalMs / (1000 * 60 * 60));
    const tempoOperacaoMinutos = Math.floor((tempoTotalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const tempoPausaHoras = Math.floor(tempoPausaMs / (1000 * 60 * 60));
    const tempoPausaMinutos = Math.floor((tempoPausaMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Calcular eficiência (tempo operacional / tempo total)
    const tempoOperacional = tempoTotalMs - tempoPausaMs;
    const eficiencia = tempoTotalMs > 0 ? Math.round((tempoOperacional / tempoTotalMs) * 100) : 0;
    
    setMetricas({
      osTotal: total,
      osPendentes: pendentes,
      tempoOperacao: `${tempoOperacaoHoras}h ${tempoOperacaoMinutos}m`,
      tempoPausa: `${tempoPausaHoras}h ${tempoPausaMinutos}m`,
      eficiencia: eficiencia,
    });
  };
  
  const calcularDadosGraficos = (ordensData: OrdemServico[]) => {
    // Dados para o gráfico de status
    const statusCounts: Record<string, number> = {
      "Em Orçamento": 0,
      "Aguardando Aprovação": 0,
      "Em Fabricação": 0,
      "Em Espera": 0,
      "Finalizado": 0,
      "Entregue": 0,
    };
    
    ordensData.forEach(ordem => {
      switch(ordem.status) {
        case 'orcamento':
          statusCounts["Em Orçamento"]++;
          break;
        case 'aguardando_aprovacao':
          statusCounts["Aguardando Aprovação"]++;
          break;
        case 'fabricacao':
          statusCounts["Em Fabricação"]++;
          break;
        case 'aguardando_peca_cliente':
        case 'aguardando_peca_interno':
          statusCounts["Em Espera"]++;
          break;
        case 'finalizado':
          statusCounts["Finalizado"]++;
          break;
        case 'entregue':
          statusCounts["Entregue"]++;
          break;
      }
    });
    
    const statusChartData = Object.entries(statusCounts).map(([name, total]) => ({ name, total }));
    setStatusData(statusChartData);
    
    // Dados para o gráfico de tipos de serviços
    const servicosCounts: Record<string, number> = {
      "Bloco": 0,
      "Biela": 0,
      "Cabeçote": 0,
      "Virabrequim": 0,
      "Eixo de Comando": 0,
      "Montagem": 0,
      "Dinamômetro": 0,
    };
    
    ordensData.forEach(ordem => {
      if (ordem.servicos) {
        ordem.servicos.forEach(servico => {
          switch(servico.tipo) {
            case 'bloco':
              servicosCounts["Bloco"]++;
              break;
            case 'biela':
              servicosCounts["Biela"]++;
              break;
            case 'cabecote':
              servicosCounts["Cabeçote"]++;
              break;
            case 'virabrequim':
              servicosCounts["Virabrequim"]++;
              break;
            case 'eixo_comando':
              servicosCounts["Eixo de Comando"]++;
              break;
            case 'montagem':
              servicosCounts["Montagem"]++;
              break;
            case 'dinamometro':
              servicosCounts["Dinamômetro"]++;
              break;
          }
        });
      }
    });
    
    const servicosChartData = Object.entries(servicosCounts)
      .filter(([_, total]) => total > 0) // Apenas mostrar serviços que existem
      .map(([name, total]) => ({ name, total }));
    
    setServicosData(servicosChartData);
  };
  
  const handleViewDetails = (osId: string) => {
    navigate(`/ordens/${osId}`);
  };
  
  // Obter as 5 ordens mais recentes para exibir na tabela
  const osRecentes = ordens.slice(0, 5);
  
  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Acompanhe as métricas e estatísticas do seu negócio
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
            
            <Button onClick={() => navigate("/ordens/nova")}>
              <FileText className="mr-2 h-4 w-4" />
              Nova OS
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">Carregando dados...</div>
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total de OSs"
                value={metricas.osTotal}
                icon={<FileText />}
                description="Ordens de serviço cadastradas"
                trend={{ value: 12, isPositive: true }}
                className="animate-slide-in"
              />
              
              <MetricCard
                title="OSs Pendentes"
                value={metricas.osPendentes}
                icon={<Clock />}
                description="Aguardando conclusão"
                trend={{ value: 5, isPositive: false }}
                className="animate-slide-in [animation-delay:100ms]"
              />
              
              <MetricCard
                title="Tempo de Operação"
                value={metricas.tempoOperacao}
                icon={<TrendingUp />}
                description="Total de horas trabalhadas"
                trend={{ value: 8, isPositive: true }}
                className="animate-slide-in [animation-delay:200ms]"
              />
              
              <MetricCard
                title="Eficiência"
                value={`${metricas.eficiencia}%`}
                icon={<CheckCircle />}
                description={`Tempo operacional: ${metricas.tempoPausa} em pausa`}
                trend={{ value: 3, isPositive: true }}
                className="animate-slide-in [animation-delay:300ms]"
              />
            </div>
            
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
              <StatusChart
                title="Ordens de Serviço por Status"
                description="Distribuição de OSs por status atual"
                data={statusData}
                className="animate-scale-in"
              />
              
              <StatusChart
                title="Serviços Realizados"
                description="Distribuição por tipo de serviço"
                data={servicosData}
                className="animate-scale-in [animation-delay:150ms]"
              />
            </div>
            
            <div className="mt-6">
              <Card className="animate-scale-in [animation-delay:300ms]">
                <CardHeader>
                  <CardTitle>Ordens de Serviço Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="todas">
                    <TabsList className="mb-4">
                      <TabsTrigger value="todas">Todas</TabsTrigger>
                      <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                      <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="todas">
                      {osRecentes.length > 0 ? (
                        <div className="rounded-md border">
                          <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="h-12 px-4 text-left font-medium">Código</th>
                                  <th className="h-12 px-4 text-left font-medium">Nome</th>
                                  <th className="h-12 px-4 text-left font-medium">Cliente</th>
                                  <th className="h-12 px-4 text-left font-medium">Status</th>
                                  <th className="h-12 px-4 text-left font-medium">Prioridade</th>
                                  <th className="h-12 px-4 text-left font-medium"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {osRecentes.map((os) => (
                                  <tr key={os.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 font-medium">{os.id.slice(-5)}</td>
                                    <td className="p-4">{os.nome}</td>
                                    <td className="p-4">{os.cliente?.nome}</td>
                                    <td className="p-4">
                                      <StatusBadge status={os.status as StatusOS} size="sm" />
                                    </td>
                                    <td className="p-4">
                                      <StatusBadge status={os.prioridade} size="sm" />
                                    </td>
                                    <td className="p-4 text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleViewDetails(os.id)}
                                      >
                                        Detalhes
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhuma ordem de serviço encontrada
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="pendentes">
                      {osRecentes.filter(os => ['orcamento', 'aguardando_aprovacao', 'retifica'].includes(os.status)).length > 0 ? (
                        <div className="rounded-md border">
                          <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="h-12 px-4 text-left font-medium">Código</th>
                                  <th className="h-12 px-4 text-left font-medium">Nome</th>
                                  <th className="h-12 px-4 text-left font-medium">Cliente</th>
                                  <th className="h-12 px-4 text-left font-medium">Status</th>
                                  <th className="h-12 px-4 text-left font-medium">Prioridade</th>
                                  <th className="h-12 px-4 text-left font-medium"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {osRecentes
                                  .filter(os => ['orcamento', 'aguardando_aprovacao', 'retifica'].includes(os.status))
                                  .map((os) => (
                                    <tr key={os.id} className="border-b transition-colors hover:bg-muted/50">
                                      <td className="p-4 font-medium">{os.id.slice(-5)}</td>
                                      <td className="p-4">{os.nome}</td>
                                      <td className="p-4">{os.cliente?.nome}</td>
                                      <td className="p-4">
                                        <StatusBadge status={os.status as StatusOS} size="sm" />
                                      </td>
                                      <td className="p-4">
                                        <StatusBadge status={os.prioridade} size="sm" />
                                      </td>
                                      <td className="p-4 text-right">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleViewDetails(os.id)}
                                        >
                                          Detalhes
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhuma ordem pendente encontrada
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="finalizadas">
                      {osRecentes.filter(os => ['finalizado', 'entregue'].includes(os.status)).length > 0 ? (
                        <div className="rounded-md border">
                          <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="h-12 px-4 text-left font-medium">Código</th>
                                  <th className="h-12 px-4 text-left font-medium">Nome</th>
                                  <th className="h-12 px-4 text-left font-medium">Cliente</th>
                                  <th className="h-12 px-4 text-left font-medium">Status</th>
                                  <th className="h-12 px-4 text-left font-medium">Prioridade</th>
                                  <th className="h-12 px-4 text-left font-medium"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {osRecentes
                                  .filter(os => ['finalizado', 'entregue'].includes(os.status))
                                  .map((os) => (
                                    <tr key={os.id} className="border-b transition-colors hover:bg-muted/50">
                                      <td className="p-4 font-medium">{os.id.slice(-5)}</td>
                                      <td className="p-4">{os.nome}</td>
                                      <td className="p-4">{os.cliente?.nome}</td>
                                      <td className="p-4">
                                        <StatusBadge status={os.status as StatusOS} size="sm" />
                                      </td>
                                      <td className="p-4">
                                        <StatusBadge status={os.prioridade} size="sm" />
                                      </td>
                                      <td className="p-4 text-right">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleViewDetails(os.id)}
                                        >
                                          Detalhes
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhuma ordem finalizada encontrada
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
