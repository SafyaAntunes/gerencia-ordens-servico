import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, ActivitySquare, BarChart, Wrench, Search, Clock, Filter, Calendar } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, doc, getDoc, query, where, orderBy } from "firebase/firestore";
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
import { DateRange } from "react-day-picker";

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
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
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
        // Alterado para buscar da coleção correta 'ordens_servico' ao invés de 'ordens'
        const q = query(collection(db, "ordens_servico"), orderBy("dataAbertura", "desc"));
        const querySnapshot = await getDocs(q);
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
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      filtradas = filtradas.filter(ordem => {
        const dataAbertura = new Date(ordem.dataAbertura);
        return dataAbertura >= fromDate;
      });
    }
    
    if (dateRange?.to) {
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
  
  // Calcula serviços por tipo a partir dos dados reais
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
  
  // Calcula ordens por status a partir dos dados reais
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
        let nome = getStatusLabel(status);
        
        return {
          name: nome,
          total: quantidade
        };
      })
      .sort((a, b) => b.total - a.total); // Ordena por quantidade decrescente
  })();
  
  // Calcula produtividade mensal a partir dos dados reais
  const produtividadeMensal = (() => {
    const meses: Record<string, { ordens: number, tempo_medio: number, tempoTotal: number }> = {};
    const hoje = new Date();
    
    // Inicializa os últimos 6 meses
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
          
          // Calcular tempo médio real se disponível
          if (ordem.etapasAndamento) {
            let tempoTotal = 0;
            let etapasConcluidas = 0;
            
            Object.entries(ordem.etapasAndamento).forEach(([_, etapa]) => {
              if (etapa.concluido && etapa.iniciado && etapa.finalizado) {
                const tempoEtapa = etapa.finalizado.getTime() - etapa.iniciado.getTime();
                tempoTotal += tempoEtapa;
                etapasConcluidas++;
              }
            });
            
            // Converter para dias
            if (etapasConcluidas > 0) {
              const tempoMedioDias = tempoTotal / (1000 * 60 * 60 * 24 * etapasConcluidas);
              meses[mesAno].tempoTotal += tempoMedioDias;
            } else {
              // Fallback para um valor estimado se não houver dados reais
              meses[mesAno].tempoTotal += 2.5;
            }
          } else {
            // Fallback para um valor estimado se não houver dados de etapas
            meses[mesAno].tempoTotal += 2.5;
          }
        }
      }
    });
    
    // Calcular médias finais
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
  
  // Métricas de totais
  const totalOrdens = ordensDados.length;
  const totalOrdensFinalizadas = ordensDados.filter(ordem => ordem.status === 'finalizado').length;
  const totalOrdensEntregues = ordensDados.filter(ordem => ordem.status === 'entregue').length;
  const taxaFinalizacao = ((totalOrdensFinalizadas + totalOrdensEntregues) / (totalOrdens || 1)) * 100;
  
  // Cores para os gráficos
  const STATUS_COLORS = {
    'Orçamento': '#8B5CF6',
    'Aguardando Aprovação': '#F97316',
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
  
  // Função para buscar detalhes de uma ordem específica
  const buscarOrdem = async (id: string) => {
    setIsLoading(true);
    try {
      // Alterado para buscar da coleção correta 'ordens_servico'
      const ordemRef = doc(db, "ordens_servico", id);
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
  
  // Preparar dados para exportação CSV (em formato correto para CSV)
  const prepararDadosExportacao = () => {
    return filteredOrdens.map(ordem => ({
      id: ordem.id,
      nome: ordem.nome,
      cliente: ordem.cliente?.nome || 'Não informado',
      status: getStatusLabel(ordem.status),
      dataAbertura: ordem.dataAbertura ? format(new Date(ordem.dataAbertura), 'dd/MM/yyyy') : 'Não informada',
      dataPrevistaEntrega: ordem.dataPrevistaEntrega ? format(new Date(ordem.dataPrevistaEntrega), 'dd/MM/yyyy') : 'Não informada',
      quantidadeServicos: ordem.servicos?.length || 0,
      prioridade: ordem.prioridade || 'normal'
    }));
  };
  
  const renderOrdemDetalhes = () => {
    if (!ordemSelecionada) return null;
    
    const renderTempoEtapa = (etapa: EtapaOS) => {
      const etapaInfo = ordemSelecionada?.etapasAndamento[etapa];
      if (!etapaInfo) return "Não iniciada";
      
      // Calculando tempo estimado (exemplo, poderia ser baseado em alguma configuração)
      const tempoEstimadoEtapa = (() => {
        switch(etapa) {
          case 'lavagem': return 3600000; // 1 hora em ms
          case 'inspecao_inicial': return 7200000; // 2 horas em ms
          case 'retifica': return 28800000; // 8 horas em ms
          case 'montagem': return 14400000; // 4 horas em ms
          case 'dinamometro': return 10800000; // 3 horas em ms
          case 'inspecao_final': return 7200000; // 2 horas em ms
          default: return 7200000; // 2 horas em ms como padrão
        }
      })();
      
      if (etapaInfo.concluido) {
        if (etapaInfo.iniciado && etapaInfo.finalizado) {
          const tempoTotal = etapaInfo.finalizado.getTime() - etapaInfo.iniciado.getTime();
          const produtividade = Math.round((tempoEstimadoEtapa / tempoTotal) * 100);
          
          return (
            <div>
              <div className="flex flex-col">
                <div>Tempo estimado: {formatTime(tempoEstimadoEtapa)}</div>
                <div>Tempo registrado: {formatTime(tempoTotal)}</div>
                <div className={`font-semibold ${produtividade >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                  Produtividade: {produtividade}%
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
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
        const produtividadeAtual = Math.round((tempoDecorrido / tempoEstimadoEtapa) * 100);
        
        return (
          <div>
            <div className="flex flex-col">
              <div>Tempo estimado: {formatTime(tempoEstimadoEtapa)}</div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-amber-500" />
                <span>Tempo registrado: {formatTime(tempoDecorrido)}</span>
              </div>
              <div className={`font-semibold ${produtividadeAtual <= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                Produtividade: {produtividadeAtual > 100 ? '< 100' : produtividadeAtual}%
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Por: {etapaInfo.funcionarioNome || "Não atribuído"}
            </div>
          </div>
        );
      }
      
      return (
        <div>
          <div>Tempo estimado: {formatTime(tempoEstimadoEtapa)}</div>
          <div>Não iniciada</div>
        </div>
      );
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
                        {dateRange?.from ? (
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
                        className="pointer-events-auto"
                      />
                      <div className="p-3 border-t flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDateRange(undefined)}
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
              
              {(searchTerm || tipoServicoFilter !== "todos" || responsavelFilter !== "todos" || dateRange?.from) && 
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
          </TabsList>
          
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ordens por Status</CardTitle>
                <CardDescription>
                  Distribuição das ordens de serviço por status
                </CardDescription>
                <div className="w-full flex justify-end pt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-dashed"
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrar por Período
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <div className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Filtrar dados</h4>
                          <p className="text-sm text-muted-foreground">
                            Selecione o período para filtrar os dados
                          </p>
                        </div>
                        <div className="pt-4 pb-2">
                          <CalendarComponent
                            initialFocus
                            mode="range"
                            defaultMonth={new Date()}
                            selected={dateRange}
                            onSelect={setDateRange}
                            locale={ptBR}
                            className="rounded-md border"
                          />
                        </div>
                        <div className="flex items-center pt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => setDateRange(undefined)}
                          >
                            Limpar
                          </Button>
                          <Button size="sm">Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <StatusChart 
                  title="" 
                  description="" 
                  data={ordensPorStatus}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="servicos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Serviços por Tipo</CardTitle>
                <CardDescription>
                  Distribuição dos serviços por tipo
                </CardDescription>
                <div className="w-full flex justify-end pt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-dashed"
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrar por Período
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <div className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Filtrar dados</h4>
                          <p className="text-sm text-muted-foreground">
                            Selecione o período para filtrar os dados
                          </p>
                        </div>
                        <div className="pt-4 pb-2">
                          <CalendarComponent
                            initialFocus
                            mode="range"
                            defaultMonth={new Date()}
                            selected={dateRange}
                            onSelect={setDateRange}
                            locale={ptBR}
                            className="rounded-md border"
                          />
                        </div>
                        <div className="flex items-center pt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => setDateRange(undefined)}
                          >
                            Limpar
                          </Button>
                          <Button size="sm">Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <StatusChart 
                  title="" 
                  description="" 
                  data={servicosPorTipo}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RelatoriosProducao;
