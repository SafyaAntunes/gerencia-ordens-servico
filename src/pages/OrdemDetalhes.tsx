
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrdemServico } from "@/types/ordens";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock } from "lucide-react";

export default function OrdemDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("detalhes");

  useEffect(() => {
    const loadOrdem = () => {
      setLoading(true);
      try {
        // Buscar as ordens do localStorage
        const savedOrdens = localStorage.getItem('sgr-ordens');
        
        if (savedOrdens) {
          // Parse JSON e converter datas de string para Date
          const ordens = JSON.parse(savedOrdens, (key, value) => {
            if (key === 'dataAbertura' || key === 'dataPrevistaEntrega') {
              return new Date(value);
            }
            return value;
          });
          
          // Buscar a ordem específica pelo ID
          const ordemEncontrada = ordens.find((o: OrdemServico) => o.id === id);
          
          if (ordemEncontrada) {
            setOrdem(ordemEncontrada);
          } else {
            toast.error("Ordem não encontrada");
            navigate("/ordens");
          }
        } else {
          toast.error("Nenhuma ordem cadastrada");
          navigate("/ordens");
        }
      } catch (error) {
        console.error("Erro ao carregar ordem:", error);
        toast.error("Erro ao carregar dados da ordem");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadOrdem();
    }
  }, [id, navigate]);

  const handleVoltar = () => {
    navigate('/ordens');
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Carregando detalhes da ordem...</p>
        </div>
      </Layout>
    );
  }
  
  if (!ordem) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Ordem não encontrada</h2>
          <Button onClick={handleVoltar}>Voltar para a lista</Button>
        </div>
      </Layout>
    );
  }

  // Contador das etapas concluídas
  const totalEtapas = 6; // Número total de etapas
  const etapasConcluidas = Object.values(ordem.etapasAndamento).filter(
    (etapa) => etapa?.concluido
  ).length;
  
  // Cálculo do progresso
  const progresso = Math.round((etapasConcluidas / totalEtapas) * 100);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2" 
            onClick={handleVoltar}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{ordem.nome}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">ID: {ordem.id}</p>
            <StatusBadge status={ordem.status} />
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <StatusBadge status={ordem.prioridade} size="md" />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Previsão: {format(new Date(ordem.dataPrevistaEntrega), "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>

      <Tabs 
        defaultValue="detalhes"
        value={currentTab} 
        onValueChange={setCurrentTab}
        className="w-full space-y-4"
      >
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="detalhes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div>
                  <span className="font-medium">Cliente:</span>
                  <p>{ordem.cliente.nome}</p>
                </div>
                <div>
                  <span className="font-medium">Contato:</span>
                  <p>{ordem.cliente.telefone}</p>
                  <p className="text-sm text-muted-foreground">{ordem.cliente.email}</p>
                </div>
                <Separator />
                <div>
                  <span className="font-medium">Data de Abertura:</span>
                  <p>
                    {format(new Date(ordem.dataAbertura), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Prazo de Entrega:</span>
                  <p>
                    {format(new Date(ordem.dataPrevistaEntrega), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Progresso geral</span>
                  <span className="font-medium">{progresso}%</span>
                </div>
                <div className="h-3 w-full bg-secondary rounded-full mb-6">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${progresso}%` }}
                  />
                </div>
                
                <div className="space-y-3">
                  {Object.entries(ordem.etapasAndamento).map(([etapa, status]) => {
                    const etapaNome = {
                      lavagem: "Lavagem",
                      inspecao_inicial: "Inspeção Inicial",
                      retifica: "Retífica",
                      montagem_final: "Montagem Final",
                      teste: "Teste",
                      inspecao_final: "Inspeção Final"
                    }[etapa];
                    
                    return (
                      <div key={etapa} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {status?.concluido ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-muted-foreground rounded-full" />
                          )}
                          <span>{etapaNome}</span>
                        </div>
                        <span className={status?.concluido ? "text-primary font-medium" : "text-muted-foreground"}>
                          {status?.concluido ? "Concluído" : "Pendente"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="servicos">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Serviços Solicitados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ordem.servicos.map((servico, index) => {
                  const tipoServico = {
                    bloco: "Bloco",
                    biela: "Biela",
                    cabecote: "Cabeçote",
                    virabrequim: "Virabrequim",
                    eixo_comando: "Eixo de Comando"
                  }[servico.tipo];
                  
                  return (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{tipoServico}</h3>
                        <StatusBadge status={servico.concluido ? "concluido" : "pendente"} />
                      </div>
                      <p className="text-muted-foreground">{servico.descricao}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fotos">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Nenhuma foto disponível.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Sem registros de histórico disponíveis.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
