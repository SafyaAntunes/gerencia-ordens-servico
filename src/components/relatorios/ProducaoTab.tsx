
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Cell,
  LineChart,
  Line
} from "recharts";
import { FileBarChart, TrendingUp, Clock, ActivitySquare, Wrench, CheckCircle, AlertCircle } from "lucide-react";

export function ProducaoTab() {
  const servicosPorTipo = [
    { nome: "Bloco", quantidade: 32, percentual: 25, tempo_medio: 4.2 },
    { nome: "Biela", quantidade: 28, percentual: 22, tempo_medio: 2.8 },
    { nome: "Cabeçote", quantidade: 40, percentual: 31, tempo_medio: 3.5 },
    { nome: "Virabrequim", quantidade: 18, percentual: 14, tempo_medio: 5.1 },
    { nome: "Eixo de Comando", quantidade: 10, percentual: 8, tempo_medio: 3.2 },
  ];
  
  const ordensPorStatus = [
    { nome: "Orçamento", quantidade: 12, cor: "#fbbf24" },
    { nome: "Aguardando Aprovação", quantidade: 5, cor: "#f59e0b" },
    { nome: "Executando Serviço", quantidade: 18, cor: "#3b82f6" },
    { nome: "Finalizado", quantidade: 25, cor: "#10b981" },
    { nome: "Entregue", quantidade: 45, cor: "#059669" },
  ];
  
  const produtividadeMensal = [
    { mes: "Jan", ordens_finalizadas: 28, ordens_abertas: 32, tempo_medio: 2.5, eficiencia: 87.5 },
    { mes: "Fev", ordens_finalizadas: 35, ordens_abertas: 38, tempo_medio: 2.3, eficiencia: 92.1 },
    { mes: "Mar", ordens_finalizadas: 42, ordens_abertas: 45, tempo_medio: 2.1, eficiencia: 93.3 },
    { mes: "Abr", ordens_finalizadas: 38, ordens_abertas: 42, tempo_medio: 2.2, eficiencia: 90.5 },
    { mes: "Mai", ordens_finalizadas: 45, ordens_abertas: 48, tempo_medio: 2.0, eficiencia: 93.8 },
    { mes: "Jun", ordens_finalizadas: 50, ordens_abertas: 52, tempo_medio: 1.9, eficiencia: 96.2 },
  ];

  const statusIndicadores = [
    { nome: "Em Atraso", quantidade: 8, cor: "#ef4444", icon: AlertCircle },
    { nome: "No Prazo", quantidade: 67, cor: "#10b981", icon: CheckCircle },
    { nome: "Entregues", quantidade: 45, cor: "#6366f1", icon: FileBarChart },
  ];
  
  const totalServicos = servicosPorTipo.reduce((sum, item) => sum + item.quantidade, 0);
  const totalOrdens = ordensPorStatus.reduce((sum, item) => sum + item.quantidade, 0);
  const totalOrdensFinalizadas = ordensPorStatus.find(item => item.nome === "Finalizado")?.quantidade || 0;
  const totalOrdensEntregues = ordensPorStatus.find(item => item.nome === "Entregue")?.quantidade || 0;
  const taxaFinalizacao = ((totalOrdensFinalizadas + totalOrdensEntregues) / totalOrdens) * 100;
  const tempoMedioGeral = servicosPorTipo.reduce((acc, servico) => acc + (servico.tempo_medio * servico.quantidade), 0) / totalServicos;
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <div className="space-y-6">
      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Total de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServicos}</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio: {tempoMedioGeral.toFixed(1)}h
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              Total de Ordens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrdens}</div>
            <p className="text-xs text-muted-foreground">
              Este período
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taxaFinalizacao.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {totalOrdensFinalizadas + totalOrdensEntregues} de {totalOrdens} ordens
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Eficiência Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">96.2%</div>
            <p className="text-xs text-muted-foreground">
              ↑ 2.4% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status das Ordens */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {statusIndicadores.map((status) => {
          const IconComponent = status.icon;
          return (
            <Card key={status.nome}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" style={{ color: status.cor }} />
                    <span className="font-medium">{status.nome}</span>
                  </div>
                  <Badge style={{ backgroundColor: status.cor }} className="text-white">
                    {status.quantidade}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços por Tipo</CardTitle>
            <CardDescription>
              Distribuição dos serviços com tempo médio de execução
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <div className="space-y-3 mb-4">
              {servicosPorTipo.map((servico, index) => (
                <div key={servico.nome} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{servico.nome}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{servico.quantidade}</div>
                    <div className="text-xs text-muted-foreground">{servico.tempo_medio}h médio</div>
                  </div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={servicosPorTipo}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="quantidade"
                >
                  {servicosPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Quantidade"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Status das Ordens */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>
              Status atual das ordens de serviço
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={ordensPorStatus}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <XAxis 
                  dataKey="nome" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Produtividade Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Produtividade</CardTitle>
          <CardDescription>
            Evolução mensal da produtividade e eficiência
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={produtividadeMensal}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'eficiencia') return [`${value}%`, 'Eficiência'];
                  if (name === 'tempo_medio') return [`${value}h`, 'Tempo Médio'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="ordens_finalizadas" name="Ordens Finalizadas" fill="#10b981" />
              <Bar yAxisId="left" dataKey="ordens_abertas" name="Ordens Abertas" fill="#3b82f6" />
              <Line yAxisId="right" type="monotone" dataKey="eficiencia" name="Eficiência %" stroke="#f59e0b" strokeWidth={3} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
