
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell,
  LabelList
} from "recharts";
import { 
  Clock, 
  Timer, 
  TrendingUp, 
  TrendingDown, 
  UserCheck, 
  BarChart2 
} from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, Servico, SubAtividade } from "@/types/ordens";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { calculateElapsedTime, formatTime } from "@/utils/timerUtils";

interface ProdutividadeProps extends LogoutProps {}

// Dados para análise de produtividade
interface DadosProdutividade {
  id: string;
  servico: string;
  tipoServico: string;
  cliente: string;
  tempoEstimado: number; // em milissegundos
  tempoReal: number; // em milissegundos
  eficiencia: number; // percentual (100 = estimado = real, <100 = mais rápido, >100 = mais lento)
  funcionario?: string;
  dataFinalizacao?: Date;
  valorEstimado: number;
  valorReal: number;
}

const Produtividade = ({ onLogout }: ProdutividadeProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dadosProdutividade, setDadosProdutividade] = useState<DadosProdutividade[]>([]);
  const [periodoFiltro, setPeriodoFiltro] = useState<'7dias' | '30dias' | 'todos'>('30dias');
  const { funcionario } = useAuth();

  // Carregar dados de produtividade das ordens
  useEffect(() => {
    const carregarDados = async () => {
      setIsLoading(true);
      try {
        // Definir período de busca
        const agora = new Date();
        let dataLimite: Date | null = null;
        
        if (periodoFiltro === '7dias') {
          dataLimite = new Date(agora);
          dataLimite.setDate(agora.getDate() - 7);
        } else if (periodoFiltro === '30dias') {
          dataLimite = new Date(agora);
          dataLimite.setDate(agora.getDate() - 30);
        }
        
        // Criar query base
        let ordensQuery = collection(db, "ordens");
        
        // Filtrar por funcionário se não for admin ou gerente
        if (funcionario && funcionario.nivelPermissao !== 'admin' && funcionario.nivelPermissao !== 'gerente') {
          // Aqui seria necessário adaptar a query para filtrar por funcionário
          // Como a estrutura exata não está disponível, este é um placeholder
          console.log("Filtrando por funcionário:", funcionario.id);
        }
        
        const querySnapshot = await getDocs(ordensQuery);
        
        const dados: DadosProdutividade[] = [];
        
        querySnapshot.forEach((doc) => {
          const ordem = doc.data() as OrdemServico;
          const dataFinalizacao = ordem.etapasAndamento?.finalizado?.finalizado 
            ? new Date(ordem.etapasAndamento.finalizado.finalizado) 
            : null;
          
          // Filtrar por período se necessário
          if (dataLimite && dataFinalizacao && dataFinalizacao < dataLimite) {
            return;
          }
          
          // Processar serviços da ordem
          ordem.servicos?.forEach((servico) => {
            if (!servico.subatividades?.length) return;
            
            // Calcular tempo estimado total em ms
            const tempoEstimadoTotal = servico.subatividades
              .filter(sub => sub.selecionada)
              .reduce((total, sub) => total + ((sub.tempoEstimado || 0) * 3600000), 0);
            
            // Encontrar registros de tempo para este serviço
            const tempoRegistro = ordem.tempoRegistros?.find(
              reg => reg.etapa === 'retifica' && (!reg.fim || reg.funcionarioId)
            );
            
            // Calcular tempo real gasto em ms
            let tempoRealTotal = 0;
            if (tempoRegistro) {
              const inicio = tempoRegistro.inicio instanceof Date ? 
                tempoRegistro.inicio.getTime() : 
                new Date(tempoRegistro.inicio).getTime();
              
              const fim = tempoRegistro.fim instanceof Date ? 
                tempoRegistro.fim.getTime() : 
                tempoRegistro.fim ? new Date(tempoRegistro.fim).getTime() : Date.now();
              
              tempoRealTotal = calculateElapsedTime(inicio, fim, tempoRegistro.pausas || []);
            }
            
            // Calcular valor estimado e real
            const valorEstimado = servico.subatividades
              .filter(sub => sub.selecionada)
              .reduce((total, sub) => total + ((sub.precoHora || 0) * (sub.tempoEstimado || 0)), 0);
            
            const valorReal = tempoRealTotal > 0 ? 
              valorEstimado * (tempoRealTotal / tempoEstimadoTotal) : 0;
            
            // Calcular eficiência
            const eficiencia = tempoEstimadoTotal > 0 ? 
              Math.round((tempoRealTotal / tempoEstimadoTotal) * 100) : 100;
            
            // Adicionar aos dados de produtividade
            dados.push({
              id: `${doc.id}_${servico.tipo}`,
              servico: servico.descricao || servico.tipo,
              tipoServico: servico.tipo,
              cliente: ordem.cliente?.nome || "Cliente não especificado",
              tempoEstimado: tempoEstimadoTotal,
              tempoReal: tempoRealTotal,
              eficiencia,
              funcionario: tempoRegistro?.funcionarioNome || "Não atribuído",
              dataFinalizacao: dataFinalizacao || undefined,
              valorEstimado,
              valorReal
            });
          });
        });
        
        setDadosProdutividade(dados);
      } catch (error) {
        console.error("Erro ao carregar dados de produtividade:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarDados();
  }, [periodoFiltro, funcionario]);
  
  // Calcular métricas gerais
  const totalServicos = dadosProdutividade.length;
  const servicosEficientes = dadosProdutividade.filter(d => d.eficiencia <= 100).length;
  const servicosIneficientes = totalServicos - servicosEficientes;
  const taxaEficiencia = totalServicos > 0 ? Math.round((servicosEficientes / totalServicos) * 100) : 0;
  
  // Calcular tempo economizado/perdido total
  const tempoTotalEconomizado = dadosProdutividade
    .filter(d => d.eficiencia <= 100)
    .reduce((total, d) => total + (d.tempoEstimado - d.tempoReal), 0);
  
  const tempoTotalExcedido = dadosProdutividade
    .filter(d => d.eficiencia > 100)
    .reduce((total, d) => total + (d.tempoReal - d.tempoEstimado), 0);
  
  // Preparar dados para o gráfico por tipo de serviço
  const dadosPorTipoServico = (() => {
    const dados: Record<string, { tipo: string, qtd: number, tempoMedioEficiencia: number }> = {};
    
    dadosProdutividade.forEach(d => {
      if (!dados[d.tipoServico]) {
        dados[d.tipoServico] = { 
          tipo: formatTipoServico(d.tipoServico), 
          qtd: 0, 
          tempoMedioEficiencia: 0 
        };
      }
      dados[d.tipoServico].qtd += 1;
      dados[d.tipoServico].tempoMedioEficiencia += d.eficiencia;
    });
    
    // Calcular médias
    Object.keys(dados).forEach(key => {
      dados[key].tempoMedioEficiencia = Math.round(dados[key].tempoMedioEficiencia / dados[key].qtd);
    });
    
    return Object.values(dados);
  })();
  
  // Função helper para formatar tipos de serviço
  function formatTipoServico(tipo: string): string {
    const formatMap: Record<string, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      lavagem: "Lavagem"
    };
    
    return formatMap[tipo] || tipo;
  }
  
  // Formatar tempo para display
  const formatTempoHoras = (ms: number) => {
    const horas = ms / 3600000;
    return horas.toFixed(1) + 'h';
  };
  
  // Cores para o gráfico baseado na eficiência
  const getEficienciaColor = (eficiencia: number) => {
    if (eficiencia <= 80) return "#22c55e";  // Verde para muito eficiente
    if (eficiencia <= 100) return "#84cc16"; // Verde-amarelo para eficiente
    if (eficiencia <= 120) return "#eab308"; // Amarelo para pouco ineficiente
    return "#ef4444";                        // Vermelho para muito ineficiente
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtividade</h1>
          <p className="text-muted-foreground">
            Análise de produtividade comparando tempo estimado versus tempo real de execução
          </p>
        </div>
        
        {/* Filtros */}
        <div className="flex justify-between items-center">
          <Tabs defaultValue="30dias" className="w-full" onValueChange={(v) => setPeriodoFiltro(v as any)}>
            <TabsList>
              <TabsTrigger value="7dias">Últimos 7 dias</TabsTrigger>
              <TabsTrigger value="30dias">Últimos 30 dias</TabsTrigger>
              <TabsTrigger value="todos">Todos os períodos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Eficiência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {taxaEficiencia >= 70 ? <TrendingUp className="h-5 w-5 mr-2 text-green-500" /> : <TrendingDown className="h-5 w-5 mr-2 text-red-500" />}
                <p className="text-2xl font-bold">{taxaEficiencia}%</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {servicosEficientes} de {totalServicos} serviços dentro ou abaixo do tempo estimado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tempo Economizado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-green-600">
                <Clock className="h-5 w-5 mr-2" />
                <p className="text-2xl font-bold">{formatTempoHoras(tempoTotalEconomizado)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de tempo abaixo do estimado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tempo Excedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-yellow-600">
                <Timer className="h-5 w-5 mr-2" />
                <p className="text-2xl font-bold">{formatTempoHoras(tempoTotalExcedido)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de tempo acima do estimado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Serviços Analisados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{totalServicos}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No período selecionado
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Gráfico de eficiência por tipo de serviço */}
        <Card>
          <CardHeader>
            <CardTitle>Eficiência por Tipo de Serviço</CardTitle>
            <CardDescription>
              Comparação da eficiência média (tempo real/estimado) por tipo de serviço
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : dadosPorTipoServico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosPorTipoServico}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis label={{ value: 'Eficiência (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}%`, 
                      name === 'tempoMedioEficiencia' ? 'Eficiência Média' : name
                    ]}
                  />
                  <Legend />
                  <Bar 
                    dataKey="tempoMedioEficiencia" 
                    name="Eficiência Média" 
                    fill="#8884d8"
                  >
                    {dadosPorTipoServico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getEficienciaColor(entry.tempoMedioEficiencia)} />
                    ))}
                    <LabelList dataKey="tempoMedioEficiencia" position="top" formatter={(value) => `${value}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Tabela de serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento de Serviços</CardTitle>
            <CardDescription>
              Lista de serviços com comparação entre tempo estimado e real
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : dadosProdutividade.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tempo Estimado</TableHead>
                    <TableHead>Tempo Real</TableHead>
                    <TableHead>Eficiência</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosProdutividade.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {formatTipoServico(item.tipoServico)}
                        <div className="text-xs text-muted-foreground">{item.servico}</div>
                      </TableCell>
                      <TableCell>{item.cliente}</TableCell>
                      <TableCell>{item.funcionario}</TableCell>
                      <TableCell>{formatTempoHoras(item.tempoEstimado)}</TableCell>
                      <TableCell>{formatTempoHoras(item.tempoReal)}</TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                            item.eficiencia <= 80 && "bg-green-500",
                            item.eficiencia > 80 && item.eficiencia <= 100 && "bg-green-400",
                            item.eficiencia > 100 && item.eficiencia <= 120 && "bg-yellow-500",
                            item.eficiencia > 120 && "bg-red-500"
                          )}
                        >
                          {item.eficiencia}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          Est: {formatCurrency(item.valorEstimado)}
                        </div>
                        <div className="text-xs font-medium">
                          Real: {formatCurrency(item.valorReal)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Nenhum serviço encontrado para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Produtividade;
