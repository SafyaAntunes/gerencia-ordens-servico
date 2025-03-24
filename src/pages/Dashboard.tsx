import { PlusCircle, Clock, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import MetricCard from "@/components/dashboard/MetricCard";
import StatusChart from "@/components/dashboard/StatusChart";
import { useEffect, useState } from "react";
import { OrdemServico } from "@/types/ordens";
import { countOrdensByStatus, countOrdensByPriority, loadOrdens } from "@/utils/storageUtils";

interface DashboardProps {
  onLogout?: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const [ordensRecentes, setOrdensRecentes] = useState<OrdemServico[]>([]);
  const [ordensUrgentes, setOrdensUrgentes] = useState<OrdemServico[]>([]);
  const [totalOrdensAndamento, setTotalOrdensAndamento] = useState(0);
  const [totalOrdensFinalizadas, setTotalOrdensFinalizadas] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [priorityCounts, setPriorityCounts] = useState<Record<string, number>>({});
  
  useEffect(() => {
    // Carregar dados para o dashboard
    const ordens = loadOrdens();
    
    // Ordens recentes (últimas 5)
    const recentOrdens = [...ordens].sort((a, b) => {
      return new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime();
    }).slice(0, 5);
    
    // Ordens urgentes
    const urgentOrdens = ordens.filter(o => o.prioridade === 'urgente' || o.prioridade === 'alta')
      .filter(o => o.status !== 'finalizado' && o.status !== 'entregue')
      .slice(0, 5);
    
    // Contagens de status e prioridades
    const statusCount = countOrdensByStatus();
    const priorityCount = countOrdensByPriority();
    
    // Total de ordens em andamento e finalizadas
    const andamento = ordens.filter(o => o.status !== 'finalizado' && o.status !== 'entregue').length;
    const finalizadas = ordens.filter(o => o.status === 'finalizado' || o.status === 'entregue').length;
    
    setOrdensRecentes(recentOrdens);
    setOrdensUrgentes(urgentOrdens);
    setStatusCounts(statusCount);
    setPriorityCounts(priorityCount);
    setTotalOrdensAndamento(andamento);
    setTotalOrdensFinalizadas(finalizadas);
  }, []);
  
  const handleNavigateToOrdem = (id: string) => {
    navigate(`/ordens/${id}`);
  };
  
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
                              <td className="p-4 font-medium">{os.id}</td>
                              <td className="p-4">{os.nome}</td>
                              <td className="p-4">{os.cliente}</td>
                              <td className="p-4">
                                <StatusBadge status={os.status} size="sm" />
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
                </TabsContent>
                
                <TabsContent value="pendentes">
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
                            .filter(os => ['orcamento', 'aguardando_aprovacao', 'fabricacao', 'espera_cliente'].includes(os.status))
                            .map((os) => (
                              <tr key={os.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 font-medium">{os.id}</td>
                                <td className="p-4">{os.nome}</td>
                                <td className="p-4">{os.cliente}</td>
                                <td className="p-4">
                                  <StatusBadge status={os.status} size="sm" />
                                </td>
                                <td className="p-4">
                                  <StatusBadge status={os.prioridade} size="sm" />
                                </td>
                                <td className="p-4 text-right">
                                  <Button variant="ghost" size="sm">
                                    Detalhes
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="finalizadas">
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
                                <td className="p-4 font-medium">{os.id}</td>
                                <td className="p-4">{os.nome}</td>
                                <td className="p-4">{os.cliente}</td>
                                <td className="p-4">
                                  <StatusBadge status={os.status} size="sm" />
                                </td>
                                <td className="p-4">
                                  <StatusBadge status={os.prioridade} size="sm" />
                                </td>
                                <td className="p-4 text-right">
                                  <Button variant="ghost" size="sm">
                                    Detalhes
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
