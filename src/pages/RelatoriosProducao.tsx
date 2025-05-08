
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogoutProps } from "@/types/props";
import { ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Search, Calendar as CalendarIcon, BarChart as BarChartIcon, Filter } from "lucide-react";

// Dados de exemplo para o gráfico
const statusData = [
  { status: 'Orçamento', value: 0 },
  { status: 'Aguardando Aprovação', value: 0 },
  { status: 'Em Fabricação', value: 0 },
  { status: 'Aguardando Peça (Cliente)', value: 0 },
  { status: 'Aguardando Peça (Interno)', value: 0 },
  { status: 'Finalizado', value: 0 },
  { status: 'Entregue', value: 0 },
];

// Component for displaying production reports
export default function RelatoriosProducao({ onLogout }: LogoutProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined
  });
  
  const [activeTab, setActiveTab] = useState("status");
  const [showCalendar, setShowCalendar] = useState(false);

  const handleGenerateReport = () => {
    console.log("Generating report for date range:", dateRange);
    // Here you'd implement the logic to generate and display the report
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header com título */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Relatórios de Produção</h1>
        </div>
        
        {/* Seção de filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filtros e Pesquisa</CardTitle>
            <CardDescription>Refine os dados do relatório usando os filtros abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              {/* Filtro de número OS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="numero-os">Número da OS</Label>
                </div>
                <Select defaultValue="todos">
                  <SelectTrigger id="numero-os" className="w-full">
                    <SelectValue placeholder="Todos os números" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo de pesquisa */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="search">Pesquisar</Label>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="search"
                    placeholder="Pesquisar por número da OS..."
                    className="pl-8"
                  />
                </div>
              </div>
              
              {/* Botão de busca */}
              <div className="flex items-end">
                <Button onClick={handleGenerateReport} className="w-full">
                  Buscar
                </Button>
              </div>
              
              {/* Segunda linha de filtros */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tipo-servico">Tipo de Serviço</Label>
                </div>
                <Select defaultValue="todos">
                  <SelectTrigger id="tipo-servico" className="w-full">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="bloco">Bloco</SelectItem>
                    <SelectItem value="cabecote">Cabeçote</SelectItem>
                    <SelectItem value="biela">Biela</SelectItem>
                    <SelectItem value="virabrequim">Virabrequim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro de responsável */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="responsavel">Responsável</Label>
                </div>
                <Select defaultValue="todos">
                  <SelectTrigger id="responsavel" className="w-full">
                    <SelectValue placeholder="Todos os funcionários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os funcionários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Seleção de período */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="periodo">Período</Label>
                </div>
                <div className="relative">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "Selecione um período"
                    )}
                  </Button>
                  {showCalendar && (
                    <div className="absolute z-10 mt-1 bg-white rounded-md shadow-lg border">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range);
                          if (range?.to) {
                            setShowCalendar(false);
                          }
                        }}
                        numberOfMonths={1}
                        locale={ptBR}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cards de métricas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="18" height="14" x="3" y="5" rx="2" />
                <path d="M3 7h18" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ordens Finalizadas</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Finalização</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="m16 18 2-2-2-2" />
                <path d="M18 16H9a2 2 0 0 1-2-2V5" />
                <path d="m3 7 2 2 2-2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.00%</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Abas de visualização */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="status">Ordens por Status</TabsTrigger>
            <TabsTrigger value="tipo">Serviços por Tipo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader className="flex justify-between">
                <div>
                  <CardTitle>Ordens por Status</CardTitle>
                  <CardDescription>Distribuição das ordens de serviço por status</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar por Período
                </Button>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[400px]">
                  <ChartContainer
                    config={{
                      status: {
                        color: "hsl(210, 100%, 50%)",
                        label: "Status",
                      },
                    }}
                    className="w-full aspect-[4/3]"
                  >
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        data={statusData} 
                        layout="vertical" 
                        margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
                      >
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="status" 
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar 
                          dataKey="value" 
                          fill="#60a5fa"
                          radius={[0, 4, 4, 0]} 
                          name="Quantidade"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tipo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Serviços por Tipo</CardTitle>
                <CardDescription>Distribuição de serviços e tempos médios de execução</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center border border-dashed rounded-md">
                  <p className="text-muted-foreground">Selecione um período para visualizar os dados.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
