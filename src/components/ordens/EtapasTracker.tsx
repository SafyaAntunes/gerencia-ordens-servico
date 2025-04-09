
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { OrdemServico, TipoServico, EtapaOS } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, PlayCircle } from "lucide-react";
import ServicoTracker from "./ServicoTracker";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
}

const EtapasTracker = ({ ordem, onOrdemUpdate }: EtapasTrackerProps) => {
  const [etapasAtivas, setEtapasAtivas] = useState<EtapaOS[]>([]);
  const [activeTab, setActiveTab] = useState<TipoServico | "">("");
  const { funcionario } = useAuth();

  useEffect(() => {
    // Inicializar com a primeira aba de serviço ativa (se existir)
    if (ordem.servicos.length > 0 && !activeTab) {
      setActiveTab(ordem.servicos[0].tipo);
    }
  }, [ordem.servicos, activeTab]);

  // Função para calcular o progresso total
  const calcularProgressoTotal = (ordemAtualizada: OrdemServico, etapasAtivas: EtapaOS[]) => {
    // Por enquanto, apenas retornamos a ordem sem modificação
    return ordemAtualizada;
  };

  // Função para lidar com a troca de status do serviço
  const handleServicoStatusChange = async (servicoTipo: TipoServico, concluido: boolean) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Crie uma cópia dos serviços atuais
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo) {
          // Se estiver marcando como concluído manualmente, todas as subatividades também serão marcadas
          let subatividades = servico.subatividades;
          if (concluido && subatividades) {
            subatividades = subatividades.map(sub => {
              if (sub.selecionada) {
                return { ...sub, concluida: true };
              }
              return sub;
            });
          }
          
          return { 
            ...servico, 
            concluido,
            subatividades
          };
        }
        return servico;
      });
      
      // Atualize o Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      // Calcule o novo progresso
      calcularProgressoTotal(ordemAtualizada, etapasAtivas);
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Exiba um toast de sucesso
      toast.success(`Serviço ${servicoTipo} ${concluido ? 'concluído' : 'reaberto'}`);
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    }
  };

  // Função para lidar com a troca de status de uma subatividade
  const handleSubatividadeToggle = async (subatividadeId: string, checked: boolean) => {
    if (!activeTab || !ordem?.id) return;
    
    try {
      // Encontre o serviço atual
      const servicoAtual = ordem.servicos.find(s => s.tipo === activeTab);
      if (!servicoAtual || !servicoAtual.subatividades) return;
      
      // Atualize a subatividade
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === activeTab && servico.subatividades) {
          const subatividades = servico.subatividades.map(sub => {
            if (sub.id === subatividadeId) {
              return { ...sub, concluida: checked };
            }
            return sub;
          });
          
          return { 
            ...servico, 
            subatividades 
          };
        }
        return servico;
      });
      
      // Atualize o Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
    } catch (error) {
      console.error("Erro ao atualizar subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
    }
  };

  // Função para calcular o progresso de um serviço
  const calcularProgressoServico = (servico: TipoServico) => {
    const servicoAtual = ordem.servicos.find(s => s.tipo === servico);
    if (!servicoAtual || !servicoAtual.subatividades) return 0;
    
    const subatividadesSelecionadas = servicoAtual.subatividades.filter(sub => sub.selecionada);
    if (subatividadesSelecionadas.length === 0) return 0;
    
    const concluidas = subatividadesSelecionadas.filter(sub => sub.concluida).length;
    return Math.round((concluidas / subatividadesSelecionadas.length) * 100);
  };

  // Função para formatação dos nomes dos serviços
  const formatarTipoServico = (tipo: TipoServico): string => {
    const labels: Record<TipoServico, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro"
    };
    return labels[tipo] || tipo;
  };

  // Filtra apenas os serviços ativos
  const servicosAtivos = ordem.servicos.filter(servico => 
    servico.subatividades && servico.subatividades.some(sub => sub.selecionada)
  );

  // Se não houver serviços selecionados, exiba uma mensagem
  if (servicosAtivos.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tracker de Serviços</CardTitle>
          <CardDescription>
            Não há serviços com subatividades selecionadas para esta ordem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            Edite a ordem para selecionar serviços e subatividades.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Exibe o painel de tracker com abas para cada serviço
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tracker de Serviços</CardTitle>
          <CardDescription>
            Acompanhe o progresso dos serviços desta ordem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Resumo geral dos serviços */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {servicosAtivos.map(servico => (
              <Card key={servico.tipo} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">
                      {formatarTipoServico(servico.tipo)}
                    </CardTitle>
                    {servico.concluido ? (
                      <Badge variant="success">Concluído</Badge>
                    ) : (
                      <Badge variant="outline">Em andamento</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <Progress 
                    value={calcularProgressoServico(servico.tipo)} 
                    className="h-2 mb-2" 
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Progresso: {calcularProgressoServico(servico.tipo)}%</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-auto text-xs hover:bg-transparent"
                      onClick={() => setActiveTab(servico.tipo)}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Abas para cada serviço */}
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as TipoServico)}
            className="w-full"
          >
            <TabsList className="w-full mb-4 overflow-auto">
              {servicosAtivos.map(servico => (
                <TabsTrigger 
                  key={servico.tipo} 
                  value={servico.tipo}
                  className="flex-1"
                >
                  {formatarTipoServico(servico.tipo)}
                </TabsTrigger>
              ))}
            </TabsList>

            {servicosAtivos.map(servico => (
              <TabsContent key={servico.tipo} value={servico.tipo} className="m-0">
                <ServicoTracker
                  servico={servico}
                  ordemId={ordem.id}
                  funcionarioId={funcionario?.id}
                  funcionarioNome={funcionario?.nome}
                  onSubatividadeToggle={handleSubatividadeToggle}
                  onServicoStatusChange={(concluido) => handleServicoStatusChange(servico.tipo, concluido)}
                  className="w-full"
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapasTracker;
