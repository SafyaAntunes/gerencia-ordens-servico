import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, TrendingUp, Clock, CalendarDays, BarChart, Users, ActivitySquare, Wrench } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend
} from "recharts";
import { ProducaoTab } from "@/components/relatorios/ProducaoTab";
import { RankingClientesTab } from "@/components/relatorios/RankingClientesTab";

interface RelatoriosProps extends LogoutProps {}

const Relatorios = ({ onLogout }: RelatoriosProps) => {
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
            <TabsTrigger value="clientes">Ranking de Clientes</TabsTrigger>
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
            <ProducaoTab />
          </TabsContent>

          <TabsContent value="clientes">
            <RankingClientesTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Relatorios;
