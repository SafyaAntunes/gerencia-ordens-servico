
import { FileDown, Filter, BarChart3 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusChart from "@/components/dashboard/StatusChart";
import { useToast } from "@/components/ui/use-toast";

// Dados de exemplo para gráficos
const statusData = [
  { name: "Em Orçamento", total: 14 },
  { name: "Aguardando Aprovação", total: 8 },
  { name: "Em Fabricação", total: 16 },
  { name: "Em Espera", total: 4 },
  { name: "Finalizado", total: 10 },
  { name: "Entregue", total: 78 },
];

const servicosData = [
  { name: "Bloco", total: 48 },
  { name: "Biela", total: 32 },
  { name: "Cabeçote", total: 62 },
  { name: "Virabrequim", total: 41 },
  { name: "Eixo de Comando", total: 18 },
];

const clientesData = [
  { name: "Auto Peças Silva", total: 32 },
  { name: "Oficina Mecânica Central", total: 24 },
  { name: "Concessionária Motors", total: 18 },
  { name: "Autoelétrica Express", total: 15 },
  { name: "Transportadora Rodovia", total: 12 },
];

const eficienciaData = [
  { name: "Tempo Operacional", total: 128 },
  { name: "Tempo em Pausa", total: 18 },
];

export default function Relatorios({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  
  const handleExportReport = () => {
    toast({
      title: "Exportação iniciada",
      description: "O relatório está sendo gerado para download",
    });
  };
  
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">
              Visualize e exporte relatórios de desempenho e produção
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select defaultValue="mes">
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="trimestre">Último Trimestre</SelectItem>
                <SelectItem value="ano">Este Ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleExportReport}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="desempenho">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="desempenho" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Desempenho
            </TabsTrigger>
            <TabsTrigger value="producao" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Produção
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="desempenho" className="space-y-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <StatusChart
                title="Eficiência Operacional"
                description="Tempo de operação vs. tempo de pausa"
                data={eficienciaData}
              />
              
              <StatusChart
                title="Ordens de Serviço por Cliente"
                description="Distribuição de OSs por cliente"
                data={clientesData}
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Eficiência</CardTitle>
                <CardDescription>
                  Evolução da eficiência operacional ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Dados históricos de desempenho
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="producao" className="space-y-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <StatusChart
                title="Ordens de Serviço por Status"
                description="Distribuição de OSs por status atual"
                data={statusData}
              />
              
              <StatusChart
                title="Serviços Realizados"
                description="Distribuição por tipo de serviço"
                data={servicosData}
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Volume de Produção Mensal</CardTitle>
                <CardDescription>
                  Quantidade de ordens de serviço por mês
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Dados históricos de produção
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
