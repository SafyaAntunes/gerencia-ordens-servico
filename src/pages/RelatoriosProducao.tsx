
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, ActivitySquare, BarChart, Wrench, Search, Clock, Filter, Calendar } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS } from "@/types/ordens";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/utils/timerUtils";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  Cell
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import StatusChart from "@/components/dashboard/StatusChart";
import ExportButton from "@/components/common/ExportButton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RelatoriosProducaoProps extends LogoutProps {}

const RelatoriosProducao = ({ onLogout }: RelatoriosProducaoProps) => {
  const [ordensDados, setOrdensDados] = useState<OrdemServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemServico | null>(null);
  const [filteredOrdens, setFilteredOrdens] = useState<OrdemServico[]>([]);
  const [searchType, setSearchType] = useState<"id" | "cliente" | "nome" | "status">("id");
  
  // Filtros adicionais
  const [tipoServicoFilter, setTipoServicoFilter] = useState<string>("todos");
  const [responsavelFilter, setResponsavelFilter] = useState<string>("todos");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  
  const [funcionarios, setFuncionarios] = useState<{id: string, nome: string}[]>([]);
  
  useEffect(() => {
    const fetchFuncionarios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "funcionarios"));
        const funcionariosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome,
        }));
        setFuncionarios(funcionariosData);
      } catch (error) {
        console.error("Erro ao buscar funcionários:", error);
      }
    };
    
    fetchFuncionarios();
  }, []);
  
  useEffect(() => {
    const fetchOrdens = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "ordens"));
        const ordens: OrdemServico[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ordens.push({
            ...data,
            id: doc.id,
            dataAbertura: data.dataAbertura?.toDate() || new Date(),
            dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
          } as OrdemServico);
        });
        
        setOrdensDados(ordens);
        setFilteredOrdens(ordens);
      } catch (error) {
        console.error("Erro ao buscar ordens:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrdens();
  }, []);
  
  useEffect(() => {
    if (ordensDados.length === 0) return;
    
    let filtradas = [...ordensDados];
    
    // Filtro de pesquisa
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      
      filtradas = filtradas.filter(ordem => {
        switch (searchType) {
          case "id":
            return ordem.id.toLowerCase().includes(searchTermLower);
          case "cliente":
            return ordem.cliente.nome.toLowerCase().includes(searchTermLower);
          case "nome":
            return ordem.nome.toLowerCase().includes(searchTermLower);
          case "status":
            const statusLabel = getStatusLabel(ordem.status).toLowerCase();
            return statusLabel.includes(searchTermLower);
          default:
            return false;
        }
      });
    }
    
    // Filtro por tipo de serviço
    if (tipoServicoFilter !== "todos") {
      filtradas = filtradas.filter(ordem => 
        ordem.servicos?.some(servico => servico.tipo === tipoServicoFilter)
      );
    }
    
    // Filtro por responsável
    if (responsavelFilter !== "todos") {
      filtradas = filtradas.filter(ordem => {
        // Verificar se o funcionário está atribuído a alguma etapa
        for (const etapaKey in ordem.etapasAndamento) {
          const etapa = ordem.etapasAndamento[etapaKey];
          if (etapa.funcionarioId === responsavelFilter) {
            return true;
          }
        }
        
        // Verificar se o funcionário está atribuído a algum serviço
        return ordem.servicos?.some(servico => servico.funcionarioId === responsavelFilter);
      });
    }
    
    // Filtro por período
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      filtradas = filtradas.filter(ordem => {
        const dataAbertura = new Date(ordem.dataAbertura);
        return dataAbertura >= fromDate;
      });
    }
    
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      filtradas = filtradas.filter(ordem => {
        const dataAbertura = new Date(ordem.dataAbertura);
        return dataAbertura <= toDate;
      });
    }
    
    setFilteredOrdens(filtradas);
  }, [searchTerm, searchType, ordensDados, tipoServicoFilter, responsavelFilter, dateRange]);
  
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'orcamento': return 'Orçamento';
      case 'aguardando_aprovacao': return 'Aguardando Aprovação';
      case 'fabricacao': return 'Em Fabricação';
      case 'aguardando_peca_cliente': return 'Aguardando Peça (Cliente)';
      case 'aguardando_peca_interno': return 'Aguardando Peça (Interno)';
      case 'finalizado': return 'Finalizado';
      case 'entregue': return 'Entregue';
      default: return status;
    }
  };
  
  const servicosPorTipo = (() => {
    const contagem: Record<string, number> = {};
    
    ordensDados.forEach(ordem => {
      ordem.servicos?.forEach(servico => {
        const tipo = servico.tipo;
        contagem[tipo] = (contagem[tipo] || 0) + 1;
      });
    });
    
    return Object.entries(contagem)
      .map(([nome, quantidade]) => {
        let label = nome;
        switch (nome) {
          case 'bloco': label = 'Bloco'; break;
          case 'biela': label = 'Biela'; break;
          case 'cabecote': label = 'Cabeçote'; break;
          case 'virabrequim': label = 'Virabrequim'; break;
          case 'eixo_comando': label = 'Eixo de Comando'; break;
          case 'montagem': label = 'Montagem'; break;
          case 'dinamometro': label = 'Dinamômetro'; break;
          case 'lavagem': label = 'Lavagem'; break;
        }
        
        return {
          name: label,
          total: quantidade
        };
      })
      .sort((a, b) => b.total - a.total); // Ordena por quantidade decrescente
  })();
  
  const ordensPorStatus = (() => {
    const contagem: Record<string, number> = {
      orcamento: 0,
      aguardando_aprovacao: 0,
      fabricacao: 0,
      aguardando_peca_cliente: 0,
      aguardando_peca_interno: 0,
      finalizado: 0,
      entregue: 0
    };
    
    ordensDados.forEach(ordem => {
      contagem[ordem.status] = (contagem[ordem.status] || 0) + 1;
    });
    
    return Object.entries(contagem)
      .map(([status, quantidade]) => {
        let nome = status;
        
        switch (status) {
          case 'orcamento': nome = 'Orçamento'; break;
          case 'aguardando_aprovacao': nome = 'Aguardando'; break;
          case 'fabricacao': nome = 'Em Fabricação'; break;
          case 'aguardando_peca_cliente': nome = 'Aguardando Peça (Cliente)'; break;
          case 'aguardando_peca_interno': nome = 'Aguardando Peça (Interno)'; break;
          case 'finalizado': nome = 'Finalizado'; break;
          case 'entregue': nome = 'Entregue'; break;
        }
        
        return {
          name: nome,
          total: quantidade
        };
      })
      .sort((a, b) => b.total - a.total); // Ordena por quantidade decrescente
  })();
  
  const produtividadeMensal = (() => {
    const meses: Record<string, { ordens: number, tempo_medio: number, tempoTotal: number }> = {};
    const hoje = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
      meses[mesAno] = { ordens: 0, tempo_medio: 0, tempoTotal: 0 };
    }
    
    ordensDados.forEach(ordem => {
      if (ordem.dataAbertura) {
        const data = new Date(ordem.dataAbertura);
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
        
        if (meses[mesAno]) {
          meses[mesAno].ordens += 1;
          meses[mesAno].tempoTotal += 2.5;
        }
      }
    });
    
    Object.keys(meses).forEach(mesAno => {
      if (meses[mesAno].ordens > 0) {
        meses[mesAno].tempo_medio = parseFloat((meses[mesAno].tempoTotal / meses[mesAno].ordens).toFixed(1));
      }
    });
    
    return Object.entries(meses).map(([mesAno, dados]) => {
      const [mes, ano] = mesAno.split('/');
      const nomeMes = new Date(parseInt(ano), parseInt(mes) - 1, 1)
        .toLocaleDateString('pt-BR', { month: 'long' });
      
      return {
        mes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
        ordens: dados.ordens,
        tempo_medio: dados.tempo_medio
      };
    });
  })();
  
  const totalOrdens = ordensPorStatus.reduce((sum, item) => sum + item.total, 0);
  const totalOrdensFinalizadas = ordensPorStatus.find(item => item.name === "Finalizado")?.total || 0;
  const totalOrdensEntregues = ordensPorStatus.find(item => item.name === "Entregue")?.total || 0;
  const taxaFinalizacao = ((totalOrdensFinalizadas + totalOrdensEntregues) / (totalOrdens || 1)) * 100;
  
  // Cores para os gráficos
  const STATUS_COLORS = {
    'Orçamento': '#8B5CF6',
    'Aguardando': '#F97316',
    'Em Fabricação': '#0EA5E9',
    'Aguardando Peça (Cliente)': '#84cc16',
    'Aguardando Peça (Interno)': '#10b981',
    'Finalizado': '#14b8a6',
    'Entregue': '#22c55e'
  };
  
  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280';
  };
  
  const tiposServico = [
    { value: 'todos', label: 'Todos os tipos' },
    { value: 'bloco', label: 'Bloco' },
    { value: 'biela', label: 'Biela' },
    { value: 'cabecote', label: 'Cabeçote' },
    { value: 'virabrequim', label: 'Virabrequim' },
    { value: 'eixo_comando', label: 'Eixo de Comando' },
    { value: 'montagem', label: 'Montagem' },
    { value: 'dinamometro', label: 'Dinamômetro' },
    { value: 'lavagem', label: 'Lavagem' }
  ];
  
  const buscarOrdem = async (id: string) => {
    setIsLoading(true);
    try {
      const ordemRef = doc(db, "ordens", id);
      const ordemDoc = await getDoc(ordemRef);
      
      if (ordemDoc.exists()) {
        const data = ordemDoc.data();
        const ordem = {
          ...data,
          id: ordemDoc.id,
          dataAbertura: data.dataAbertura?.toDate() || new Date(),
          dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
        } as OrdemServico;
        
        setOrdemSelecionada(ordem);
      } else {
        setOrdemSelecionada(null);
      }
    } catch (error) {
      console.error("Erro ao buscar ordem:", error);
      setOrdemSelecionada(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Preparar dados para exportação CSV
  const prepararDadosExportacao = () => {
    return filteredOrdens.map(ordem => ({
      id: ordem.id,
      nome: ordem.nome,
      cliente: ordem.cliente.nome,
      status: getStatusLabel(ordem.status),
      dataAbertura: format(new Date(ordem.dataAbertura), 'dd/MM/yyyy'),
      dataPrevistaEntrega: format(new Date(ordem.dataPrevistaEntrega), 'dd/MM/yyyy'),
      quantidadeServicos: ordem.servicos?.length || 0,
      prioridade: ordem.prioridade || 'normal'
    }));
  };
  
  const renderOrdemDetalhes = () => {
    if (!ordemSelecionada) return null;
    
    const renderTempoEtapa = (etapa: EtapaOS) => {
      const etapaInfo = ordemSelecionada?.etapasAndamento[etapa];
      if (!etapaInfo) return "Não iniciada";
      
      if (etapaInfo.concluido) {
        if (etapaInfo.iniciado && etapaInfo.finalizado) {
          const tempoTotal = etapaInfo.finalizado.getTime() - etapaInfo.iniciado.getTime();
          return (
            <div>
              <div>Concluída em: {formatTime(tempoTotal)}</div>
              <div className="text-xs text-gray-500">
                Por: {etapaInfo.funcionarioNome || "Não atribuído"}
              </div>
            </div>
          );
        }
        return "Concluída";
      }
      
      if (etapaInfo.iniciado) {
        const agora = new Date();
        const tempoDecorrido = agora.getTime() - etapaInfo.iniciado.getTime();
        return (
          <div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-amber-500" />
              <span>Em andamento: {formatTime(tempoDecorrido)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Por: {etapaInfo.funcionarioNome || "Não atribuído"}
            </div>
          </div>
        );
      }
      
      return "Não iniciada";
    };
    
    return (
      <div className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Ordem #{ordemSelecionada.id}</CardTitle>
            <CardDescription>
              {ordemSelecionada.nome} - Cliente: {ordemSelecionada.cliente.nome}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Tempos por Etapa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Lavagem</CardTitle>
                    </CardHeader>
                    <CardContent>{renderTempoEtapa('lavagem')}</CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Inspeção Inicial</CardTitle>
                    </CardHeader>
                    <CardContent>{renderTempoEtapa('inspecao_inicial')}</CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Retífica</CardTitle>
                    </CardHeader>
                    <CardContent>{renderTempoEtapa('retifica')}</CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Montagem</CardTitle>
                    </CardHeader>
                    <CardContent>{renderTempoEtapa('montagem')}</CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Dinamômetro</CardTitle>
                    </CardHeader>
                    <CardContent>{renderTempoEtapa('dinamometro')}</CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Inspeção Final</CardTitle>
                    </CardHeader>
                    <CardContent>{renderTempoEtapa('inspecao_final')}</CardContent>
                  </Card>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Tempos por Serviço</h3>
                <div className="grid grid-cols-1 gap-4">
                  {ordemSelecionada.servicos.map((servico, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          {(() => {
                            switch(servico.tipo) {
                              case 'bloco': return 'Bloco';
                              case 'biela': return 'Biela';
                              case 'cabecote': return 'Cabeçote';
                              case 'virabrequim': return 'Virabrequim';
                              case 'eixo_comando': return 'Eixo de Comando';
                              case 'montagem': return 'Montagem';
                              case 'dinamometro': return 'Dinamômetro';
                              case 'lavagem': return 'Lavagem';
                              default: return servico.tipo;
                            }
                          })()}
                        </CardTitle>
                        <CardDescription>{servico.descricao}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <div>Status: {servico.concluido ? 'Concluído' : 'Em andamento'}</div>
                          {servico.concluido && servico.funcionarioNome && (
                            <div className="text-xs text-gray-500">
                              Concluído por: {servico.funcionarioNome}
                            </div>
                          )}
                          {servico.dataConclusao && (
                            <div className="text-xs text-gray-500">
                              Data de conclusão: {new Date(servico.dataConclusao).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center h-full">
          <p>Carregando dados dos relatórios...</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios de Produção</h1>
            <p className="text-muted-foreground">
              Acompanhe as métricas e estatísticas de produção da empresa
            </p>
          </div>
          <ExportButton 
            data={prepararDadosExportacao()} 
            fileName="relatorio_producao.csv"
            buttonText="Exportar Relatório"
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros e Pesquisa</CardTitle>
            <CardDescription>
              Refine os dados do relatório usando os filtros abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row w-full items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Select 
                  value={searchType} 
                  onValueChange={(value) => setSearchType(value as any)}
                  defaultValue="id"
                >
                  <SelectTrigger className="sm:w-[180px]">
                    <SelectValue placeholder="Tipo de pesquisa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Número da OS</SelectItem>
                    <SelectItem value="cliente">Nome do Cliente</SelectItem>
                    <SelectItem value="nome">Descrição da OS</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={`Pesquisar por ${
                      searchType === "id" ? "número da OS" : 
                      searchType === "cliente" ? "nome do cliente" : 
                      searchType === "nome" ? "descrição da OS" : 
                      "status"
                    }...`}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  disabled={!searchTerm.trim()}
                  onClick={() => {
                    if (filteredOrdens.length > 0) {
                      buscarOrdem(filteredOrdens[0].id);
                    }
                  }}
                >
                  Buscar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tipoServico">Tipo de Serviço</Label>
                  <Select 
                    value={tipoServicoFilter} 
                    onValueChange={setTipoServicoFilter}
                  >
                    <SelectTrigger id="tipoServico" className="w-full mt-1">
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposServico.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Select 
                    value={responsavelFilter} 
                    onValueChange={setResponsavelFilter}
                  >
                    <SelectTrigger id="responsavel" className="w-full mt-1">
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os funcionários</SelectItem>
                      {funcionarios.map(funcionario => (
                        <SelectItem key={funcionario.id} value={funcionario.id}>{funcionario.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Período</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy")
                          )
                        ) : (
                          <span>Selecione um período</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={new Date()}
                        selected={dateRange}
                        onSelect={setDateRange}
                        locale={ptBR}
                      />
                      <div className="p-3 border-t flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDateRange({from: undefined, to: undefined})}
                        >
                          Limpar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (document.activeElement instanceof HTMLElement) {
                              document.activeElement.blur();
                            }
                          }}
                        >
                          Aplicar
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {searchTerm && filteredOrdens.length > 0 && (
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {filteredOrdens.map((ordem) => (
                    <div
                      key={ordem.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => buscarOrdem(ordem.id)}
                    >
                      <div className="font-medium">OS #{ordem.id} - {ordem.nome}</div>
                      <div className="text-sm text-muted-foreground">Cliente: {ordem.cliente.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        Status: {getStatusLabel(ordem.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {(searchTerm || tipoServicoFilter !== "todos" || responsavelFilter !== "todos" || dateRange.from) && 
                filteredOrdens.length === 0 && (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                  Nenhuma ordem encontrada com os critérios informados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {ordemSelecionada && renderOrdemDetalhes()}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{filteredOrdens.reduce((acc, ordem) => acc + (ordem.servicos?.length || 0), 0)}</p>
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
                <p className="text-2xl font-bold">{filteredOrdens.length}</p>
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
                <p className="text-2xl font-bold">
                  {filteredOrdens.filter(ordem => ordem.status === 'finalizado' || ordem.status === 'entregue').length}
                </p>
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
                <p className="text-2xl font-bold">
                  {filteredOrdens.length > 0 
                    ? (filteredOrdens.filter(ordem => 
                        ordem.status === 'finalizado' || ordem.status === 'entregue'
                      ).length / filteredOrdens.length * 100).toFixed(2) 
                    : "0.00"}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="status" className="space-y-6">
          <TabsList>
            <TabsTrigger value="status">Ordens por Status</TabsTrigger>
            <TabsTrigger value="servicos">Serviços por Tipo</TabsTrigger>
            <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-6">
            <StatusChart 
              title="Ordens por Status" 
              description="Distribuição das ordens de serviço por status" 
              data={ordensPorStatus}
            />
          </TabsContent>
          
          <TabsContent value="servicos" className="space-y-6">
            <StatusChart 
              title="Serviços por Tipo" 
              description="Distribuição dos serviços por tipo" 
              data={servicosPorTipo}
            />
          </TabsContent>
          
          <TabsContent value="produtividade" className="space-y-6">
            <Card>
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
                    barGap={8}
                  >
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="ordens" name="Ordens Concluídas" fill="#8B5CF6" />
                    <Bar yAxisId="right" dataKey="tempo_medio" name="Tempo Médio (dias)" fill="#F97316" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RelatoriosProducao;
