
import {
  FileText,
  Clock,
  Users,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import MetricCard from "@/components/dashboard/MetricCard";
import StatusChart from "@/components/dashboard/StatusChart";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { toast } from "sonner";
import { Funcionario } from "@/types/funcionarios";

interface DashboardProps extends LogoutProps {}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcionariosOcupados, setFuncionariosOcupados] = useState<number>(0);
  const [metricas, setMetricas] = useState({
    osTotal: 0,
    osPendentes: 0,
    osFinalizadasMes: 0,
  });
  const [statusData, setStatusData] = useState<{ name: string; total: number }[]>([]);
  const [servicosData, setServicosData] = useState<{ name: string; total: number }[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Buscar ordens
        const q = query(collection(db, "ordens_servico"), orderBy("dataAbertura", "desc"));
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
        
        // Buscar funcionários
        const funcionariosSnapshot = await getDocs(collection(db, "funcionarios"));
        const funcionariosData: Funcionario[] = [];
        funcionariosSnapshot.forEach((doc) => {
          funcionariosData.push({
            ...doc.data(),
            id: doc.id
          } as Funcionario);
        });
        
        setFuncionarios(funcionariosData);
        
        // Calcular funcionários ocupados
        const funcionariosAlocados = new Set<string>();
        ordensData.forEach(ordem => {
          // Verificar funcionários alocados em serviços
          ordem.servicos?.forEach(servico => {
            if (servico.funcionarioId) {
              funcionariosAlocados.add(servico.funcionarioId);
            }
          });
          
          // Verificar funcionários alocados em etapas
          if (ordem.etapasAndamento) {
            Object.values(ordem.etapasAndamento).forEach(etapa => {
              if (etapa.funcionarioId) {
                funcionariosAlocados.add(etapa.funcionarioId);
              }
            });
          }
        });
        
        setFuncionariosOcupados(funcionariosAlocados.size);
        
        calcularMetricas(ordensData);
        calcularDadosGraficos(ordensData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast.error("Erro ao carregar dados do dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const calcularMetricas = (ordensData: OrdemServico[]) => {
    const total = ordensData.length;
    
    const pendentes = ordensData.filter(
      ordem => !['finalizado', 'entregue'].includes(ordem.status)
    ).length;
    
    // Calcular OSs finalizadas no mês atual
    const dataAtual = new Date();
    const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
    const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
    
    const finalizadasMes = ordensData.filter(ordem => {
      if (ordem.status === 'finalizado' || ordem.status === 'entregue') {
        // Verificar se a OS foi finalizada neste mês
        const dataFinalizada = ordem.etapasAndamento?.inspecao_final?.finalizado;
        if (dataFinalizada) {
          const dataConclusao = dataFinalizada instanceof Date ? 
            dataFinalizada : new Date(dataFinalizada);
          return dataConclusao >= primeiroDiaMes && dataConclusao <= ultimoDiaMes;
        }
      }
      return false;
    }).length;
    
    setMetricas({
      osTotal: total,
      osPendentes: pendentes,
      osFinalizadasMes: finalizadasMes,
    });
  };
  
  const calcularDadosGraficos = (ordensData: OrdemServico[]) => {
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
      .filter(([_, total]) => total > 0)
      .map(([name, total]) => ({ name, total }));
    
    setServicosData(servicosChartData);
  };
  
  const handleViewDetails = (osId: string) => {
    navigate(`/ordens/${osId}`);
  };
  
  const handleVerFuncionarios = () => {
    navigate('/funcionarios');
  };
  
  const osRecentes = ordens.slice(0, 5);
  const funcionariosDisponiveis = funcionarios.length - funcionariosOcupados;
  
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
                className="animate-slide-in"
              />
              
              <MetricCard
                title="OSs Pendentes"
                value={metricas.osPendentes}
                icon={<Clock />}
                className="animate-slide-in [animation-delay:100ms]"
              />
              
              <MetricCard
                title="Finalizadas no Mês"
                value={metricas.osFinalizadasMes}
                icon={<CheckCircle />}
                className="animate-slide-in [animation-delay:200ms]"
              />
              
              <MetricCard
                title="Funcionários"
                value={`${funcionariosOcupados}/${funcionarios.length}`}
                description={funcionariosDisponiveis > 0 ? `${funcionariosDisponiveis} disponíveis` : "Todos ocupados"}
                icon={<Users />}
                className="animate-slide-in [animation-delay:300ms] cursor-pointer hover:bg-muted/30"
                onClick={handleVerFuncionarios}
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Ordens de Serviço Recentes</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/ordens')}
                  >
                    Ver todas
                  </Button>
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
