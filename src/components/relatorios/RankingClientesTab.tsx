
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, TrendingUp, DollarSign, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

export function RankingClientesTab() {
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();

  // Dados simulados - em produção viriam de uma API
  const rankingClientes = [
    { 
      nome: "Transportadora Silva Ltda", 
      totalOrdens: 24, 
      valorTotal: 125000, 
      ordemMedia: 5208, 
      ultimaOrdem: "2024-05-20",
      categoria: "Premium"
    },
    { 
      nome: "Auto Peças Central", 
      totalOrdens: 18, 
      valorTotal: 89000, 
      ordemMedia: 4944, 
      ultimaOrdem: "2024-05-18",
      categoria: "Gold"
    },
    { 
      nome: "Oficina Mecânica Souza", 
      totalOrdens: 15, 
      valorTotal: 67500, 
      ordemMedia: 4500, 
      ultimaOrdem: "2024-05-15",
      categoria: "Gold"
    },
    { 
      nome: "Frota Express", 
      totalOrdens: 12, 
      valorTotal: 45000, 
      ordemMedia: 3750, 
      ultimaOrdem: "2024-05-10",
      categoria: "Standard"
    },
    { 
      nome: "Caminhões do Norte", 
      totalOrdens: 10, 
      valorTotal: 38000, 
      ordemMedia: 3800, 
      ultimaOrdem: "2024-05-08",
      categoria: "Standard"
    },
    { 
      nome: "Logística Rápida", 
      totalOrdens: 8, 
      valorTotal: 25000, 
      ordemMedia: 3125, 
      ultimaOrdem: "2024-04-30",
      categoria: "Bronze"
    },
  ];

  const distribuicaoCategoria = [
    { categoria: "Premium", quantidade: 1, valor: 125000 },
    { categoria: "Gold", quantidade: 2, valor: 156500 },
    { categoria: "Standard", quantidade: 2, valor: 83000 },
    { categoria: "Bronze", quantidade: 1, valor: 25000 },
  ];

  const evolucaoMensal = [
    { mes: "Jan", novosClientes: 5, clientesAtivos: 45, faturamento: 85000 },
    { mes: "Fev", novosClientes: 3, clientesAtivos: 48, faturamento: 92000 },
    { mes: "Mar", novosClientes: 7, clientesAtivos: 55, faturamento: 105000 },
    { mes: "Abr", novosClientes: 4, clientesAtivos: 59, faturamento: 98000 },
    { mes: "Mai", novosClientes: 6, clientesAtivos: 65, faturamento: 115000 },
  ];

  const getCategoriaColor = (categoria: string) => {
    const colors = {
      "Premium": "#8b5cf6",
      "Gold": "#f59e0b",
      "Standard": "#3b82f6",
      "Bronze": "#6b7280"
    };
    return colors[categoria as keyof typeof colors] || "#6b7280";
  };

  const COLORS = ['#8b5cf6', '#f59e0b', '#3b82f6', '#6b7280'];

  const filtrarPorData = () => {
    // Aqui seria implementada a lógica de filtro por data
    console.log("Filtrando por período:", { dataInicio, dataFim });
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
          <CardDescription>
            Selecione o período para análise do ranking de clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Data Início:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Data Fim:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={filtrarPorData} className="ml-auto">
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65</div>
            <p className="text-xs text-green-600">+6 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 389.500</div>
            <p className="text-xs text-green-600">+12% vs período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ordens Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-blue-600">Período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 4.477</div>
            <p className="text-xs text-green-600">+8% vs período anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clientes</CardTitle>
            <CardDescription>
              Ranking por valor total de ordens no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rankingClientes.map((cliente, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{cliente.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {cliente.totalOrdens} ordens • Última: {format(new Date(cliente.ultimaOrdem), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {cliente.valorTotal.toLocaleString('pt-BR')}</p>
                    <Badge 
                      style={{ backgroundColor: getCategoriaColor(cliente.categoria) }}
                      className="text-white text-xs"
                    >
                      {cliente.categoria}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>
              Segmentação dos clientes por valor de negócio
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribuicaoCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, quantidade }) => `${categoria}: ${quantidade}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {distribuicaoCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, "Valor Total"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Base de Clientes</CardTitle>
          <CardDescription>
            Crescimento mensal de novos clientes e faturamento
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={evolucaoMensal}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'faturamento') return [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Faturamento'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="novosClientes" name="Novos Clientes" fill="#10b981" />
              <Bar yAxisId="left" dataKey="clientesAtivos" name="Clientes Ativos" fill="#3b82f6" />
              <Bar yAxisId="right" dataKey="faturamento" name="Faturamento" fill="#f59e0b" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
