
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { OrdemServico, TipoServico, EtapaOS } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import EtapaCard from "./EtapaCard";
import { ProgressoTotal } from "./ProgressoTotal";
import { EtapaButtons } from "./EtapaButtons";
import { verificarEtapasDisponiveis, getServicosParaEtapa, getEtapaInfo, calcularProgressoTotal } from "@/utils/etapasUtils";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
}

const EtapasTracker = ({ ordem, onOrdemUpdate }: EtapasTrackerProps) => {
  const [etapasAtivas, setEtapasAtivas] = useState<EtapaOS[]>([]);
  const [progressoTotal, setProgressoTotal] = useState(0);
  const [selectedEtapa, setSelectedEtapa] = useState<EtapaOS | null>(null);
  const { funcionario } = useAuth();

  useEffect(() => {
    if (!ordem || !funcionario) {
      setEtapasAtivas([]);
      setSelectedEtapa(null);
      return;
    }

    const etapasDisponiveis = verificarEtapasDisponiveis(ordem);
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
    
    const novoProgressoTotal = calcularProgressoTotal(ordem);
    setProgressoTotal(novoProgressoTotal);
    
    if (ordem.id && novoProgressoTotal > 0) {
      const progressoFracao = novoProgressoTotal / 100;
      atualizarProgressoNoDB(ordem.id, progressoFracao);
    }
  }, [ordem, funcionario]);

  const atualizarProgressoNoDB = async (ordenId: string, progresso: number) => {
    try {
      const ordemRef = doc(db, "ordens_servico", ordenId);
      await updateDoc(ordemRef, { progressoEtapas: progresso });
    } catch (error) {
      console.error("Erro ao atualizar progresso da ordem:", error);
    }
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
      
      const ordemRef = doc(db, "ordens", ordem.id);
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

  const etapasDisponiveis = verificarEtapasDisponiveis(ordem);

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
          <ProgressoTotal progressoTotal={progressoTotal} />
          
          <EtapaButtons
            etapasAtivas={etapasAtivas}
            selectedEtapa={selectedEtapa}
            etapasDisponiveis={etapasDisponiveis}
            isRetificaHabilitada={isRetificaHabilitada()}
            isInspecaoFinalHabilitada={isInspecaoFinalHabilitada()}
            onEtapaSelect={setSelectedEtapa}
          />
          
          <Separator className="my-4" />

          {selectedEtapa && funcionario && (
            <EtapaCard
              key={selectedEtapa}
              ordemId={ordem.id}
              etapa={selectedEtapa}
              etapaNome={etapaNomesBR[selectedEtapa]}
              funcionarioId={funcionario.id}
              funcionarioNome={funcionario.nome}
              servicos={getServicosParaEtapa(ordem, selectedEtapa, funcionario.nivelPermissao, funcionario.especialidades)}
              etapaInfo={getEtapaInfo(ordem, selectedEtapa)}
              onEtapaStatusChange={handleEtapaStatusChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapasTracker;
