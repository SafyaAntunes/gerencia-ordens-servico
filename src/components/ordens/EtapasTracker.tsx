import React, { useState, useEffect } from "react";
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
import { EtapaCard } from "./etapa";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
}

const EtapasTracker = ({ ordem, onOrdemUpdate }: EtapasTrackerProps) => {
  const [etapasAtivas, setEtapasAtivas] = useState<EtapaOS[]>([]);
  const [progressoTotal, setProgressoTotal] = useState(0);
  const [selectedEtapa, setSelectedEtapa] = useState<EtapaOS | null>(null);
  const [selectedServicoTipo, setSelectedServicoTipo] = useState<TipoServico | null>(null);
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
    return {
      montagem: temMontagem,
      dinamometro: temDinamometro
    };
  };

  useEffect(() => {
    if (!ordem || !funcionario) {
      setEtapasAtivas([]);
      setSelectedEtapa(null);
      setSelectedServicoTipo(null);
      return;
    }

    const etapasDisponiveis = verificarEtapasDisponiveis();
    const allEtapas: EtapaOS[] = [
      'lavagem',
      'inspecao_inicial',
      'retifica'
    ];
    if (etapasDisponiveis.montagem) allEtapas.push('montagem');
    if (etapasDisponiveis.dinamometro) allEtapas.push('dinamometro');
    allEtapas.push('inspecao_final');

    setEtapasAtivas(allEtapas);
    if (!selectedEtapa && allEtapas.length > 0) {
      setSelectedEtapa(allEtapas[0]);
    }
    setSelectedServicoTipo(null);
    calcularProgressoTotal(ordem);
  }, [ordem, funcionario]);

  const calcularProgressoTotal = (ordemAtual: OrdemServico) => {
    const etapasPossiveis: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    
    const etapasRelevantes = etapasPossiveis.filter(etapa => {
      if (etapa === "retifica") {
        return ordemAtual.servicos?.some(s => 
          ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo));
      } else if (etapa === "montagem") {
        return ordemAtual.servicos?.some(s => s.tipo === "montagem");
      } else if (etapa === "dinamometro") {
        return ordemAtual.servicos?.some(s => s.tipo === "dinamometro");
      } else if (etapa === "lavagem") {
        return ordemAtual.servicos?.some(s => s.tipo === "lavagem");
      }
      return true;
    });
    
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

  const handleServicoStatusChange = async (
    servicoTipo: TipoServico, 
    concluido: boolean, 
    funcionarioId?: string, 
    funcionarioNome?: string
  ) => {
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

  const getTiposParaInspecaoOuLavagem = (etapa: EtapaOS): TipoServico[] => {
    return ordem.servicos
      .filter(servico => ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo))
      .map(servico => servico.tipo);
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
      case 'inspecao_inicial':
      case 'inspecao_final':
        return [];
      default:
        return [];
    }
  };

  const getTiposParaInspecao = (): TipoServico[] => {
    return ordem.servicos
      .filter(servico => ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo))
      .map(servico => servico.tipo);
  };

  const getEtapaTitulo = (etapa: EtapaOS, servicoTipo?: TipoServico) => {
    const etapaLabel: Record<EtapaOS, string> = {
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      retifica: "Retífica",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_final: "Inspeção Final"
    };
    if (
      (etapa === "inspecao_inicial" || etapa === "inspecao_final") 
      && servicoTipo
    ) {
      const tipoLabel: Record<TipoServico, string> = {
        bloco: "Bloco",
        biela: "Biela",
        cabecote: "Cabeçote",
        virabrequim: "Virabrequim",
        eixo_comando: "Eixo de Comando",
        montagem: "Montagem",
        dinamometro: "Dinamômetro",
        lavagem: "Lavagem"
      };
      return `${etapaLabel[etapa]} - ${tipoLabel[servicoTipo]}`;
    }
    return etapaLabel[etapa];
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
      console.log("Toggling subatividade in EtapasTracker:", subatividadeId, "to", checked);
      
      // Create a deep clone of the services to avoid messing with React's state directly
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
      
      // Corrigir o caminho do documento para "ordens_servico" ao invés de "ordens"
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Update local state
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      // Notify parent component
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Provide feedback to the user
      toast.success(`Subatividade ${checked ? 'concluída' : 'reaberta'}`);
    } catch (error) {
      console.error("Erro ao atualizar subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
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

  const handleEtapaStatusChange = async (
    etapa: EtapaOS, 
    concluida: boolean, 
    funcionarioId?: string, 
    funcionarioNome?: string,
    servicoTipo?: TipoServico
  ) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      let etapasAndamento = { ...ordem.etapasAndamento };
      
      if ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final') && servicoTipo) {
        const etapaKey = `${etapa}_${servicoTipo}` as any;
        
        etapasAndamento[etapaKey] = {
          ...etapasAndamento[etapaKey],
          concluido: concluida,
          funcionarioId: funcionarioId || funcionario.id,
          funcionarioNome: funcionarioNome || funcionario.nome,
          finalizado: concluida ? new Date() : undefined,
          servicoTipo: servicoTipo
        };
      } else {
        etapasAndamento[etapa] = {
          ...etapasAndamento[etapa],
          concluido: concluida,
          funcionarioId: funcionarioId || funcionario.id,
          funcionarioNome: funcionarioNome || funcionario.nome,
          finalizado: concluida ? new Date() : undefined
        };
      }
      
      // Corrigir o caminho do documento para "ordens_servico" ao invés de "ordens"
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { etapasAndamento });
      
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      const servicoMsg = servicoTipo ? ` - ${formatServicoTipo(servicoTipo)}` : '';
      toast.success(`Etapa ${etapaNomesBR[etapa] || etapa}${servicoMsg} ${concluida ? 'concluída' : 'reaberta'}`);
    } catch (error) {
      console.error("Erro ao atualizar status da etapa:", error);
      toast.error("Erro ao atualizar status da etapa");
    }
  };

  const etapaNomesBR: Record<EtapaOS, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    inspecao_final: "Inspeção Final"
  };

  const formatServicoTipo = (tipo: TipoServico): string => {
    const labels: Record<TipoServico, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      lavagem: "Lavagem"
    };
    return labels[tipo] || tipo;
  };

  const getEtapaInfo = (etapa: EtapaOS, servicoTipo?: TipoServico) => {
    if ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final') && servicoTipo) {
      const etapaKey = `${etapa}_${servicoTipo}` as any;
      return ordem.etapasAndamento[etapaKey] || { 
        concluido: false,
        servicoTipo: servicoTipo 
      };
    }
    return ordem.etapasAndamento[etapa];
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
                (etapa === 'dinamometro' && !etapasDisponiveis.dinamometro);

              return (
                <Button
                  key={etapa}
                  variant={selectedEtapa === etapa ? "default" : "outline"}
                  className="flex items-center"
                  onClick={() => {
                    !isDisabled && setSelectedEtapa(etapa);
                    setSelectedServicoTipo(null);
                  }}
                  disabled={isDisabled}
                >
                  {getEtapaIcon(etapa)}
                  {getEtapaTitulo(etapa)}
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

          {selectedEtapa && (
            (selectedEtapa === "inspecao_inicial" || selectedEtapa === "inspecao_final" || selectedEtapa === "lavagem") ? (
              <div className="grid gap-4">
                {getTiposParaInspecaoOuLavagem(selectedEtapa).map(tipo => (
                  <EtapaCard
                    key={`${selectedEtapa}-${tipo}`}
                    ordemId={ordem.id}
                    etapa={selectedEtapa}
                    etapaNome={`${getEtapaTitulo(selectedEtapa)} - ${formatServicoTipo(tipo)}`}
                    funcionarioId={funcionario?.id || ""}
                    funcionarioNome={funcionario?.nome}
                    servicos={[]} // No services for inspections and washing
                    etapaInfo={getEtapaInfo(selectedEtapa, tipo)}
                    servicoTipo={tipo}
                    onEtapaStatusChange={handleEtapaStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div>
                {selectedEtapa && funcionario && (
                  <EtapaCard
                    key={selectedEtapa}
                    ordemId={ordem.id}
                    etapa={selectedEtapa}
                    etapaNome={getEtapaTitulo(selectedEtapa)}
                    funcionarioId={funcionario?.id || ""}
                    funcionarioNome={funcionario?.nome}
                    servicos={getServicosParaEtapa(selectedEtapa)}
                    etapaInfo={getEtapaInfo(selectedEtapa)}
                    onSubatividadeToggle={handleSubatividadeToggle}
                    onServicoStatusChange={handleServicoStatusChange}
                    onEtapaStatusChange={handleEtapaStatusChange}
                  />
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapasTracker;
