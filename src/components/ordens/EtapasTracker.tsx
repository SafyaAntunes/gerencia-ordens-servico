
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { OrdemServico, TipoServico, EtapaOS, Servico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, PlayCircle, Wrench, Gauge, Search } from "lucide-react";
import EtapaCard from "./EtapaCard";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
}

const EtapasTracker = ({ ordem, onOrdemUpdate }: EtapasTrackerProps) => {
  const [etapasAtivas, setEtapasAtivas] = useState<EtapaOS[]>([]);
  const [progressoTotal, setProgressoTotal] = useState(0);
  const [selectedEtapa, setSelectedEtapa] = useState<EtapaOS | null>(null);
  const { funcionario } = useAuth();

  // Função para obter o ícone da etapa
  const getEtapaIcon = (etapa: EtapaOS) => {
    switch (etapa) {
      case 'lavagem':
        return <Clock className="h-4 w-4 mr-2" />;
      case 'inspecao_inicial':
        return <Search className="h-4 w-4 mr-2" />;
      case 'retifica':
        return <Wrench className="h-4 w-4 mr-2" />;
      case 'montagem':
        return <Wrench className="h-4 w-4 mr-2" />;
      case 'dinamometro':
        return <Gauge className="h-4 w-4 mr-2" />;
      case 'inspecao_final':
        return <CheckCircle className="h-4 w-4 mr-2" />;
      default:
        return <Clock className="h-4 w-4 mr-2" />;
    }
  };

  // Define quais etapas o usuário pode ver com base em suas permissões
  useEffect(() => {
    if (!ordem || !funcionario) {
      setEtapasAtivas([]);
      setSelectedEtapa(null);
      return;
    }
    
    // Define todas as etapas disponíveis
    const allEtapas: EtapaOS[] = [
      'lavagem', 
      'inspecao_inicial', 
      'retifica', 
      'montagem', 
      'dinamometro', 
      'inspecao_final'
    ];
    
    // Se for admin ou gerente, mostra todas as etapas
    if (funcionario?.nivelPermissao === 'admin' || funcionario?.nivelPermissao === 'gerente') {
      setEtapasAtivas(allEtapas);
      if (!selectedEtapa && allEtapas.length > 0) {
        setSelectedEtapa(allEtapas[0]);
      }
    } else {
      // Para técnicos, mostrar apenas etapas específicas, mas filtradas pelas especialidades
      const etapasTecnico: EtapaOS[] = ['inspecao_inicial', 'retifica', 'inspecao_final'];
      const etapasPermitidas = etapasTecnico.filter(etapa => {
        // Para retífica, verificar se o técnico tem permissão para algum dos serviços dessa etapa
        if (etapa === 'retifica') {
          return ordem.servicos.some(servico => 
            ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo as TipoServico) &&
            funcionario?.especialidades.includes(servico.tipo)
          );
        }
        return true;
      });
      
      setEtapasAtivas(etapasPermitidas);
      
      // Se não tiver selecionado ou a seleção não está nas permitidas, seleciona a primeira
      if (!selectedEtapa && etapasPermitidas.length > 0) {
        setSelectedEtapa(etapasPermitidas[0]);
      } else if (selectedEtapa && !etapasPermitidas.includes(selectedEtapa)) {
        setSelectedEtapa(etapasPermitidas.length > 0 ? etapasPermitidas[0] : null);
      }
    }
    
    // Calcular o progresso total da ordem
    calcularProgressoTotal(ordem);
  }, [ordem, funcionario, selectedEtapa]);

  // Função para calcular o progresso total
  const calcularProgressoTotal = (ordemAtual: OrdemServico) => {
    const etapas = Object.keys(ordemAtual.etapasAndamento) as EtapaOS[];
    
    if (etapas.length === 0) {
      setProgressoTotal(0);
      return;
    }
    
    const etapasConcluidas = etapas.filter(
      etapa => ordemAtual.etapasAndamento[etapa]?.concluido
    ).length;
    
    const progresso = Math.round((etapasConcluidas / etapas.length) * 100);
    setProgressoTotal(progresso);
  };

  // Função para lidar com a troca de status do serviço
  const handleServicoStatusChange = async (servicoTipo: TipoServico, concluido: boolean) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    // Verificar se o usuário tem permissão para este tipo de serviço
    if (funcionario.nivelPermissao !== 'admin' && 
        funcionario.nivelPermissao !== 'gerente' && 
        !funcionario.especialidades.includes(servicoTipo)) {
      toast.error("Você não tem permissão para gerenciar este tipo de serviço");
      return;
    }
    
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
      
      // Verificar se todos os serviços de uma etapa foram concluídos
      verificarEtapaConcluida(ordemAtualizada, servicoTipo);
      
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

  // Função para verificar se todos os serviços de uma etapa foram concluídos
  const verificarEtapaConcluida = async (ordemAtualizada: OrdemServico, servicoTipo: TipoServico) => {
    let etapa: EtapaOS | null = null;
    
    // Determinar a qual etapa o serviço pertence
    if (['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servicoTipo)) {
      etapa = 'retifica';
    } else if (servicoTipo === 'montagem') {
      etapa = 'montagem';
    } else if (servicoTipo === 'dinamometro') {
      etapa = 'dinamometro';
    } else if (servicoTipo === 'lavagem') {
      etapa = 'lavagem';
    }
    
    if (!etapa) return;
    
    // Obter os serviços dessa etapa
    const servicosEtapa = ordemAtualizada.servicos.filter(s => {
      if (etapa === 'retifica') {
        return ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(s.tipo as TipoServico);
      }
      return s.tipo === etapa;
    });
    
    // Verificar se há serviços ativos (com subatividades selecionadas)
    const servicosAtivos = servicosEtapa.filter(s => 
      s.subatividades && s.subatividades.some(sub => sub.selecionada)
    );
    
    // Se não há serviços ativos, não prosseguir
    if (servicosAtivos.length === 0) return;
    
    // Verificar se todos os serviços ativos estão concluídos
    const todosConcluidos = servicosAtivos.every(s => s.concluido);
    
    // Se todos estão concluídos, marcar a etapa como concluída
    if (todosConcluidos && !ordemAtualizada.etapasAndamento[etapa]?.concluido) {
      await handleEtapaStatusChange(etapa, true);
    }
  };

  // Função para lidar com a troca de status de uma etapa
  const handleEtapaStatusChange = async (etapa: EtapaOS, concluida: boolean) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Atualize a etapa na ordem
      const etapasAndamento = {
        ...ordem.etapasAndamento,
        [etapa]: {
          ...ordem.etapasAndamento[etapa],
          concluido: concluida,
          funcionarioId: funcionario.id,
          funcionarioNome: funcionario.nome,
          finalizado: concluida ? new Date() : undefined
        }
      };
      
      // Atualize o Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { etapasAndamento });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      calcularProgressoTotal(ordemAtualizada);
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Exiba um toast de sucesso
      toast.success(`Etapa ${formatarEtapa(etapa)} ${concluida ? 'concluída' : 'reaberta'}`);
    } catch (error) {
      console.error("Erro ao atualizar status da etapa:", error);
      toast.error("Erro ao atualizar status da etapa");
    }
  };

  // Função para lidar com a troca de status de uma subatividade
  const handleSubatividadeToggle = async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem?.id) return;
    
    // Verificar se o usuário tem permissão para este tipo de serviço
    if (funcionario?.nivelPermissao !== 'admin' && 
        funcionario?.nivelPermissao !== 'gerente' && 
        !funcionario?.especialidades.includes(servicoTipo)) {
      toast.error("Você não tem permissão para gerenciar este tipo de serviço");
      return;
    }
    
    try {
      // Encontre o serviço atual
      const servicoAtual = ordem.servicos.find(s => s.tipo === servicoTipo);
      if (!servicoAtual || !servicoAtual.subatividades) return;
      
      // Atualize a subatividade
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo && servico.subatividades) {
          const subatividades = servico.subatividades.map(sub => {
            if (sub.id === subatividadeId) {
              return { ...sub, concluida: checked };
            }
            return sub;
          });
          
          // Verificar se todas as subatividades selecionadas estão concluídas
          const selecionadas = subatividades.filter(sub => sub.selecionada);
          const todasConcluidas = selecionadas.length > 0 && selecionadas.every(sub => sub.concluida);
          
          // Se todas estiverem concluídas, marcar o serviço como concluído
          const concluido = todasConcluidas;
          
          return { 
            ...servico, 
            subatividades,
            concluido 
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
      
      // Verificar se todos os serviços de uma etapa foram concluídos após atualizar uma subatividade
      verificarEtapaConcluida(ordemAtualizada, servicoTipo);
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
    } catch (error) {
      console.error("Erro ao atualizar subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
    }
  };

  // Função para formatação dos nomes das etapas
  const formatarEtapa = (etapa: EtapaOS): string => {
    const labels: Record<EtapaOS, string> = {
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      retifica: "Retífica",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_final: "Inspeção Final"
    };
    return labels[etapa] || etapa;
  };

  // Organiza os serviços por etapas
  const getServicosParaEtapa = (etapa: EtapaOS): Servico[] => {
    switch (etapa) {
      case 'retifica':
        // Filtra os serviços de retífica para funcionários que não são admin ou gerente
        if (funcionario?.nivelPermissao !== 'admin' && funcionario?.nivelPermissao !== 'gerente') {
          return ordem.servicos.filter(servico => 
            ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo) &&
            funcionario?.especialidades.includes(servico.tipo)
          );
        } else {
          return ordem.servicos.filter(servico => 
            ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
          );
        }
      case 'montagem':
        return ordem.servicos.filter(servico => servico.tipo === 'montagem');
      case 'dinamometro':
        return ordem.servicos.filter(servico => servico.tipo === 'dinamometro');
      case 'lavagem': 
        return ordem.servicos.filter(servico => servico.tipo === 'lavagem');
      default:
        return [];
    }
  };

  // Verifica se a etapa "retifica" está habilitada com base no status da ordem
  const isRetificaHabilitada = () => {
    return ordem.status === 'fabricacao';
  };

  // Verifica se a etapa "inspecao_final" está habilitada com base na conclusão de etapas anteriores
  const isInspecaoFinalHabilitada = () => {
    const { etapasAndamento } = ordem;
    return (
      (etapasAndamento['retifica']?.concluido === true) ||
      (etapasAndamento['montagem']?.concluido === true) ||
      (etapasAndamento['dinamometro']?.concluido === true)
    );
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

  // Exibe o painel de tracker com o novo layout de botões horizontais
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tracker de Serviços</CardTitle>
          <CardDescription>
            Acompanhe o progresso dos serviços e etapas desta ordem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barra de progresso total */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso Total</span>
              <span className="text-sm font-medium">{progressoTotal}%</span>
            </div>
            <Progress value={progressoTotal} className="h-3" />
          </div>

          {/* Botões horizontais para etapas - agora centralizados */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {etapasAtivas.map(etapa => {
              // Verifica se a etapa está desabilitada
              const isDisabled = 
                (etapa === 'retifica' && !isRetificaHabilitada()) ||
                (etapa === 'inspecao_final' && !isInspecaoFinalHabilitada());
              
              return (
                <Button
                  key={etapa}
                  variant={selectedEtapa === etapa ? "default" : "outline"}
                  className="flex items-center"
                  onClick={() => !isDisabled && setSelectedEtapa(etapa)}
                  disabled={isDisabled}
                >
                  {getEtapaIcon(etapa)}
                  {formatarEtapa(etapa)}
                  {isDisabled && (
                    <Badge variant="outline" className="ml-2 text-xs bg-opacity-50">
                      Bloqueado
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Separator */}
          <Separator className="my-4" />

          {/* Conteúdo da etapa selecionada */}
          {selectedEtapa && funcionario && (
            <EtapaCard 
              key={selectedEtapa}
              ordemId={ordem.id}
              etapa={selectedEtapa}
              etapaNome={formatarEtapa(selectedEtapa)}
              funcionarioId={funcionario?.id || ""}
              funcionarioNome={funcionario?.nome}
              servicos={getServicosParaEtapa(selectedEtapa)}
              etapaInfo={ordem.etapasAndamento[selectedEtapa]}
              onSubatividadeToggle={(servicoTipo, subId, checked) => {
                handleSubatividadeToggle(servicoTipo, subId, checked);
              }}
              onServicoStatusChange={handleServicoStatusChange}
              onEtapaStatusChange={handleEtapaStatusChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapasTracker;
