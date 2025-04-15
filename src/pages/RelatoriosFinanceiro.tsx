
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, TrendingUp, Clock, Search, AlertCircle, CheckCircle } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS } from "@/types/ordens";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend
} from "recharts";

interface RelatoriosFinanceiroProps extends LogoutProps {}

const RelatoriosFinanceiro = ({ onLogout }: RelatoriosFinanceiroProps) => {
  const [ordensDados, setOrdensDados] = useState<OrdemServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemServico | null>(null);
  const [filteredOrdens, setFilteredOrdens] = useState<OrdemServico[]>([]);
  const [activeTab, setActiveTab] = useState("mensal");
  
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
  
  // Filtrar ordens com base no termo de pesquisa
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrdens(ordensDados);
      return;
    }
    
    const filtradas = ordensDados.filter(ordem => 
      ordem.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ordem.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ordem.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredOrdens(filtradas);
  }, [searchTerm, ordensDados]);
  
  // Gerar dados financeiros baseados nas ordens reais
  // Como não temos dados financeiros reais, vamos simular baseado no número de serviços
  const dadosMensais = (() => {
    const meses: Record<string, { receita: number, despesas: number }> = {};
    const hoje = new Date();
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
      meses[mesAno] = { receita: 0, despesas: 0 };
    }
    
    // Preencher com dados simulados baseados nas ordens
    ordensDados.forEach(ordem => {
      if (ordem.dataAbertura) {
        const data = new Date(ordem.dataAbertura);
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
        
        if (meses[mesAno]) {
          // Simular receita baseada nos serviços
          const valorServicos = ordem.servicos?.length || 0;
          meses[mesAno].receita += valorServicos * 5000; // Valor médio por serviço
          meses[mesAno].despesas += valorServicos * 3000; // Custo médio por serviço
        }
      }
    });
    
    // Converter para array e formatar nome do mês
    return Object.entries(meses).map(([mesAno, dados]) => {
      const [mes, ano] = mesAno.split('/');
      const nomeMes = new Date(parseInt(ano), parseInt(mes) - 1, 1)
        .toLocaleDateString('pt-BR', { month: 'long' });
      
      return {
        mes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
        receita: dados.receita,
        despesas: dados.despesas
      };
    });
  })();
  
  const dadosAnuais = (() => {
    const anos: Record<number, { receita: number, despesas: number }> = {};
    const anoAtual = new Date().getFullYear();
    
    // Inicializar últimos 3 anos
    for (let i = 2; i >= 0; i--) {
      const ano = anoAtual - i;
      anos[ano] = { receita: 0, despesas: 0 };
    }
    
    // Preencher com dados simulados
    ordensDados.forEach(ordem => {
      if (ordem.dataAbertura) {
        const ano = new Date(ordem.dataAbertura).getFullYear();
        
        if (anos[ano]) {
          // Simular receita baseada nos serviços
          const valorServicos = ordem.servicos?.length || 0;
          anos[ano].receita += valorServicos * 5000; // Valor médio por serviço
          anos[ano].despesas += valorServicos * 3000; // Custo médio por serviço
        }
      }
    });
    
    // Converter para array
    return Object.entries(anos).map(([ano, dados]) => ({
      ano: parseInt(ano),
      receita: dados.receita,
      despesas: dados.despesas
    }));
  })();
  
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
  
  // Função para buscar uma ordem específica
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
  
  // Função para calcular custo estimado por etapa
  const calcularCustoEtapa = (etapa: EtapaOS, ordem: OrdemServico): number => {
    const custoHora = 120; // Custo por hora em R$
    
    // Simulação: cada etapa tem um tempo médio diferente
    const tempoMedioPorEtapa: Record<EtapaOS, number> = {
      lavagem: 1, // 1 hora
      inspecao_inicial: 2, // 2 horas
      retifica: 8, // 8 horas
      montagem: 6, // 6 horas
      dinamometro: 3, // 3 horas
      inspecao_final: 1 // 1 hora
    };
    
    const etapaInfo = ordem.etapasAndamento[etapa];
    
    // Se a etapa não foi iniciada, retornar custo estimado
    if (!etapaInfo || !etapaInfo.iniciado) {
      return tempoMedioPorEtapa[etapa] * custoHora;
    }
    
    // Se a etapa foi concluída, calcular com base no tempo real
    if (etapaInfo.concluido && etapaInfo.iniciado && etapaInfo.finalizado) {
      const tempoReal = (etapaInfo.finalizado.getTime() - etapaInfo.iniciado.getTime()) / 3600000; // Converter para horas
      return tempoReal * custoHora;
    }
    
    // Se está em andamento, calcular tempo até agora
    const tempoAteAgora = (new Date().getTime() - etapaInfo.iniciado.getTime()) / 3600000; // Converter para horas
    return tempoAteAgora * custoHora;
  };
  
  // Função para calcular valor estimado por etapa (quanto deveria cobrar)
  const calcularValorEtapa = (etapa: EtapaOS, ordem: OrdemServico): number => {
    const custoEtapa = calcularCustoEtapa(etapa, ordem);
    // Margem de 60% sobre o custo
    return custoEtapa * 1.6;
  };
  
  // Função para verificar se etapa está dentro do orçamento
  const etapaDentroOrcamento = (etapa: EtapaOS, ordem: OrdemServico): boolean => {
    const custoEtapa = calcularCustoEtapa(etapa, ordem);
    const valorEstimado = calcularValorEtapa(etapa, ordem);
    
    // Se o custo está abaixo de 80% do valor estimado, está bem
    return custoEtapa < (valorEstimado * 0.8);
  };
  
  // Calcular total e margem geral da ordem
  const calcularTotaisOrdem = (ordem: OrdemServico) => {
    const etapas: EtapaOS[] = ['lavagem', 'inspecao_inicial', 'retifica', 'montagem', 'dinamometro', 'inspecao_final'];
    
    let custoTotal = 0;
    let valorTotal = 0;
    
    etapas.forEach(etapa => {
      custoTotal += calcularCustoEtapa(etapa, ordem);
      valorTotal += calcularValorEtapa(etapa, ordem);
    });
    
    const margemLucro = ((valorTotal - custoTotal) / valorTotal) * 100;
    
    return {
      custoTotal,
      valorTotal,
      lucro: valorTotal - custoTotal,
      margemLucro
    };
  };
  
  // Renderizar detalhes financeiros da ordem selecionada
  const renderOrdemDetalhesFinanceiros = () => {
    if (!ordemSelecionada) return null;
    
    const etapas: { id: EtapaOS; nome: string }[] = [
      { id: 'lavagem', nome: 'Lavagem' },
      { id: 'inspecao_inicial', nome: 'Inspeção Inicial' },
      { id: 'retifica', nome: 'Retífica' },
      { id: 'montagem', nome: 'Montagem' },
      { id: 'dinamometro', nome: 'Dinamômetro' },
      { id: 'inspecao_final', nome: 'Inspeção Final' }
    ];
    
    const totaisOrdem = calcularTotaisOrdem(ordemSelecionada);
    
    return (
      <div className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Análise Financeira da Ordem #{ordemSelecionada.id}</CardTitle>
            <CardDescription>
              {ordemSelecionada.nome} - Cliente: {ordemSelecionada.cliente.nome}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    R$ {totaisOrdem.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    R$ {totaisOrdem.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${totaisOrdem.margemLucro >= 30 ? 'text-green-600' : 'text-amber-600'}`}>
                    {totaisOrdem.margemLucro.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Custos por Etapa</h3>
            <div className="space-y-6">
              {etapas.map(etapa => {
                const custo = calcularCustoEtapa(etapa.id, ordemSelecionada);
                const valor = calcularValorEtapa(etapa.id, ordemSelecionada);
                const dentroOrcamento = etapaDentroOrcamento(etapa.id, ordemSelecionada);
                const etapaInfo = ordemSelecionada.etapasAndamento[etapa.id];
                const status = etapaInfo?.concluido ? 'Concluída' : etapaInfo?.iniciado ? 'Em andamento' : 'Não iniciada';
                const margem = ((valor - custo) / valor) * 100;
                
                return (
                  <div key={etapa.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{etapa.nome}</h4>
                      <div className="flex items-center">
                        {dentroOrcamento ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500 mr-1" />
                        )}
                        <span className={dentroOrcamento ? 'text-green-500' : 'text-amber-500'}>
                          {dentroOrcamento ? 'Dentro do orçamento' : 'Acima do orçamento'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Custo Real/Estimado</p>
                        <p className="font-medium">
                          R$ {custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Cobrado</p>
                        <p className="font-medium">
                          R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Margem</p>
                        <p className={`font-medium ${margem >= 30 ? 'text-green-600' : 'text-amber-600'}`}>
                          {margem.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Status: {status}</span>
                        <span>
                          {etapaInfo?.funcionarioNome ? `Responsável: ${etapaInfo.funcionarioNome}` : 'Sem responsável'}
                        </span>
                      </div>
                      
                      <Progress 
                        value={margem} 
                        max={100}
                        className={`h-2 ${margem >= 30 ? 'bg-green-100' : 'bg-amber-100'}`}
                      />
                    </div>
                  </div>
                );
              })}
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Acompanhe as métricas e estatísticas financeiras do seu negócio
          </p>
        </div>
        
        {/* Barra de pesquisa de ordens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pesquisar Ordem de Serviço</CardTitle>
            <CardDescription>
              Busque por ID, nome ou cliente para ver análise financeira detalhada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex w-full items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por ID, nome ou cliente..."
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
              
              {searchTerm && filteredOrdens.length > 0 && (
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {filteredOrdens.map((ordem) => (
                    <div
                      key={ordem.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => buscarOrdem(ordem.id)}
                    >
                      <div className="font-medium">OS #{ordem.id} - {ordem.nome}</div>
                      <div className="text-sm text-muted-foreground">Cliente: {ordem.cliente.nome}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Detalhes financeiros da ordem selecionada */}
        {ordemSelecionada && renderOrdemDetalhesFinanceiros()}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
    </Layout>
  );
};

export default RelatoriosFinanceiro;
