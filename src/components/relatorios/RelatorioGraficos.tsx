
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart as RechartsBarChart, XAxis, YAxis, Bar } from "recharts";

type GraficosProps = {
  servicosPorTipo: { nome: string; quantidade: number; percentual: number }[];
  ordensPorStatus: { nome: string; quantidade: number }[];
  produtividadeMensal: { mes: string; ordens: number; tempo_medio: number }[];
  COLORS: string[];
};

export default function RelatorioGraficos({
  servicosPorTipo,
  ordensPorStatus,
  produtividadeMensal,
  COLORS,
}: GraficosProps) {
  return (
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
                nameKey="nome"
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
                nameKey="nome"
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
  );
}
