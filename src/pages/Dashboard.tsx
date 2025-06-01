
import React from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MetricCard from "@/components/dashboard/MetricCard";
import StatusChart from "@/components/dashboard/StatusChart";
import { useDashboardData } from "@/hooks/useDashboardData";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Wrench,
  Users,
  BarChart3
} from "lucide-react";
import { LogoutProps } from "@/types/props";

export default function Dashboard({ onLogout }: LogoutProps) {
  const { data, loading, error } = useDashboardData();

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout onLogout={onLogout}>
        <div className="container mx-auto py-6">
          <div className="text-center py-8">
            <p className="text-red-600">Erro ao carregar dados: {error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de ordens de serviço
          </p>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total de OS"
            value={data.totalOrdens}
            description="Total de ordens de serviço"
            icon={<FileText className="h-4 w-4" />}
            variant="default"
          />
          
          <MetricCard
            title="Em Andamento"
            value={data.ordensEmAndamento}
            description="Ordens sendo executadas"
            icon={<Clock className="h-4 w-4" />}
            variant="warning"
          />
          
          <MetricCard
            title="Finalizadas"
            value={data.ordensFinalizadas}
            description="Ordens concluídas"
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          
          <MetricCard
            title="Atrasadas"
            value={data.ordensAtrasadas}
            description="Ordens com atraso"
            icon={<AlertTriangle className="h-4 w-4" />}
            variant="danger"
          />
          
          <MetricCard
            title="Orçamentos"
            value={data.ordensOrcamento}
            description="Aguardando aprovação"
            icon={<TrendingUp className="h-4 w-4" />}
            variant="default"
          />
        </div>

        {/* Gráficos */}
        <Tabs defaultValue="status" className="space-y-4">
          <TabsList>
            <TabsTrigger value="status">
              <BarChart3 className="h-4 w-4 mr-2" />
              Por Status
            </TabsTrigger>
            <TabsTrigger value="servicos">
              <Wrench className="h-4 w-4 mr-2" />
              Por Serviços
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="status">
            <StatusChart
              title="Ordens por Status"
              description="Distribuição das ordens de serviço por status atual"
              data={data.ordensPorStatus}
            />
          </TabsContent>
          
          <TabsContent value="servicos">
            <StatusChart
              title="Serviços Mais Executados"
              description="Top 10 tipos de serviços mais realizados"
              data={data.servicosPorTipo}
            />
          </TabsContent>
        </Tabs>

        {/* Cards informativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance
              </CardTitle>
              <CardDescription>Indicadores de performance do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taxa de Finalização</span>
                  <span className="font-medium">
                    {data.totalOrdens > 0 ? 
                      Math.round((data.ordensFinalizadas / data.totalOrdens) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ordens Ativas</span>
                  <span className="font-medium">{data.ordensEmAndamento}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taxa de Atraso</span>
                  <span className="font-medium text-red-600">
                    {data.totalOrdens > 0 ? 
                      Math.round((data.ordensAtrasadas / data.totalOrdens) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resumo Operacional
              </CardTitle>
              <CardDescription>Informações operacionais importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Novos Orçamentos</span>
                  <span className="font-medium">{data.ordensOrcamento}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tipos de Serviços</span>
                  <span className="font-medium">{data.servicosPorTipo.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status Diferentes</span>
                  <span className="font-medium">{data.ordensPorStatus.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
