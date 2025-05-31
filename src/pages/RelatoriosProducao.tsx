
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogoutProps } from "@/types/props";
import { useRelatorioProducao } from "@/hooks/useRelatorioProducao";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Calendar, TrendingUp, Users, Wrench, Clock, CheckCircle, AlertCircle } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function RelatoriosProducao({ onLogout }: LogoutProps) {
  const [dataInicio, setDataInicio] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [dataFim, setDataFim] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  const { dados, loading, error } = useRelatorioProducao({
    dataInicio: dataInicio ? new Date(dataInicio) : undefined,
    dataFim: dataFim ? new Date(dataFim) : undefined
  });

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

  if (error || !dados) {
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Relatórios de Produção</h1>
        </div>
        
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período
            </CardTitle>
            <CardDescription>Selecione o período para análise dos dados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="data-inicio">Data Inicial</Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="data-fim">Data Final</Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
              <div>
                <Button 
                  onClick={() => {
                    setDataInicio(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
                    setDataFim(format(new Date(), 'yyyy-MM-dd'));
                  }}
                  variant="outline"
                >
                  Últimos 30 dias
                </Button>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              Período selecionado: {format(new Date(dataInicio), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(dataFim), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </CardContent>
        </Card>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dados.totalOrdens}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dados.ordensFinalizadas}</div>
              <p className="text-xs text-muted-foreground">
                {dados.totalOrdens > 0 ? Math.round((dados.ordensFinalizadas / dados.totalOrdens) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{dados.ordensEmAndamento}</div>
              <p className="text-xs text-muted-foreground">
                {dados.totalOrdens > 0 ? Math.round((dados.ordensEmAndamento / dados.totalOrdens) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dados.tempoMedioExecucao}</div>
              <p className="text-xs text-muted-foreground">dias para conclusão</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="funcionarios" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="funcionarios" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Funcionários
            </TabsTrigger>
            <TabsTrigger value="servicos" className="flex-1">
              <Wrench className="h-4 w-4 mr-2" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="status" className="flex-1">
              <AlertCircle className="h-4 w-4 mr-2" />
              Status
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="funcionarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produtividade por Funcionário</CardTitle>
                <CardDescription>Ranking de funcionários por número de OS finalizadas.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dados.funcionariosProdutividade.slice(0, 10).map((funcionario, index) => (
                    <div key={funcionario.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{funcionario.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {funcionario.especialidades.length > 0 ? funcionario.especialidades.join(", ") : "Sem especialidades"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{funcionario.ordensFinalizadas}</div>
                        <div className="text-xs text-muted-foreground">
                          {funcionario.tempoMedio > 0 ? `${funcionario.tempoMedio} min/OS` : 'Sem dados'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="servicos" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Serviços Mais Comuns</CardTitle>
                  <CardDescription>Distribuição dos tipos de serviços executados.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dados.servicosMaisComuns.map((servico, index) => (
                      <div key={servico.tipo} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{servico.tipo.replace('_', ' ')}</span>
                          <span>{servico.quantidade} ({servico.percentual}%)</span>
                        </div>
                        <Progress value={servico.percentual} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Gráfico de Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dados.servicosMaisComuns.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ tipo, percentual }) => `${tipo}: ${percentual}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {dados.servicosMaisComuns.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="clientes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Mais Ativos</CardTitle>
                <CardDescription>Ranking de clientes por número de ordens de serviço.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dados.clientesAtivos.map((cliente, index) => (
                    <div key={cliente.nome} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{cliente.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {cliente.ordensFinalizadas} de {cliente.totalOrdens} finalizadas
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{cliente.totalOrdens}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((cliente.ordensFinalizadas / cliente.totalOrdens) * 100)}% concluídas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(dados.ordensPorStatus).map(([status, quantidade]) => {
                      const percentual = Math.round((quantidade / dados.totalOrdens) * 100);
                      return (
                        <div key={status} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{status.replace('_', ' ')}</span>
                            <span>{quantidade} ({percentual}%)</span>
                          </div>
                          <Progress value={percentual} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Cumprimento de Prazos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-800">No Prazo</span>
                      <Badge variant="success">{dados.ordensNoPrazo}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-red-800">Atrasadas</span>
                      <Badge variant="destructive">{dados.ordensAtrasadas}</Badge>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-2xl font-bold">
                        {dados.ordensNoPrazo + dados.ordensAtrasadas > 0 ? 
                          Math.round((dados.ordensNoPrazo / (dados.ordensNoPrazo + dados.ordensAtrasadas)) * 100) : 0}%
                        </div>
                      <div className="text-sm text-muted-foreground">Taxa de cumprimento</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
