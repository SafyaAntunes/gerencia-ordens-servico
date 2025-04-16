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

  const verificarEtapasDisponiveis = () => {
    const temMontagem = ordem.servicos.some(s => s.tipo === 'montagem');
    const temDinamometro = ordem.servicos.some(s => s.tipo === 'dinamometro');
    const temLavagem = ordem.servicos.some(s => s.tipo === 'lavagem');
    const temRetifica = ordem.servicos.some(s => 
      ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(s.tipo as TipoServico)
    );
    
    return {
      lavagem: temLavagem,
      retifica: temRetifica,
      montagem: temMontagem,
      dinamometro: temDinamometro,
      inspecao_inicial: true,
      inspecao_final: true
    };
  };

  useEffect(() => {
    if (!ordem || !funcionario) {
      setEtapasAtivas([]);
      setSelectedEtapa(null);
      return;
    }
    
    const etapasDisponiveis = verificarEtapasDisponiveis();
    
    const allEtapas: EtapaOS[] = Object.entries(etapasDisponiveis)
      .filter(([_, existe]) => existe)
      .map(([etapa]) => etapa as EtapaOS);
    
    if (funcionario?.nivelPermissao === 'admin' || funcionario?.nivelPermissao === 'gerente') {
      setEtapasAtivas(allEtapas);
      if (!selectedEtapa && allEtapas.length > 0) {
        setSelectedEtapa(allEtapas[0]);
      }
    } else {
      const etapasTecnico: EtapaOS[] = [];
      
      if (etapasDisponiveis.inspecao_inicial) etapasTecnico.push('inspecao_inicial');
      
      if (etapasDisponiveis.retifica && ordem.servicos.some(servico => 
        ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo as TipoServico) &&
        funcionario?.especialidades.includes(servico.tipo)
      )) {
        etapasTecnico.push('retifica');
      }
      
      if (etapasDisponiveis.montagem && funcionario?.especialidades.includes('montagem')) {
        etapasTecnico.push('montagem');
      }
      
      if (etapasDisponiveis.dinamometro && funcionario?.especialidades.includes('dinamometro')) {
        etapasTecnico.push('dinamometro');
      }
      
      if (etapasDisponiveis.lavagem && funcionario?.especialidades.includes('lavagem')) {
        etapasTecnico.push('lavagem');
      }
      
      if (etapasDisponiveis.inspecao_final) etapasTecnico.push('inspecao_final');
      
      setEtapasAtivas(etapasTecnico);
      
      if (!selectedEtapa && etapasTecnico.length > 0) {
        setSelectedEtapa(etapasTecnico[0]);
      } else if (selectedEtapa && !etapasTecnico.includes(selectedEtapa)) {
        setSelectedEtapa(etapasTecnico.length > 0 ? etapasTecnico[0] : null);
      }
    }
    
    calcularProgressoTotal(ordem);
  }, [ordem, funcionario, selectedEtapa]);

  const calcularProgressoTotal = (ordemAtual: OrdemServico) => {
    const etapasDisponiveis = verificarEtapasDisponiveis();
    
    const etapasRelevantes = Object.entries(etapasDisponiveis)
      .filter(([_, existe]) => existe)
      .map(([etapa]) => etapa as EtapaOS);
    
    const totalEtapas = etapasRelevantes.length;
    const etapasConcluidas = etapasRelevantes.filter(etapa => 
      ordemAtual.etapasAndamento?.[etapa]?.concluido
    ).length;
    
    const servicosAtivos = ordemAtual.servicos?.filter(s => {
      return s.subatividades?.some(sub => sub.selecionada) || true;
    }) || [];
    
    const totalServicos = servicosAtivos.length;
    const servicosConcluidos = servicosAtivos.filter(s => s.concluido).length;
    
    const totalItens = (totalEtapas * 2) + (totalServicos * 1);
    const itensConcluidos = (etapasConcluidas * 2) + (servicosConcluidos * 1);
    
    const progresso = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;
    setProgressoTotal(progresso);
    
    if (ordemAtual.id && totalItens > 0) {
      const progressoFracao = itensConcluidos / totalItens;
      atualizarProgressoNoDB(ordemAtual.id, progressoFracao);
    }
  };

  const atualizarProgressoNoDB = async (ordenId: string, progresso: number) => {
    try {
      const ordemRef = doc(db, "ordens_servico", ordenId);
      await updateDoc(ordemRef, { progressoEtapas: progresso });
    } catch (error) {
      console.error("Erro ao atualizar progresso da ordem:", error);
    }
  };

  const handleServicoStatusChange = async (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    if (funcionario.nivelPermissao !== 'admin' && 
        funcionario.nivelPermissao !== 'gerente' && 
        !funcionario.especialidades.includes(servicoTipo)) {
      toast.error("Você não tem permissão para gerenciar este tipo de serviço");
      return;
    }
    
    try {
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo) {
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
            subatividades,
            funcionarioId: concluido ? (funcionarioId || funcionario.id) : undefined,
            funcionarioNome: concluido ? (funcionarioNome || funcionario.nome) : undefined,
            dataConclusao: concluido ? new Date() : undefined
          };
        }
        return servico;
      });
      
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      toast.success(`Serviço ${servicoTipo} ${concluido ? 'concluído' : 'reaberto'}`);
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    }
  };

  const verificarEtapaConcluida = async (ordemAtualizada: OrdemServico, servicoTipo: TipoServico) => {
    let etapa: EtapaOS | null = null;
    
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
    
    const servicosEtapa = ordemAtualizada.servicos.filter(s => {
      if (etapa === 'retifica') {
        return ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(s.tipo as TipoServico);
      }
      return s.tipo === etapa;
    });
    
    const servicosAtivos = servicosEtapa.filter(s => 
      s.subatividades && s.subatividades.some(sub => sub.selecionada)
    );
    
    if (servicosAtivos.length === 0) return;
    
    const todosConcluidos = servicosAtivos.every(s => s.concluido);
    
    if (todosConcluidos && !ordemAtualizada.etapasAndamento[etapa]?.concluido) {
      await handleEtapaStatusChange(etapa, true);
    }
  };

  const handleEtapaStatusChange = async (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      const etapasAndamento = {
        ...ordem.etapasAndamento,
        [etapa]: {
          ...ordem.etapasAndamento[etapa],
          concluido: concluida,
          funcionarioId: funcionarioId || funcionario.id,
          funcionarioNome: funcionarioNome || funcionario.nome,
          finalizado: concluida ? new Date() : undefined
        }
      };
      
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { etapasAndamento });
      
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      calcularProgressoTotal(ordemAtualizada);
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      toast.success(`Etapa ${formatarEtapa(etapa)} ${concluida ? 'concluída' : 'reaberta'}`);
    } catch (error) {
      console.error("Erro ao atualizar status da etapa:", error);
      toast.error("Erro ao atualizar status da etapa");
    }
  };

  const handleSubatividadeToggle = async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem?.id) return;
    
    if (funcionario?.nivelPermissao !== 'admin' && 
        funcionario?.nivelPermissao !== 'gerente' && 
        !funcionario?.especialidades.includes(servicoTipo)) {
      toast.error("Você não tem permissão para gerenciar este tipo de serviço");
      return;
    }
    
    try {
      const servicoAtual = ordem.servicos.find(s => s.tipo === servicoTipo);
      if (!servicoAtual || !servicoAtual.subatividades) return;
      
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo && servico.subatividades) {
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
      
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
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

  const getServicosParaEtapa = (etapa: EtapaOS): Servico[] => {
    switch (etapa) {
      case 'retifica':
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

  const isRetificaHabilitada = () => {
    return ordem.status === 'fabricacao';
  };

  const isInspecaoFinalHabilitada = () => {
    const { etapasAndamento } = ordem;
    
    return (
      etapasAndamento['retifica']?.concluido === true ||
      etapasAndamento['montagem']?.concluido === true ||
      etapasAndamento['dinamometro']?.concluido === true
    );
  };

  const servicosAtivos = ordem.servicos.filter(servico => 
    servico.subatividades && servico.subatividades.some(sub => sub.selecionada)
  );

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

  const etapasDisponiveis = verificarEtapasDisponiveis();

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
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso Total</span>
              <span className="text-sm font-medium">{progressoTotal}%</span>
            </div>
            <Progress value={progressoTotal} className="h-3" />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {etapasAtivas.map(etapa => {
              const isDisabled = 
                (etapa === 'retifica' && !isRetificaHabilitada()) ||
                (etapa === 'inspecao_final' && !isInspecaoFinalHabilitada()) ||
                (etapa === 'montagem' && !etapasDisponiveis.montagem) ||
                (etapa === 'dinamometro' && !etapasDisponiveis.dinamometro) ||
                (etapa === 'lavagem' && !etapasDisponiveis.lavagem);
              
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

          <Separator className="my-4" />

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
