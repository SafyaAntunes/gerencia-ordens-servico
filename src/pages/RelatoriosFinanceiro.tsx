import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, TrendingUp, Clock, CalendarDays, DollarSign, BadgeDollarSign, AlertTriangle, Wrench } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico } from "@/types/ordens";
import OrdemSearch from "@/components/ordens/OrdemSearch";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend
} from "recharts";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface RelatoriosFinanceiroProps extends LogoutProps {}

const RelatoriosFinanceiro = ({ onLogout }: RelatoriosFinanceiroProps) => {
  const [ordensDados, setOrdensDados] = useState<OrdemServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemServico | null>(null);
  const [activeTab, setActiveTab] = useState<"mensal" | "anual" | "detalhes">("mensal");
  
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
      } catch (error) {
        console.error("Erro ao buscar ordens:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrdens();
  }, []);
  
  const handleOrdemSearch = (ordem: OrdemServico | null) => {
    setSelectedOrdem(ordem);
    if (ordem) {
      setActiveTab("detalhes");
    }
  };
  
  const calcularValoresFinanceiros = () => {
    if (!selectedOrdem) return [];
    
    const valores: {
      nome: string;
      tipo: "etapa" | "servico";
      custoMaterial: number;
      custoEstimadoMaoDeObra: number;
      custoRealMaoDeObra: number;
      valorTotal: number;
      margemLucro: number;
      lucroBruto: number;
      status: "dentro" | "acima" | "abaixo";
    }[] = [];
    
    selectedOrdem.servicos.forEach(servico => {
      const custoEstimadoMaoDeObra = servico.subatividades
        ?.filter(sub => sub.selecionada)
        .reduce((sum, sub) => {
          const preco = sub.precoHora || 0;
          const tempo = sub.tempoEstimado || 0;
          return sum + (preco * tempo);
        }, 0) || 0;
      
      let custoRealMaoDeObra = 0;
      
      const storageKey = `timer_${selectedOrdem.id}_retifica_${servico.tipo}`;
      const data = localStorage.getItem(storageKey);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.totalTime) {
            const horasReais = parsed.totalTime / (1000 * 60 * 60);
            const taxaHora = servico.subatividades?.find(s => s.precoHora)?.precoHora || 120;
            custoRealMaoDeObra = horasReais * taxaHora;
          }
        } catch {
        }
      }
      
      const custoMaterial = Math.random() * 2000 + 500;
      const valorTotal = custoEstimadoMaoDeObra + custoMaterial + Math.random() * 1000;
      const lucroBruto = valorTotal - custoMaterial - custoRealMaoDeObra;
      const margemLucro = (lucroBruto / valorTotal) * 100;
      
      let status: "dentro" | "acima" | "abaixo" = "dentro";
      if (custoRealMaoDeObra > custoEstimadoMaoDeObra * 1.1) {
        status = "acima";
      } else if (custoRealMaoDeObra < custoEstimadoMaoDeObra * 0.9) {
        status = "abaixo";
      }
      
      valores.push({
        nome: formatarTipoServico(servico.tipo),
        tipo: "servico",
        custoMaterial,
        custoEstimadoMaoDeObra,
        custoRealMaoDeObra,
        valorTotal,
        margemLucro,
        lucroBruto,
        status
      });
    });
    
    const etapas = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    etapas.forEach(etapa => {
      if (selectedOrdem.etapasAndamento[etapa]) {
        const custoEstimadoMaoDeObra = Math.random() * 1000 + 200;
        
        let custoRealMaoDeObra = 0;
        let tempoReal = 0;
        
        const storageKey = `timer_${selectedOrdem.id}_${etapa}`;
        const data = localStorage.getItem(storageKey);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.totalTime) {
              tempoReal = parsed.totalTime;
              const horasReais = tempoReal / (1000 * 60 * 60);
              const taxaHora = 120;
              custoRealMaoDeObra = horasReais * taxaHora;
            }
          } catch {
          }
        }
        
        selectedOrdem.tempoRegistros?.forEach(reg => {
          if (reg.etapa === etapa && reg.inicio && reg.fim) {
            const duracao = new Date(reg.fim).getTime() - new Date(reg.inicio).getTime();
            tempoReal += duracao;
            const horasReais = duracao / (1000 * 60 * 60);
            custoRealMaoDeObra += horasReais * 120;
          }
        });
        
        const custoMaterial = Math.random() * 500;
        const valorTotal = custoEstimadoMaoDeObra + custoMaterial;
        const lucroBruto = valorTotal - custoMaterial - custoRealMaoDeObra;
        const margemLucro = (lucroBruto / valorTotal) * 100;
        
        let status: "dentro" | "acima" | "abaixo" = "dentro";
        if (custoRealMaoDeObra > custoEstimadoMaoDeObra * 1.1) {
          status = "acima";
        } else if (custoRealMaoDeObra < custoEstimadoMaoDeObra * 0.9) {
          status = "abaixo";
        }
        
        valores.push({
          nome: formatarEtapa(etapa),
          tipo: "etapa",
          custoMaterial,
          custoEstimadoMaoDeObra,
          custoRealMaoDeObra,
          valorTotal,
          margemLucro,
          lucroBruto,
          status
        });
      }
    });
    
    return valores;
  };
  
  const calcularTotaisOS = () => {
    const valores = calcularValoresFinanceiros();
    return {
      custoMaterial: valores.reduce((sum, item) => sum + item.custoMaterial, 0),
      custoEstimadoMaoDeObra: valores.reduce((sum, item) => sum + item.custoEstimadoMaoDeObra, 0),
      custoRealMaoDeObra: valores.reduce((sum, item) => sum + item.custoRealMaoDeObra, 0),
      valorTotal: valores.reduce((sum, item) => sum + item.valorTotal, 0),
      lucroBruto: valores.reduce((sum, item) => sum + item.lucroBruto, 0)
    };
  };
  
  const formatarEtapa = (etapaKey: string): string => {
    const labels: Record<string, string> = {
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      retifica: "Retífica",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_final: "Inspeção Final"
    };
    return labels[etapaKey] || etapaKey;
  };
  
  const formatarTipoServico = (tipo: string): string => {
    return tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ');
  };
  
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const formatarPorcentagem = (valor: number) => {
    return valor.toFixed(2) + '%';
  };
  
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
  
  const totaisOS = selectedOrdem ? calcularTotaisOS() : {
    custoMaterial: 0,
    custoEstimadoMaoDeObra: 0,
    custoRealMaoDeObra: 0,
    valorTotal: 0,
    lucroBruto: 0
  };
  
  const margemLucroOS = totaisOS.valorTotal ? (totaisOS.lucroBruto / totaisOS.valorTotal) * 100 : 0;
  
  const statusOSGeral = (() => {
    if (totaisOS.custoRealMaoDeObra > totaisOS.custoEstimadoMaoDeObra * 1.1) {
      return { status: "acima", texto: "Acima do orçamento", classe: "text-red-600" };
    } else if (totaisOS.custoRealMaoDeObra < totaisOS.custoEstimadoMaoDeObra * 0.9) {
      return { status: "abaixo", texto: "Abaixo do orçamento", classe: "text-green-600" };
    } else {
      return { status: "dentro", texto: "Dentro do orçamento", classe: "text-amber-600" };
    }
  })();
  
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
        
        <OrdemSearch 
          ordens={ordensDados} 
          onSearch={handleOrdemSearch} 
          placeholder="Buscar OS por ID ou nome para ver detalhes financeiros..."
        />
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "mensal" | "anual" | "detalhes")}>
          <TabsList className="mb-6">
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="anual">Anual</TabsTrigger>
            <TabsTrigger value="detalhes" disabled={!selectedOrdem}>Detalhes Financeiros</TabsTrigger>
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
          
          <TabsContent value="detalhes">
            {selectedOrdem ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Detalhes Financeiros - OS #{selectedOrdem.id.slice(-5)}
                    </CardTitle>
                    <CardDescription>
                      {selectedOrdem.nome} - Cliente: {selectedOrdem.cliente.nome}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="text-xl font-bold">
                          {formatarValor(totaisOS.valorTotal)}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-muted-foreground">Custo Material</p>
                        <p className="text-xl font-bold">
                          {formatarValor(totaisOS.custoMaterial)}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-muted-foreground">Mão de Obra Real</p>
                        <p className="text-xl font-bold">
                          {formatarValor(totaisOS.custoRealMaoDeObra)}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-muted-foreground">Lucro Bruto</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatarValor(totaisOS.lucroBruto)} ({formatarPorcentagem(margemLucroOS)})
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Status da Execução</CardTitle>
                            <span className={`font-medium ${statusOSGeral.classe}`}>
                              {statusOSGeral.texto}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between mb-1 text-sm">
                                <span>Custo Estimado: {formatarValor(totaisOS.custoEstimadoMaoDeObra)}</span>
                                <span>Custo Real: {formatarValor(totaisOS.custoRealMaoDeObra)}</span>
                              </div>
                              <Progress 
                                value={(totaisOS.custoRealMaoDeObra / totaisOS.custoEstimadoMaoDeObra) * 100} 
                                className="h-2"
                                indicatorClassName={
                                  statusOSGeral.status === "dentro" ? "bg-amber-500" : 
                                  statusOSGeral.status === "abaixo" ? "bg-green-500" : "bg-red-500"
                                }
                              />
                            </div>
                            
                            {statusOSGeral.status === "acima" && (
                              <p className="text-xs flex items-center text-red-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Custo real acima do estimado em {formatarPorcentagem(
                                  ((totaisOS.custoRealMaoDeObra - totaisOS.custoEstimadoMaoDeObra) / totaisOS.custoEstimadoMaoDeObra) * 100
                                )}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Table>
                      <TableCaption>Detalhamento financeiro por etapa e serviço</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Etapa/Serviço</TableHead>
                          <TableHead>Custo Material</TableHead>
                          <TableHead>Mão de Obra (Est.)</TableHead>
                          <TableHead>Mão de Obra (Real)</TableHead>
                          <TableHead>Valor Total</TableHead>
                          <TableHead>Lucro Bruto</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calcularValoresFinanceiros().map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <span className="flex items-center">
                                {item.tipo === "etapa" ? 
                                  <BadgeDollarSign className="h-4 w-4 mr-1 text-blue-500" /> : 
                                  <Wrench className="h-4 w-4 mr-1 text-purple-500" />
                                }
                                {item.nome}
                              </span>
                            </TableCell>
                            <TableCell>{formatarValor(item.custoMaterial)}</TableCell>
                            <TableCell>{formatarValor(item.custoEstimadoMaoDeObra)}</TableCell>
                            <TableCell>{formatarValor(item.custoRealMaoDeObra)}</TableCell>
                            <TableCell>{formatarValor(item.valorTotal)}</TableCell>
                            <TableCell>
                              <span className={item.lucroBruto >= 0 ? "text-green-600" : "text-red-600"}>
                                {formatarValor(item.lucroBruto)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span 
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === "dentro" 
                                    ? "bg-amber-100 text-amber-800" 
                                    : item.status === "abaixo" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {
                                  item.status === "dentro" ? "Dentro" : 
                                  item.status === "abaixo" ? "Abaixo" : "Acima"
                                }
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <FileBarChart className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Busque uma OS específica para ver os detalhes financeiros
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RelatoriosFinanceiro;
