
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, FileBarChart, Wrench, BarChart, ActivitySquare } from "lucide-react";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";

// Import types from the file
import type {
  Cliente,
  Motor,
  TipoServico,
  TipoAtividade,
  SubAtividade,
  Servico,
  StatusOS,
  EtapaOS,
  Prioridade,
  TempoRegistro,
  FotoBase64,
  PausaRegistro,
  OrdemServico,
} from "@/types/ordens";

interface RelatoriosProducaoProps {
  onLogout: () => void;
}

const RelatoriosProducao = ({ onLogout }: RelatoriosProducaoProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("ordens_por_status");

  return (
    <Layout onLogout={onLogout}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Relatórios de Produção</h1>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Filtros e Pesquisa</h2>
              <p className="text-sm text-muted-foreground">Refine os dados do relatório usando os filtros abaixo</p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:max-w-[200px]">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Número da OS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numero_os">Número da OS</SelectItem>
                      <SelectItem value="nome_cliente">Nome do Cliente</SelectItem>
                      <SelectItem value="tipo_servico">Tipo de Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Pesquisar por número da OS..."
                      className="pl-8"
                    />
                  </div>
                  <Button>Buscar</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo de Serviço</label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="bloco">Bloco</SelectItem>
                      <SelectItem value="biela">Biela</SelectItem>
                      <SelectItem value="cabecote">Cabeçote</SelectItem>
                      <SelectItem value="virabrequim">Virabrequim</SelectItem>
                      <SelectItem value="eixo_comando">Eixo de Comando</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Responsável</label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os funcionários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os funcionários</SelectItem>
                      <SelectItem value="joao">João Silva</SelectItem>
                      <SelectItem value="maria">Maria Oliveira</SelectItem>
                      <SelectItem value="carlos">Carlos Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Período</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left",
                          !selectedPeriod && "text-muted-foreground"
                        )}
                      >
                        {selectedPeriod ? (
                          format(selectedPeriod, "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })
                        ) : (
                          "Selecione um período"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedPeriod}
                        onSelect={setSelectedPeriod}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total de Serviços</p>
                  <h3 className="text-2xl font-bold">0</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileBarChart className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total de Ordens</p>
                  <h3 className="text-2xl font-bold">0</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <ActivitySquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Ordens Finalizadas</p>
                  <h3 className="text-2xl font-bold">0</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <BarChart className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Taxa de Finalização</p>
                  <h3 className="text-2xl font-bold">0.00%</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="ordens_por_status" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="ordens_por_status">Ordens por Status</TabsTrigger>
            <TabsTrigger value="servicos_por_tipo">Serviços por Tipo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ordens_por_status">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Ordens por Status</CardTitle>
                  <p className="text-sm text-muted-foreground">Distribuição das ordens de serviço por status</p>
                </div>
                <Button variant="outline" size="sm">
                  Filtrar por Período
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <p>Os dados do gráfico serão exibidos aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="servicos_por_tipo">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Serviços por Tipo</CardTitle>
                  <p className="text-sm text-muted-foreground">Distribuição dos serviços por tipo</p>
                </div>
                <Button variant="outline" size="sm">
                  Filtrar por Período
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <p>Os dados do gráfico serão exibidos aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RelatoriosProducao;
