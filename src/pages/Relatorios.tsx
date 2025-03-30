
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, TrendingUp, Clock, CalendarDays, BarChart, Users, ActivitySquare, Tools } from "lucide-react";
import { LogoutProps } from "@/types/props";
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

interface RelatoriosProps extends LogoutProps {}

const Relatorios = ({ onLogout }: RelatoriosProps) => {
  // Dados financeiros
  const dadosMensais = [
    { mes: "Janeiro", receita: 50000, despesas: 30000 },
    { mes: "Fevereiro", receita: 55000, despesas: 32000 },
    { mes: "Março", receita: 60000, despesas: 35000 },
    { mes: "Abril", receita: 58000, despesas: 34000 },
    { mes: "Maio", receita: 63000, despesas: 36000 },
    { mes: "Junho", receita: 65000, despesas: 38000 },
  ];
  
  const dadosAnuais = [
    { ano: 2021, receita: 600000, despesas: 350000 },
    { ano: 2022, receita: 650000, despesas: 380000 },
    { ano: 2023, receita: 700000, despesas: 400000 },
  ];
  
  // Dados de produção
  const servicosPorTipo = [
    { nome: "Bloco", quantidade: 32, percentual: 25 },
    { nome: "Biela", quantidade: 28, percentual: 22 },
    { nome: "Cabeçote", quantidade: 40, percentual: 31 },
    { nome: "Virabrequim", quantidade: 18, percentual: 14 },
    { nome: "Eixo de Comando", quantidade: 10, percentual: 8 },
  ];
  
  const ordensPorStatus = [
    { nome: "Orçamento", quantidade: 12 },
    { nome: "Aguardando", quantidade: 5 },
    { nome: "Em Fabricação", quantidade: 18 },
    { nome: "Finalizado", quantidade: 25 },
    { nome: "Entregue", quantidade: 45 },
  ];
  
  const produtividadeMensal = [
    { mes: "Janeiro", ordens: 28, tempo_medio: 2.5 },
    { mes: "Fevereiro", ordens: 35, tempo_medio: 2.3 },
    { mes: "Março", ordens: 42, tempo_medio: 2.1 },
    { mes: "Abril", ordens: 38, tempo_medio: 2.2 },
    { mes: "Maio", ordens: 45, tempo_medio: 2.0 },
    { mes: "Junho", ordens: 50, tempo_medio: 1.9 },
  ];
  
  // Cálculos financeiros
  const calcularLucro = (receita: number, despesas: number) => receita - despesas;
  
  const calcularTotal = (dados: any[], chave: string) => {
    return dados.reduce((total, item) => total + item[chave], 0);
  };
  
  const totalReceitasMensais = calcularTotal(dadosMensais, "receita");
  const totalDespesasMensais = calcularTotal(dadosMensais, "despesas");
  const lucroMensal = calcularLucro(totalReceitasMensais, totalDespesasMensais);
  
  const totalReceitasAnuais = calcularTotal(dadosAnuais, "receita");
  const totalDespesasAnuais = calcularTotal(dadosAnuais, "despesas");
  const lucroAnual = calcularLucro(totalReceitasAnuais, totalDespesasAnuais);
  
  // Cálculos de produção
  const totalServicos = servicosPorTipo.reduce((sum, item) => sum + item.quantidade, 0);
  const totalOrdens = ordensPorStatus.reduce((sum, item) => sum + item.quantidade, 0);
  const totalOrdensFinalizadas = ordensPorStatus.find(item => item.nome === "Finalizado")?.quantidade || 0;
  const totalOrdensEntregues = ordensPorStatus.find(item => item.nome === "Entregue")?.quantidade || 0;
  const taxaFinalizacao = ((totalOrdensFinalizadas + totalOrdensEntregues) / totalOrdens) * 100;
  
  // Cores para os gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Acompanhe as métricas e estatísticas do seu negócio
          </p>
        </div>
        
        <Tabs defaultValue="financeiro" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="producao">Produção</TabsTrigger>
          </TabsList>
          
          <TabsContent value="financeiro">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Tabs defaultValue="mensal" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="mensal">Mensal</TabsTrigger>
                  <TabsTrigger value="anual">Anual</TabsTrigger>
                </TabsList>
                
                <TabsContent value="mensal">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileBarChart className="h-4 w-4" />
                          Receita Total
                        </CardTitle>
                        <CardDescription>Total de receitas mensais</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          R$ {totalReceitasMensais.toLocaleString('pt-BR')}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Despesas Totais
                        </CardTitle>
                        <CardDescription>Total de despesas mensais</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          R$ {totalDespesasMensais.toLocaleString('pt-BR')}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Lucro Líquido
                        </CardTitle>
                        <CardDescription>Lucro total mensal</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {lucroMensal.toLocaleString('pt-BR')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Receitas e Despesas Mensais</CardTitle>
                      <CardDescription>
                        Comparativo dos últimos 6 meses
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={dadosMensais}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                          <Legend />
                          <Bar dataKey="receita" name="Receita" fill="#4f46e5" />
                          <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="anual">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileBarChart className="h-4 w-4" />
                          Receita Total
                        </CardTitle>
                        <CardDescription>Total de receitas anuais</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          R$ {totalReceitasAnuais.toLocaleString('pt-BR')}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Despesas Totais
                        </CardTitle>
                        <CardDescription>Total de despesas anuais</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          R$ {totalDespesasAnuais.toLocaleString('pt-BR')}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Lucro Líquido
                        </CardTitle>
                        <CardDescription>Lucro total anual</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {lucroAnual.toLocaleString('pt-BR')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Receitas e Despesas Anuais</CardTitle>
                      <CardDescription>
                        Comparativo dos últimos 3 anos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={dadosAnuais}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <XAxis dataKey="ano" />
                          <YAxis />
                          <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                          <Legend />
                          <Bar dataKey="receita" name="Receita" fill="#4f46e5" />
                          <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          
          <TabsContent value="producao">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Tools className="h-5 w-5 mr-2 text-muted-foreground" />
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default Relatorios;
