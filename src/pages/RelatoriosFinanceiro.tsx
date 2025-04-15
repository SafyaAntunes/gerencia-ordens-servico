
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileBarChart, TrendingUp, Clock, CalendarDays } from "lucide-react";
import { LogoutProps } from "@/types/props";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico } from "@/types/ordens";
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
        
        <Tabs defaultValue="mensal" className="w-full">
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
