
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
    
    // Adiciona etapa de retífica
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
    
    const percentualProgresso = Math.round((etapasConcluidas / novasEtapas.length) * 100);
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
          usarCronometro: true
        }
      };

      const orderRef = doc(db, "ordens", ordem.id);
      await updateDoc(orderRef, { etapasAndamento });

      // Atualiza o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento,
        progressoEtapas: calcularProgresso(etapasAndamento, etapas)
      };

      onOrdemUpdate(ordemAtualizada);
      toast.success(`Etapa de ${etapasLabels[etapa]} iniciada`);
    } catch (error) {
      console.error("Erro ao iniciar etapa:", error);
      toast.error("Erro ao iniciar etapa");
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
      const novoProgresso = calcularProgresso(etapasAndamento, etapas);

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
          usarCronometro: false
        }
      };

      // Calcula o novo progresso
      const novoProgresso = calcularProgresso(etapasAndamento, etapas);

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
                onStart={() => handleIniciarEtapa(etapa)}
                onFinish={(tempoTotal) => handleFinalizarEtapa(etapa, tempoTotal)}
                onToggleCronometro={(usarCrono) => handleToggleCronometro(etapa, usarCrono)}
                onCompleteWithoutTimer={() => handleCompleteWithoutTimer(etapa)}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
