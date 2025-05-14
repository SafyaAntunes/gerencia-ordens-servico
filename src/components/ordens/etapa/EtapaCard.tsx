
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { useEtapaResponsavel } from "./hooks/useEtapaResponsavel";
import { EtapaOS, Servico, TipoServico, OrdemServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getFuncionarios } from "@/services/funcionarioService";
import { Funcionario } from "@/types/funcionarios";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import EtapaStatus from "./EtapaStatus";
import EtapaProgresso from "./EtapaProgresso";
import EtapaConcluiButton from "./EtapaConcluiButton";
import { EtapaServicos } from "./EtapaServicos";
import EtapaTimer from "./EtapaTimer";
import FuncionariosResponsaveis from "./components/FuncionariosResponsaveis";
import { useEtapaPermissoes } from "./hooks/useEtapaPermissoes";
import { EtapaResponsavelManager } from "./EtapaResponsavelManager";

interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  servicos?: Servico[];
  etapaInfo?: {
    concluido?: boolean;
    iniciado?: Date;
    finalizado?: Date;
    usarCronometro?: boolean;
    pausas?: { inicio: number; fim?: number; motivo?: string }[];
    funcionarioId?: string;
    funcionarioNome?: string;
    funcionariosIds?: string[];
    funcionariosNomes?: string[];
    servicoTipo?: TipoServico;
  };
  ordem: OrdemServico;
  servicoTipo?: TipoServico;
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
  onSubatividadeSelecionadaToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onFuncionariosChange?: (etapa: EtapaOS, funcionariosIds: string[], funcionariosNomes: string[], servicoTipo?: TipoServico) => void;
  onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void;
}

export default function EtapaCard({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  servicos = [],
  etapaInfo,
  ordem,
  servicoTipo,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange,
  onSubatividadeSelecionadaToggle,
  onFuncionariosChange,
  onOrdemUpdate
}: EtapaCardProps) {
  const { funcionario } = useAuth();
  const { podeAtribuirFuncionario, podeTrabalharNaEtapa } = useEtapaPermissoes(etapa, servicoTipo);
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>(etapaInfo?.funcionarioId || "");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string | undefined>(etapaInfo?.funcionarioNome);
  const [localServicos, setLocalServicos] = useState<Servico[]>(servicos);
  const [isReloading, setIsReloading] = useState(false);
  
  // Log received ordem and servicos
  useEffect(() => {
    console.log("EtapaCard component - Ordem recebida:", {
      id: ordem.id, 
      servicosCount: ordem.servicos?.length || 0
    });
    console.log("EtapaCard component - Serviços recebidos:", servicos);
  }, [ordem, servicos]);

  // Update local state when servicos from props change
  useEffect(() => {
    setLocalServicos(servicos);
  }, [servicos]);
  
  // Usar o hook personalizado para a lógica do responsável pela etapa
  const { 
    handleSaveResponsavel,
    handleRemoverFuncionario,
    handleCustomTimerStart, 
    handleMarcarConcluidoClick,
    isSaving
  } = useEtapaResponsavel({
    etapa,
    servicoTipo,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    isEtapaConcluida: !!etapaInfo?.concluido,
    onEtapaStatusChange,
    etapaInfo,
    ordemId
  });
  
  // Atualizar os estados locais quando etapaInfo mudar
  useEffect(() => {
    if (etapaInfo?.funcionarioId) {
      setFuncionarioSelecionadoId(etapaInfo.funcionarioId);
      setFuncionarioSelecionadoNome(etapaInfo.funcionarioNome);
    }
  }, [etapaInfo?.funcionarioId, etapaInfo?.funcionarioNome]);
  
  // Fetch funcionarios from database
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const funcionariosData = await getFuncionarios();
        if (funcionariosData) {
          setFuncionariosOptions(funcionariosData);
        }
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
        toast.error("Erro ao carregar lista de funcionários");
      }
    };
    
    carregarFuncionarios();
  }, []);
  
  // Function to reload ordem data from Firebase
  const reloadOrdemData = useCallback(async () => {
    if (!ordemId) return;
    
    setIsReloading(true);
    console.log("EtapaCard - Recarregando dados da ordem do Firebase:", ordemId);
    
    try {
      const ordemRef = doc(db, "ordens_servico", ordemId);
      const ordemSnap = await getDoc(ordemRef);
      
      if (ordemSnap.exists()) {
        const ordemData = ordemSnap.data() as OrdemServico;
        console.log("EtapaCard - Dados atualizados da ordem:", ordemData);
        
        // Update local state with fresh data
        if (onOrdemUpdate) {
          console.log("EtapaCard - Chamando callback onOrdemUpdate com dados atualizados");
          onOrdemUpdate(ordemData);
        }
        
        // Find and update local servicos if servicoTipo is specified
        if (servicoTipo) {
          const servicosAtualizados = ordemData.servicos.filter(s => {
            if (etapa === "inspecao_inicial" || etapa === "inspecao_final") {
              return s.tipo === servicoTipo;
            }
            if (etapa === "retifica") {
              return ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo);
            }
            return s.tipo === etapa;
          });
          
          console.log("EtapaCard - Serviços atualizados:", servicosAtualizados);
          setLocalServicos(servicosAtualizados);
        }
      } else {
        console.log("EtapaCard - Ordem não encontrada no Firebase");
      }
    } catch (error) {
      console.error("EtapaCard - Erro ao recarregar dados da ordem:", error);
    } finally {
      setIsReloading(false);
    }
  }, [ordemId, etapa, servicoTipo, onOrdemUpdate]);
  
  // Handle ordem updates from child components
  const handleOrdemUpdate = useCallback((ordemAtualizada: OrdemServico) => {
    console.log("EtapaCard component - handleOrdemUpdate:", ordemAtualizada);
    
    // Update local state
    if (ordemAtualizada.servicos) {
      // Filter servicos relevant to this etapa
      const servicosAtualizados = ordemAtualizada.servicos.filter(s => {
        if (etapa === "inspecao_inicial" || etapa === "inspecao_final") {
          return servicoTipo ? s.tipo === servicoTipo : false;
        }
        if (etapa === "retifica") {
          return ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo);
        }
        return s.tipo === etapa;
      });
      
      console.log("EtapaCard - Atualizando serviços locais:", servicosAtualizados);
      setLocalServicos(servicosAtualizados);
    }
    
    // Pass up to parent if available
    if (onOrdemUpdate) {
      onOrdemUpdate(ordemAtualizada);
    }
    
    // Reload fresh data from Firebase after a short delay
    setTimeout(reloadOrdemData, 500);
  }, [etapa, servicoTipo, onOrdemUpdate, reloadOrdemData]);
  
  // Verificar se todas as subatividades dos serviços estão concluídas
  const todasSubatividadesConcluidas = () => {
    if (localServicos.length === 0) return true;
    
    return localServicos.every(servico => {
      const subatividades = servico.subatividades?.filter(s => s.selecionada) || [];
      return subatividades.length === 0 || subatividades.every(sub => sub.concluida);
    });
  };

  const etapaComCronometro = ['lavagem', 'inspecao_inicial', 'inspecao_final'].includes(etapa);
  
  // Verificar se a etapa está concluída
  const isEtapaConcluida = () => {
    if ((etapa === "inspecao_inicial" || etapa === "inspecao_final") && servicoTipo) {
      return etapaInfo?.concluido && etapaInfo?.servicoTipo === servicoTipo;
    }
    return etapaInfo?.concluido;
  };
  
  // Determinar o status da etapa
  const getEtapaStatus = () => {
    if (isEtapaConcluida()) {
      return "concluido";
    } else if (etapaInfo?.iniciado) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };

  // Lidar com a atribuição de múltiplos funcionários
  const handleFuncionariosChangeLocal = (ids: string[], nomes: string[]) => {
    console.log("Funcionários atribuídos:", { ids, nomes });
    
    if (onFuncionariosChange) {
      onFuncionariosChange(
        etapa, 
        ids, 
        nomes, 
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
      
      // Se houver pelo menos um funcionário na lista, usar o primeiro como responsável principal
      if (ids.length > 0 && nomes.length > 0) {
        setFuncionarioSelecionadoId(ids[0]);
        setFuncionarioSelecionadoNome(nomes[0]);
      }
    }
  };
  
  // Lidar com a etapa concluída pelo timer
  const handleEtapaConcluida = (tempoTotal: number) => {
    // Verificar se todas as subatividades estão concluídas
    if (!todasSubatividadesConcluidas()) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
      return;
    }
    
    handleMarcarConcluidoClick();
  };

  return (
    <Card className="p-6 mb-4">
      {/* Componente invisível para gerenciamento de status do funcionário */}
      <EtapaResponsavelManager
        ordemId={ordemId}
        etapa={etapa}
        servicoTipo={servicoTipo}
        funcionarioId={funcionarioSelecionadoId || etapaInfo?.funcionarioId}
        funcionarioNome={funcionarioSelecionadoNome || etapaInfo?.funcionarioNome}
        isEtapaConcluida={!!etapaInfo?.concluido}
      />
      
      <EtapaStatus 
        etapaNome={etapaNome}
        status={getEtapaStatus()}
        isEtapaConcluida={isEtapaConcluida()}
        funcionarioNome={etapaInfo?.funcionarioNome}
        podeReiniciar={podeAtribuirFuncionario || podeTrabalharNaEtapa()}
        onReiniciar={async () => {
          if (onEtapaStatusChange) {
            await onEtapaStatusChange(
              etapa, 
              false, // não concluída
              funcionarioSelecionadoId || funcionario?.id || "",
              funcionarioSelecionadoNome || funcionario?.nome || "",
              (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
            );
            
            toast.success("Etapa reaberta para continuação");
            
            // Reload data after status change
            setTimeout(reloadOrdemData, 500);
          }
        }}
      />
      
      <EtapaProgresso servicos={localServicos} />
      
      {/* Atribuição de Funcionários Responsáveis */}
      {(podeAtribuirFuncionario || podeTrabalharNaEtapa()) && (
        <FuncionariosResponsaveis
          funcionarioId={etapaInfo?.funcionarioId}
          funcionarioNome={etapaInfo?.funcionarioNome}
          funcionariosIds={etapaInfo?.funcionariosIds}
          funcionariosNomes={etapaInfo?.funcionariosNomes}
          ordemId={ordemId}
          etapa={etapa}
          servicoTipo={servicoTipo}
          isEtapaConcluida={isEtapaConcluida()}
          onFuncionariosChange={handleFuncionariosChangeLocal}
        />
      )}
      
      {isReloading ? (
        <div className="py-4 text-center text-muted-foreground">
          Atualizando dados...
        </div>
      ) : (
        <EtapaServicos
          servicos={localServicos}
          ordem={ordem}
          funcionarioId={funcionarioSelecionadoId || funcionarioId}
          funcionarioNome={funcionarioSelecionadoNome || funcionarioNome}
          etapa={etapa}
          onSubatividadeToggle={onSubatividadeToggle}
          onServicoStatusChange={onServicoStatusChange}
          onSubatividadeSelecionadaToggle={onSubatividadeSelecionadaToggle}
          onOrdemUpdate={handleOrdemUpdate}
        />
      )}
      
      {!isEtapaConcluida() && todasSubatividadesConcluidas() && (
        <EtapaConcluiButton
          isConcluida={isEtapaConcluida()}
          todasSubatividadesConcluidas={todasSubatividadesConcluidas()}
          onConcluir={handleMarcarConcluidoClick}
          temFuncionarioSelecionado={!!funcionarioSelecionadoId}
        />
      )}
      
      {/* Botão para forçar recarregamento dos dados */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-primary"
          onClick={reloadOrdemData}
          disabled={isReloading}
        >
          {isReloading ? "Atualizando..." : "Atualizar dados"}
        </button>
      </div>
    </Card>
  );
}
