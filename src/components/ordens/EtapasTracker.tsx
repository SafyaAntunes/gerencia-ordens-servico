
import { EtapaOS, OrdemServico, TipoServico } from "@/types/ordens";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useEffect, useState } from "react";
import { StatusBadge } from "../ui/StatusBadge";
import EtapaCard from "./EtapaCard";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Progress } from "../ui/progress";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordem: OrdemServico) => void;
}

export default function EtapasTracker({ ordem, onOrdemUpdate }: EtapasTrackerProps) {
  const [etapas, setEtapas] = useState<EtapaOS[]>([]);
  const [progresso, setProgresso] = useState(0);
  const { funcionario } = useAuth();

  // Determina as etapas baseadas nos serviços selecionados
  useEffect(() => {
    let novasEtapas: EtapaOS[] = ["lavagem", "inspecao_inicial"];
    
    // Adiciona etapa de retífica se tiver algum serviço de retífica
    if (ordem.servicos?.some(s => 
      ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo))) {
      novasEtapas.push("retifica");
    }
    
    // Verifica se montagem está selecionada
    const temMontagem = ordem.servicos?.some(s => s.tipo === "montagem");
    if (temMontagem) {
      novasEtapas.push("montagem");
    }
    
    // Verifica se dinamômetro está selecionado
    const temDinamometro = ordem.servicos?.some(s => s.tipo === "dinamometro");
    if (temDinamometro) {
      novasEtapas.push("dinamometro");
    }
    
    // Sempre adiciona inspeção final
    novasEtapas.push("inspecao_final");
    
    setEtapas(novasEtapas);
    
    // Calcula o progresso inicial
    const etapasConcluidas = novasEtapas.filter(etapa => 
      ordem.etapasAndamento?.[etapa]?.concluido
    ).length;
    
    const percentualProgresso = novasEtapas.length > 0 ? 
      Math.round((etapasConcluidas / novasEtapas.length) * 100) : 0;
    
    setProgresso(percentualProgresso);
    
  }, [ordem.servicos, ordem.etapasAndamento]);

  const etapasLabels: Record<EtapaOS, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    inspecao_final: "Inspeção Final"
  };

  const handleIniciarEtapa = async (etapa: EtapaOS) => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para iniciar uma etapa");
      return;
    }

    try {
      // Atualiza o estado da etapa no Firebase
      const etapasAndamento = {
        ...ordem.etapasAndamento || {},
        [etapa]: {
          concluido: false,
          funcionarioId: funcionario.id,
          funcionarioNome: funcionario.nome,
          iniciado: new Date(),
          usarCronometro: true,
          pausas: []
        }
      };

      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { etapasAndamento });

      // Atualiza o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento,
      };

      // Recalcula o progresso
      const etapasConcluidas = etapas.filter(e => 
        ordemAtualizada.etapasAndamento?.[e]?.concluido
      ).length;
      const novoProgresso = etapas.length > 0 ? 
        etapasConcluidas / etapas.length : 0;
      
      // Atualiza o progresso
      await updateDoc(orderRef, { progressoEtapas: novoProgresso });
      ordemAtualizada.progressoEtapas = novoProgresso;

      onOrdemUpdate(ordemAtualizada);
      toast.success(`Etapa de ${etapasLabels[etapa]} iniciada`);
    } catch (error) {
      console.error("Erro ao iniciar etapa:", error);
      toast.error("Erro ao iniciar etapa");
    }
  };

  const handlePausarEtapa = async (etapa: EtapaOS, motivo?: string) => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para pausar uma etapa");
      return;
    }

    try {
      const etapaAtual = ordem.etapasAndamento?.[etapa];
      if (!etapaAtual) return;
      
      // Pega pausas existentes ou inicializa array vazio
      const pausasExistentes = etapaAtual.pausas || [];
      
      // Adiciona nova pausa
      const novaPausa = {
        inicio: new Date().getTime(),
        motivo
      };
      
      const pausasAtualizadas = [...pausasExistentes, novaPausa];
      
      // Atualiza o estado da etapa no Firebase
      const etapasAndamento = {
        ...ordem.etapasAndamento,
        [etapa]: {
          ...etapaAtual,
          pausas: pausasAtualizadas
        }
      };
      
      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { etapasAndamento });
      
      // Atualiza o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      onOrdemUpdate(ordemAtualizada);
      toast.success(`Etapa de ${etapasLabels[etapa]} pausada`);
    } catch (error) {
      console.error("Erro ao pausar etapa:", error);
      toast.error("Erro ao pausar etapa");
    }
  };

  const handleRetomarEtapa = async (etapa: EtapaOS) => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para retomar uma etapa");
      return;
    }
    
    try {
      const etapaAtual = ordem.etapasAndamento?.[etapa];
      if (!etapaAtual || !etapaAtual.pausas || etapaAtual.pausas.length === 0) return;
      
      // Pega todas as pausas e finaliza a última
      const pausas = [...etapaAtual.pausas];
      const ultimaPausa = pausas[pausas.length - 1];
      
      if (!ultimaPausa.fim) {
        pausas[pausas.length - 1] = {
          ...ultimaPausa,
          fim: new Date().getTime()
        };
      }
      
      // Atualiza o estado da etapa no Firebase
      const etapasAndamento = {
        ...ordem.etapasAndamento,
        [etapa]: {
          ...etapaAtual,
          pausas
        }
      };
      
      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { etapasAndamento });
      
      // Atualiza o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      onOrdemUpdate(ordemAtualizada);
      toast.success(`Etapa de ${etapasLabels[etapa]} retomada`);
    } catch (error) {
      console.error("Erro ao retomar etapa:", error);
      toast.error("Erro ao retomar etapa");
    }
  };

  const handleFinalizarEtapa = async (etapa: EtapaOS, tempoTotal?: number) => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para finalizar uma etapa");
      return;
    }

    try {
      const etapaAtual = ordem.etapasAndamento?.[etapa];
      
      // Atualiza o estado da etapa no Firebase
      const etapasAndamento = {
        ...ordem.etapasAndamento || {},
        [etapa]: {
          ...etapaAtual,
          concluido: true,
          finalizado: new Date()
        }
      };

      // Calcula o novo progresso
      const etapasConcluidas = etapas.filter(e => 
        (e === etapa) || ordem.etapasAndamento?.[e]?.concluido
      ).length;
      
      const novoProgresso = etapas.length > 0 ? 
        etapasConcluidas / etapas.length : 0;

      // Se houver tempo registrado, armazena nos registros de tempo
      let tempoRegistros = [...(ordem.tempoRegistros || [])];
      
      if (etapaAtual?.iniciado && etapaAtual?.usarCronometro) {
        tempoRegistros.push({
          inicio: new Date(etapaAtual.iniciado),
          fim: new Date(),
          funcionarioId: etapaAtual.funcionarioId || funcionario.id,
          funcionarioNome: etapaAtual.funcionarioNome || funcionario.nome,
          etapa: etapa,
          pausas: []
        });
      }

      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { 
        etapasAndamento,
        tempoRegistros,
        progressoEtapas: novoProgresso
      });

      // Atualiza o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento,
        tempoRegistros,
        progressoEtapas: novoProgresso
      };

      onOrdemUpdate(ordemAtualizada);
      setProgresso(Math.round(novoProgresso * 100));
      toast.success(`Etapa de ${etapasLabels[etapa]} concluída`);
    } catch (error) {
      console.error("Erro ao finalizar etapa:", error);
      toast.error("Erro ao finalizar etapa");
    }
  };

  const calcularProgresso = (etapasAndamento: any, etapasLista: EtapaOS[]): number => {
    const etapasConcluidas = etapasLista.filter(etapa => 
      etapasAndamento?.[etapa]?.concluido
    ).length;
    
    return etapasLista.length > 0 ? etapasConcluidas / etapasLista.length : 0;
  };

  const handleToggleCronometro = async (etapa: EtapaOS, usarCronometro: boolean) => {
    try {
      const etapaAtual = ordem.etapasAndamento?.[etapa];
      
      // Atualiza o estado da etapa no Firebase
      const etapasAndamento = {
        ...ordem.etapasAndamento || {},
        [etapa]: {
          ...etapaAtual,
          usarCronometro
        }
      };

      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { etapasAndamento });

      // Atualiza o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };

      onOrdemUpdate(ordemAtualizada);
    } catch (error) {
      console.error("Erro ao atualizar configuração de cronômetro:", error);
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleCompleteWithoutTimer = async (etapa: EtapaOS) => {
    try {
      // Atualiza o estado da etapa no Firebase
      const etapasAndamento = {
        ...ordem.etapasAndamento || {},
        [etapa]: {
          concluido: true,
          funcionarioId: funcionario?.id,
          funcionarioNome: funcionario?.nome,
          iniciado: new Date(),
          finalizado: new Date(),
          usarCronometro: false,
          pausas: []
        }
      };

      // Calcula o novo progresso
      const etapasConcluidas = etapas.filter(e => 
        (e === etapa) || ordem.etapasAndamento?.[e]?.concluido
      ).length;
      
      const novoProgresso = etapas.length > 0 ? 
        etapasConcluidas / etapas.length : 0;

      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { 
        etapasAndamento,
        progressoEtapas: novoProgresso
      });

      // Atualiza o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento,
        progressoEtapas: novoProgresso
      };

      onOrdemUpdate(ordemAtualizada);
      setProgresso(Math.round(novoProgresso * 100));
      toast.success(`Etapa de ${etapasLabels[etapa]} concluída`);
    } catch (error) {
      console.error("Erro ao concluir etapa sem cronômetro:", error);
      toast.error("Erro ao concluir etapa");
    }
  };

  const handleSubatividadeToggle = async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem.id) return;
    
    try {
      const servicos = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo && servico.subatividades) {
          const subatividades = servico.subatividades.map(sub => {
            if (sub.id === subatividadeId) {
              return { ...sub, selecionada: checked };
            }
            return sub;
          });
          
          return { ...servico, subatividades };
        }
        return servico;
      });
      
      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { servicos });
      
      const ordemAtualizada = {
        ...ordem,
        servicos
      };
      
      onOrdemUpdate(ordemAtualizada);
    } catch (error) {
      console.error("Erro ao atualizar subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
    }
  };
  
  const handleServicoStatusChange = async (servicoTipo: TipoServico, concluido: boolean) => {
    if (!ordem.id) return;
    
    try {
      const servicos = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo) {
          return { ...servico, concluido };
        }
        return servico;
      });
      
      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { servicos });
      
      const ordemAtualizada = {
        ...ordem,
        servicos
      };
      
      onOrdemUpdate(ordemAtualizada);
      
      if (concluido) {
        toast.success(`Serviço ${servicoTipo} concluído`);
      }
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    }
  };

  if (etapas.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Carregando etapas...</div>;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Acompanhamento das Etapas</CardTitle>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm text-muted-foreground">{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {etapas.map((etapa) => {
            const etapaInfo = ordem.etapasAndamento?.[etapa];
            const isConcluida = etapaInfo?.concluido || false;
            const isIniciada = !!etapaInfo?.iniciado && !etapaInfo?.concluido;
            const usarCronometro = etapaInfo?.usarCronometro !== false;
            
            return (
              <EtapaCard
                key={etapa}
                ordemId={ordem.id}
                etapa={etapa}
                etapaNome={etapasLabels[etapa]}
                funcionarioId={funcionario?.id || ""}
                funcionarioNome={funcionario?.nome}
                isConcluida={isConcluida}
                isIniciada={isIniciada}
                usarCronometro={usarCronometro}
                servicos={ordem.servicos}
                onStart={() => handleIniciarEtapa(etapa)}
                onPause={(motivo) => handlePausarEtapa(etapa, motivo)}
                onResume={() => handleRetomarEtapa(etapa)}
                onFinish={(tempoTotal) => handleFinalizarEtapa(etapa, tempoTotal)}
                onToggleCronometro={(usarCrono) => handleToggleCronometro(etapa, usarCrono)}
                onCompleteWithoutTimer={() => handleCompleteWithoutTimer(etapa)}
                onSubatividadeToggle={(servicoTipo, subId, checked) => 
                  handleSubatividadeToggle(servicoTipo, subId, checked)
                }
                onServicoStatusChange={(servicoTipo, concluido) => 
                  handleServicoStatusChange(servicoTipo, concluido)
                }
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
