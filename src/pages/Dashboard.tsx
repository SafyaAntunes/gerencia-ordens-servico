
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { useDashboardData } from "@/hooks/useDashboardData";
import MetricCard from "@/components/dashboard/MetricCard";
import StatusChart from "@/components/dashboard/StatusChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, Clock, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  // Remove filter states and UI - filters are now hidden
  const { data, loading, error } = useDashboardData();

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando dados do dashboard...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Erro: {error}</div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Nenhum dado disponível</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Visão geral das ordens de serviço
          </p>
        </div>

        {/* Removed filter section - filters are now hidden */}

        {/* Métricas principais */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <MetricCard
            title="Total de Ordens"
            value={data.totalOrdens}
            icon={<FileText className="h-4 w-4" />}
          />
          <MetricCard
            title="Em Andamento"
            value={data.ordensEmAndamento}
            icon={<Clock className="h-4 w-4" />}
          />
          <MetricCard
            title="Finalizadas"
            value={data.ordensFinalizadas}
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <MetricCard
            title="Atrasadas"
            value={data.ordensAtrasadas}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <MetricCard
            title="Orçamentos"
            value={data.ordensOrcamento}
            icon={<DollarSign className="h-4 w-4" />}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusChart 
            title="Ordens por Status"
            data={data.ordensPorStatus} 
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Serviços por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.servicosPorTipo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
