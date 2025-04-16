
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, TrendingUp, Clock, Search, AlertCircle, CheckCircle, Layers } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, EtapaOS, SubAtividade, TipoServico } from "@/types/ordens";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getSubatividades } from "@/services/subatividadeService";
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

interface RelatoriosFinanceiroProps extends LogoutProps {}

// Cores para o gráfico de pizza
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE'];

const RelatoriosFinanceiro = ({ onLogout }: RelatoriosFinanceiroProps) => {
  const [ordensDados, setOrdensDados] = useState<OrdemServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemServico | null>(null);
  const [filteredOrdens, setFilteredOrdens] = useState<OrdemServico[]>([]);
  const [activeTab, setActiveTab] = useState("mensal");
  const [subatividades, setSubatividades] = useState<Record<TipoServico, SubAtividade[]>>({
    bloco: [],
    biela: [],
    cabecote: [],
    virabrequim: [],
    eixo_comando: [],
    montagem: [],
    dinamometro: [],
    lavagem: [],
  });
  
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
    
    const fetchSubatividades = async () => {
      try {
        const subatividadesData = await getSubatividades();
        setSubatividades(subatividadesData);
      } catch (error) {
        console.error("Erro ao buscar subatividades:", error);
      }
    };
    
    fetchOrdens();
    fetchSubatividades();
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
    const lucroBruto = valorTotal - custoTotal;
    
    return {
      custoTotal,
      valorTotal,
      lucro: lucroBruto,
      margemLucro,
      payback: custoTotal > 0 ? valorTotal / custoTotal : 0
    };
  };
  
  // Calcular o tempo previsto e o tempo real gasto na OS
  const calcularTempoOS = (ordem: OrdemServico) => {
    // Tempo previsto total (em horas) - simulado
    const tempoPrevisto = 15; // 15 horas
    
    // Calcular tempo real com base nas etapas concluídas
    let tempoRealTotal = 0;
    const etapas = ordem.etapasAndamento || {};
    
    Object.entries(etapas).forEach(([_, etapa]) => {
      if (etapa.iniciado && etapa.finalizado) {
        const horasGastas = (etapa.finalizado.getTime() - etapa.iniciado.getTime()) / 3600000;
        tempoRealTotal += horasGastas;
      }
    });
    
    // Calcular eficiência
    const eficiencia = tempoPrevisto > 0 ? (tempoPrevisto / (tempoRealTotal || tempoPrevisto)) * 100 : 0;
    
    return {
      tempoPrevisto,
      tempoReal: tempoRealTotal,
      eficiencia: Math.min(eficiencia, 100) // Limitar a 100%
    };
  };
  
  // Função para preparar dados do gráfico de subatividades
  const prepararDadosSubatividades = (ordem: OrdemServico) => {
    // Dados para o gráfico de custos por subatividade
    const dadosCustos: { name: string; value: number; color: string }[] = [];
    // Dados para o gráfico de lucro por subatividade
    const dadosLucro: { name: string; lucro: number }[] = [];
    // Dados para a tabela de subatividades
    const tabelaSubatividades: {
      grupo: string;
      servico: string;
      subatividade: string;
      valor: number;
      custo: number;
      lucro: number;
      margem: number;
    }[] = [];
    
    // Se não houver serviços, retornar arrays vazios
    if (!ordem.servicos || ordem.servicos.length === 0) {
      return { dadosCustos, dadosLucro, tabelaSubatividades };
    }
    
    // Mapear subatividades mais lucrativas e onerosas
    let subatividadeMaisLucrativa = { nome: "", lucro: 0 };
    let subatividadeMaisOnerosa = { nome: "", custo: 0 };
    
    // Para cada serviço na ordem
    ordem.servicos.forEach((servico) => {
      // Nome do serviço baseado no tipo
      const nomeServico = (() => {
        switch (servico.tipo) {
          case "bloco": return "Planejamento";
          case "biela": return "Jateamento";
          case "cabecote": return "Retífica";
          case "virabrequim": return "Retífica";
          case "eixo_comando": return "Acabamento";
          case "montagem": return "Montagem";
          case "dinamometro": return "Dinamômetro";
          case "lavagem": return "Lavagem";
          default: return servico.tipo;
        }
      })();
      
      // Para cada subatividade no serviço
      (servico.subatividades || []).forEach((subatividade) => {
        // Simular valor e custo para cada subatividade
        const custoHora = subatividade.precoHora || 100;
        const horasGastas = Math.random() * 2 + 0.5; // Entre 0.5 e 2.5 horas
        const custo = custoHora * horasGastas;
        const valor = custo * 1.4; // 40% de margem
        const lucro = valor - custo;
        const margem = (lucro / valor) * 100;
        
        // Adicionar à tabela
        tabelaSubatividades.push({
          grupo: (() => {
            switch (servico.tipo) {
              case "bloco": return "Bloco";
              case "biela": return "Biela";
              case "cabecote": return "Cabeçote";
              case "virabrequim": return "Virabrequim";
              case "eixo_comando": return "Eixo Comando";
              case "montagem": return "Montagem";
              case "dinamometro": return "Dinamômetro";
              case "lavagem": return "Lavagem";
              default: return servico.tipo;
            }
          })(),
          servico: nomeServico,
          subatividade: subatividade.nome,
          valor,
          custo,
          lucro,
          margem
        });
        
        // Verificar se é a mais lucrativa ou onerosa
        if (lucro > subatividadeMaisLucrativa.lucro) {
          subatividadeMaisLucrativa = { nome: subatividade.nome, lucro };
        }
        
        if (custo > subatividadeMaisOnerosa.custo) {
          subatividadeMaisOnerosa = { nome: subatividade.nome, custo };
        }
        
        // Adicionar aos dados do gráfico de custos
        const indexCusto = dadosCustos.findIndex(item => item.name === subatividade.nome);
        if (indexCusto === -1) {
          dadosCustos.push({
            name: subatividade.nome,
            value: custo,
            color: COLORS[dadosCustos.length % COLORS.length]
          });
        } else {
          dadosCustos[indexCusto].value += custo;
        }
        
        // Adicionar aos dados do gráfico de lucro
        const indexLucro = dadosLucro.findIndex(item => item.name === subatividade.nome);
        if (indexLucro === -1) {
          dadosLucro.push({
            name: subatividade.nome,
            lucro
          });
        } else {
          dadosLucro[indexLucro].lucro += lucro;
        }
      });
    });
    
    return { 
      dadosCustos, 
      dadosLucro, 
      tabelaSubatividades,
      subatividadeMaisLucrativa,
      subatividadeMaisOnerosa
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
    const temposOS = calcularTempoOS(ordemSelecionada);
    const dadosSubatividades = prepararDadosSubatividades(ordemSelecionada);
    
    // Número de etapas concluídas
    const etapasConcluidas = Object.values(ordemSelecionada.etapasAndamento || {})
      .filter(etapa => etapa.concluido).length;
    
    return (
      <div className="space-y-6 mt-6">
        {/* Resumo da OS */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Ordem de Serviço</CardTitle>
            <CardDescription>
              OS #{ordemSelecionada.id} - {ordemSelecionada.nome} | Cliente: {ordemSelecionada.cliente.nome}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data de Abertura</p>
                <p className="font-medium">{formatDate(ordemSelecionada.dataAbertura)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status Geral</p>
                <p className="font-medium flex items-center">
                  <Badge variant={ordemSelecionada.status === "concluida" ? "success" : "default"} className="mr-1">
                    {ordemSelecionada.status === "concluida" ? "Concluída" : "Em andamento"}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsável Geral</p>
                <p className="font-medium">{ordemSelecionada.responsavel?.nome || "Não atribuído"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Estimada de Entrega</p>
                <p className="font-medium">{formatDate(ordemSelecionada.dataPrevistaEntrega)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Produtividade da OS */}
        <Card>
          <CardHeader>
            <CardTitle>Produtividade da OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Total Previsto</p>
                <p className="font-medium">{temposOS.tempoPrevisto}h</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Real Gasto</p>
                <p className="font-medium">{temposOS.tempoReal.toFixed(2)}h</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Eficiência</p>
                <p className="font-medium">{temposOS.eficiencia.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Etapas Concluídas</p>
                <p className="font-medium">{etapasConcluidas} de 6</p>
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-1">Progresso de Eficiência</p>
              <Progress value={temposOS.eficiencia} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        {/* Indicador de Rentabilidade */}
        <Card>
          <CardHeader>
            <CardTitle>Indicador de Rentabilidade da OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Custo Total Real</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totaisOrdem.custoTotal)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Valor Faturado ao Cliente</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totaisOrdem.valorTotal)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totaisOrdem.lucro)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                <p className={`text-xl font-bold ${totaisOrdem.margemLucro >= 30 ? 'text-green-600' : 'text-amber-600'}`}>
                  {totaisOrdem.margemLucro.toFixed(2)}%
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Payback</p>
                <p className="text-xl font-bold">
                  {totaisOrdem.payback.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Relatório Financeiro */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Relatório Financeiro</CardTitle>
              <CardDescription>
                Detalhamento financeiro por subatividade
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Tabela de subatividades */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Grupo</th>
                      <th className="p-2 text-left">Serviço</th>
                      <th className="p-2 text-left">Subatividade</th>
                      <th className="p-2 text-right">Valor (R$)</th>
                      <th className="p-2 text-right">Custo (R$)</th>
                      <th className="p-2 text-right">Lucro (R$)</th>
                      <th className="p-2 text-right">Margem (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosSubatividades.tabelaSubatividades.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.grupo}</td>
                        <td className="p-2">{item.servico}</td>
                        <td className="p-2">{item.subatividade}</td>
                        <td className="p-2 text-right">{formatCurrency(item.valor)}</td>
                        <td className="p-2 text-right">{formatCurrency(item.custo)}</td>
                        <td className="p-2 text-right">{formatCurrency(item.lucro)}</td>
                        <td className={`p-2 text-right ${item.margem >= 30 ? 'text-green-600' : 'text-amber-600'}`}>
                          {item.margem.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted font-medium">
                      <td colSpan={3} className="p-2 text-right">Total</td>
                      <td className="p-2 text-right">
                        {formatCurrency(dadosSubatividades.tabelaSubatividades.reduce((sum, item) => sum + item.valor, 0))}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(dadosSubatividades.tabelaSubatividades.reduce((sum, item) => sum + item.custo, 0))}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(dadosSubatividades.tabelaSubatividades.reduce((sum, item) => sum + item.lucro, 0))}
                      </td>
                      <td className="p-2 text-right">
                        {(dadosSubatividades.tabelaSubatividades.reduce((sum, item) => sum + item.lucro, 0) / 
                          dadosSubatividades.tabelaSubatividades.reduce((sum, item) => sum + item.valor, 0) * 100).toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Métricas de subatividades */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-sm font-medium flex items-center">
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Subatividade mais lucrativa:
                    </p>
                    <p className="ml-5 font-bold">
                      {dadosSubatividades.subatividadeMaisLucrativa.nome} ({formatCurrency(dadosSubatividades.subatividadeMaisLucrativa.lucro)})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Subatividade mais onerosa:
                    </p>
                    <p className="ml-5 font-bold">
                      {dadosSubatividades.subatividadeMaisOnerosa.nome} ({formatCurrency(dadosSubatividades.subatividadeMaisOnerosa.custo)})
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Gráficos de análise */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gráfico de distribuição de custos */}
                <div className="h-[300px]">
                  <h3 className="text-sm font-medium mb-4">Distribuição de Custos</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosSubatividades.dadosCustos}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dadosSubatividades.dadosCustos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Gráfico de lucro por subatividade */}
                <div className="h-[300px]">
                  <h3 className="text-sm font-medium mb-4">Lucro por Subatividade</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={dadosSubatividades.dadosLucro}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="lucro" fill="#82ca9d" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Custos por Etapa</CardTitle>
            <CardDescription>
              Análise de custos e margens por etapa do processo
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                          {formatCurrency(custo)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Cobrado</p>
                        <p className="font-medium">
                          {formatCurrency(valor)}
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
  
  // Adicionar página de subatividades ao relatório financeiro
  const renderSubatividadeConfig = () => {
    const [tipoSelecionado, setTipoSelecionado] = useState<TipoServico>("bloco");
    const subatividadesTipo = subatividades[tipoSelecionado] || [];
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Análise de Subatividades
            </CardTitle>
            <CardDescription>
              Visualize o desempenho financeiro de cada subatividade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bloco" onValueChange={(value) => setTipoSelecionado(value as TipoServico)}>
              <TabsList className="mb-4 flex flex-wrap">
                <TabsTrigger value="bloco">Bloco</TabsTrigger>
                <TabsTrigger value="biela">Biela</TabsTrigger>
                <TabsTrigger value="cabecote">Cabeçote</TabsTrigger>
                <TabsTrigger value="virabrequim">Virabrequim</TabsTrigger>
                <TabsTrigger value="eixo_comando">Eixo Comando</TabsTrigger>
                <TabsTrigger value="montagem">Montagem</TabsTrigger>
                <TabsTrigger value="dinamometro">Dinamômetro</TabsTrigger>
                <TabsTrigger value="lavagem">Lavagem</TabsTrigger>
              </TabsList>
              
              <TabsContent value={tipoSelecionado}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Subatividade</th>
                        <th className="text-right p-2">Preço Hora</th>
                        <th className="text-right p-2">Rentabilidade Média</th>
                        <th className="text-right p-2">Utilização</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subatividadesTipo.length > 0 ? (
                        subatividadesTipo.map((sub, index) => (
                          <tr key={sub.id} className="border-b">
                            <td className="p-2">{sub.nome}</td>
                            <td className="text-right p-2">{formatCurrency(sub.precoHora || 0)}</td>
                            <td className="text-right p-2">{(Math.random() * 30 + 20).toFixed(2)}%</td>
                            <td className="text-right p-2">{Math.floor(Math.random() * 50 + 10)} ordens</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground">
                            Nenhuma subatividade cadastrada para este tipo de serviço
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Análise de Rentabilidade</h3>
                  
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={subatividadesTipo.map(sub => ({
                          name: sub.nome,
                          precoHora: sub.precoHora || 0,
                          custoHora: (sub.precoHora || 0) * 0.6,
                          lucroHora: (sub.precoHora || 0) * 0.4
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="precoHora" name="Preço Hora" fill="#8884d8" />
                        <Bar dataKey="custoHora" name="Custo Hora" fill="#f43f5e" />
                        <Bar dataKey="lucroHora" name="Lucro Hora" fill="#4ade80" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };
  
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
        
        {/* Página de análise de subatividades */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="anual">Anual</TabsTrigger>
            <TabsTrigger value="subatividades">Subatividades</TabsTrigger>
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
                    {formatCurrency(totalReceitasMensais)}
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
                    {formatCurrency(totalDespesasMensais)}
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
                    {formatCurrency(lucroMensal)}
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
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
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
                    {formatCurrency(totalReceitasAnuais)}
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
                    {formatCurrency(totalDespesasAnuais)}
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
                    {formatCurrency(lucroAnual)}
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
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="#4f46e5" />
                    <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subatividades">
            {renderSubatividadeConfig()}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RelatoriosFinanceiro;
