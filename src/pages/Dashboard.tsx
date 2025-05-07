
import {
  FileText,
  Clock,
  Users,
  CheckCircle,
  TrendingUp,
  Calendar,
  Filter,
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
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { toast } from "sonner";
import { Funcionario } from "@/types/funcionarios";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFuncionariosDisponibilidade } from "@/hooks/useFuncionariosDisponibilidade";

interface DashboardProps extends LogoutProps {}

// Interface para filtros de data
interface DateFilter {
  startDate: Date;
  endDate: Date;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  
  // Utilizamos o hook useFuncionariosDisponibilidade para ter acesso aos dados em tempo real
  const { funcionariosDisponiveis, funcionariosOcupados, loading: loadingFuncionarios } = useFuncionariosDisponibilidade();
  
  const [metricas, setMetricas] = useState({
    osTotal: 0,
    osPendentes: 0,
    osFinalizadasMes: 0,
  });
  const [statusData, setStatusData] = useState<{ name: string; total: number }[]>([]);
  const [servicosData, setServicosData] = useState<{ name: string; total: number }[]>([]);
  
  // Estados para gerenciar filtros de data
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  // Filtros para cada card
  const [osFinalizadasFilter, setOsFinalizadasFilter] = useState<DateFilter>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  
  // Funções para navegação de meses
  const handlePreviousMonth = () => {
    const previousMonth = subMonths(dateFilter.startDate, 1);
    setDateFilter({
      startDate: startOfMonth(previousMonth),
      endDate: endOfMonth(previousMonth)
    });
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(dateFilter.startDate, 1);
    setDateFilter({
      startDate: startOfMonth(nextMonth),
      endDate: endOfMonth(nextMonth)
    });
  };

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
  
  // Reprocessar métricas quando filtros de data mudarem
  useEffect(() => {
    if (ordens.length > 0) {
      calcularMetricas(ordens);
    }
  }, [dateFilter, osFinalizadasFilter, ordens]);
  
  const calcularMetricas = (ordensData: OrdemServico[]) => {
    const total = ordensData.length;
    
    const pendentes = ordensData.filter(
      ordem => !['finalizado', 'entregue'].includes(ordem.status)
    ).length;
    
    // Calcular OSs finalizadas no período selecionado
    const finalizadasNoPeriodo = ordensData.filter(ordem => {
      if (ordem.status === 'finalizado' || ordem.status === 'entregue') {
        // Verificar se a OS foi finalizada no período escolhido
        if (ordem.etapasAndamento?.inspecao_final?.finalizado) {
          let dataFinalizacao;
          
          if (ordem.etapasAndamento.inspecao_final.finalizado instanceof Date) {
            dataFinalizacao = ordem.etapasAndamento.inspecao_final.finalizado;
          } else if (ordem.etapasAndamento.inspecao_final.finalizado) {
            dataFinalizacao = new Date(ordem.etapasAndamento.inspecao_final.finalizado);
          }
          
          if (dataFinalizacao && isWithinInterval(dataFinalizacao, {
            start: osFinalizadasFilter.startDate,
            end: osFinalizadasFilter.endDate
          })) {
            return true;
          }
        }
      }
      return false;
    }).length;
    
    setMetricas({
      osTotal: total,
      osPendentes: pendentes,
      osFinalizadasMes: finalizadasNoPeriodo,
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
    
    // Filtrar ordens para o período selecionado
    const ordensFiltradas = ordensData.filter(ordem => {
      if (!ordem.dataAbertura) return false;
      
      const dataAbertura = ordem.dataAbertura instanceof Date ? 
        ordem.dataAbertura : new Date(ordem.dataAbertura);
      
      return isWithinInterval(dataAbertura, {
        start: dateFilter.startDate,
        end: dateFilter.endDate
      });
    });
    
    ordensFiltradas.forEach(ordem => {
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
    
    ordensFiltradas.forEach(ordem => {
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
          
          {/* Filtro global de período */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreviousMonth}>
              Mês anterior
            </Button>
            <Popover open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  {format(dateFilter.startDate, 'MMM yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dateFilter.startDate}
                  onSelect={(date) => {
                    if (date) {
                      setDateFilter({
                        startDate: startOfMonth(date),
                        endDate: endOfMonth(date)
                      });
                      setIsDateFilterOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handleNextMonth}>
              Próximo mês
            </Button>
          </div>
        </div>
        
        {isLoading || loadingFuncionarios ? (
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
              
              {/* Card de OSs finalizadas com filtro de período */}
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute top-2 right-2 z-10 h-8 w-8"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-3 w-auto">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Filtrar por período</h4>
                      <CalendarComponent
                        mode="single"
                        selected={osFinalizadasFilter.startDate}
                        onSelect={(date) => {
                          if (date) {
                            setOsFinalizadasFilter({
                              startDate: startOfMonth(date),
                              endDate: endOfMonth(date)
                            });
                          }
                        }}
                        initialFocus
                      />
                      <div className="text-xs text-center text-muted-foreground">
                        {format(osFinalizadasFilter.startDate, 'MMMM yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <MetricCard
                  title="Finalizadas no Período"
                  value={metricas.osFinalizadasMes}
                  description={`${format(osFinalizadasFilter.startDate, 'MMM yyyy', { locale: ptBR })}`}
                  icon={<CheckCircle />}
                  className="animate-slide-in [animation-delay:200ms]"
                />
              </div>
              
              <MetricCard
                title="Funcionários"
                value={`${funcionariosOcupados.length}/${funcionariosDisponiveis.length + funcionariosOcupados.length}`}
                description={funcionariosDisponiveis.length > 0 ? `${funcionariosDisponiveis.length} disponíveis` : "Todos ocupados"}
                icon={<Users />}
                className="animate-slide-in [animation-delay:300ms] cursor-pointer hover:bg-muted/30"
                onClick={handleVerFuncionarios}
              />
            </div>
            
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
              <StatusChart
                title="Ordens de Serviço por Status"
                description={`Distribuição de OSs por status (${format(dateFilter.startDate, 'MMM yyyy', { locale: ptBR })})`}
                data={statusData}
                className="animate-scale-in"
              />
              
              <StatusChart
                title="Serviços Realizados"
                description={`Distribuição por tipo de serviço (${format(dateFilter.startDate, 'MMM yyyy', { locale: ptBR })})`}
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
