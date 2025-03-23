import {
  FileText,
  Clock,
  Users,
  CheckCircle,
  TrendingUp,
  BarChart
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import MetricCard from "@/components/dashboard/MetricCard";
import StatusChart from "@/components/dashboard/StatusChart";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Dados de exemplo para métricas
  const metricas = {
    osTotal: 126,
    osPendentes: 42,
    tempoOperacao: "128h 45m",
    tempoPausa: "18h 20m",
    eficiencia: 87.5,
  };
  
  // Dados de exemplo para o gráfico de status
  const statusData = [
    { name: "Em Orçamento", total: 14 },
    { name: "Aguardando Aprovação", total: 8 },
    { name: "Em Fabricação", total: 16 },
    { name: "Em Espera", total: 4 },
    { name: "Finalizado", total: 10 },
    { name: "Entregue", total: 78 },
  ];
  
  // Dados de exemplo para o gráfico de serviços
  const servicosData = [
    { name: "Bloco", total: 48 },
    { name: "Biela", total: 32 },
    { name: "Cabeçote", total: 62 },
    { name: "Virabrequim", total: 41 },
    { name: "Eixo de Comando", total: 18 },
  ];
  
  // Dados de exemplo para OSs por prioridade
  const osRecentes = [
    {
      id: "OS-2023-089",
      nome: "Motor Ford Ka 2019",
      cliente: "Auto Peças Silva",
      status: "fabricacao" as const,
      prioridade: "alta" as const,
    },
    {
      id: "OS-2023-088",
      nome: "Cabeçote Fiat Uno",
      cliente: "Oficina Mecânica Central",
      status: "orcamento" as const,
      prioridade: "media" as const,
    },
    {
      id: "OS-2023-087",
      nome: "Virabrequim Caminhão Scania",
      cliente: "Transportadora Rodovia",
      status: "aguardando_aprovacao" as const,
      prioridade: "urgente" as const,
    },
    {
      id: "OS-2023-086",
      nome: "Eixo de Comando Golf GTI",
      cliente: "Concessionária Motors",
      status: "finalizado" as const,
      prioridade: "media" as const,
    },
    {
      id: "OS-2023-085",
      nome: "Bielas Honda Civic",
      cliente: "Autoelétrica Express",
      status: "entregue" as const,
      prioridade: "baixa" as const,
    }
  ];
  
  const handleViewDetails = (osId: string) => {
    navigate(`/ordens/${osId}`);
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
