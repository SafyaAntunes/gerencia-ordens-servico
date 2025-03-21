
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart2, PieChart, LineChart, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from "recharts";
import { Separator } from "@/components/ui/separator";

interface RelatoriosProps {
  onLogout: () => void;
}

// Dados fictícios para os gráficos
const produtividadeMensal = [
  { nome: "Jan", ordens: 65, tempo: 480 },
  { nome: "Fev", ordens: 59, tempo: 420 },
  { nome: "Mar", ordens: 80, tempo: 510 },
  { nome: "Abr", ordens: 81, tempo: 530 },
  { nome: "Mai", ordens: 56, tempo: 410 },
  { nome: "Jun", ordens: 55, tempo: 400 },
  { nome: "Jul", ordens: 40, tempo: 380 },
];

const tiposServicos = [
  { name: "Bloco", value: 35 },
  { name: "Biela", value: 20 },
  { name: "Cabeçote", value: 30 },
  { name: "Virabrequim", value: 10 },
  { name: "Eixo de Comando", value: 5 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A66EFF"];

export default function Relatorios({ onLogout }: RelatoriosProps) {
  const [periodoFiltro, setPeriodoFiltro] = useState("7dias");
  
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise de desempenho e produtividade da retífica
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select 
              value={periodoFiltro}
              onValueChange={setPeriodoFiltro}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="3meses">Últimos 3 meses</SelectItem>
                <SelectItem value="6meses">Últimos 6 meses</SelectItem>
                <SelectItem value="1ano">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="produtividade">
          <TabsList className="mb-6">
            <TabsTrigger value="produtividade" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Produtividade
            </TabsTrigger>
            <TabsTrigger value="servicos" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="faturamento" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Faturamento
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="produtividade" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Ordens Concluídas</CardTitle>
                  <CardDescription>Total no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">436</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-green-500">↑ 12%</span> comparado ao período anterior
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tempo Médio de Entrega</CardTitle>
                  <CardDescription>Média em dias úteis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">7.3</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-green-500">↓ 0.8</span> dias em relação ao período anterior
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Eficiência Operacional</CardTitle>
                  <CardDescription>Tempo de operação vs. pausas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">84%</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-red-500">↓ 2%</span> comparado ao período anterior
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Produtividade Mensal</CardTitle>
                <CardDescription>Ordens de serviço concluídas por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={produtividadeMensal}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ordens" name="Ordens Concluídas" fill="#8884d8" />
                    <Bar dataKey="tempo" name="Horas Trabalhadas" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="servicos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Serviços</CardTitle>
                  <CardDescription>Tipos de serviços realizados</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={tiposServicos}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tiposServicos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Análise por Tipo de Serviço</CardTitle>
                  <CardDescription>Tempo médio e eficiência por serviço</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Bloco</h4>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tempo médio:</span>
                        <span className="font-medium">3.5 dias</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Eficiência:</span>
                        <span className="font-medium text-green-500">92%</span>
                      </div>
                      <Separator className="my-2" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Cabeçote</h4>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tempo médio:</span>
                        <span className="font-medium">2.3 dias</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Eficiência:</span>
                        <span className="font-medium text-green-500">88%</span>
                      </div>
                      <Separator className="my-2" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Virabrequim</h4>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tempo médio:</span>
                        <span className="font-medium">4.2 dias</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Eficiência:</span>
                        <span className="font-medium text-amber-500">78%</span>
                      </div>
                      <Separator className="my-2" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Biela</h4>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tempo médio:</span>
                        <span className="font-medium">1.8 dias</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Eficiência:</span>
                        <span className="font-medium text-green-500">95%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="faturamento" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Faturamento Total</CardTitle>
                  <CardDescription>No período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">R$ 187.350,00</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-green-500">↑ 8.3%</span> comparado ao período anterior
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Ticket Médio</CardTitle>
                  <CardDescription>Valor médio por ordem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">R$ 3.850,00</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-green-500">↑ 4.2%</span> comparado ao período anterior
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Ordens em Aberto</CardTitle>
                  <CardDescription>Valor total</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">R$ 43.750,00</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-muted-foreground">28 ordens pendentes</span>
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Faturamento por Período</CardTitle>
                <CardDescription>Análise de valores faturados ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-16">
                  Gráfico de faturamento será implementado em breve
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
