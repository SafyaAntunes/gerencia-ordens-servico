
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useEtapaResponsavel } from "./hooks/useEtapaResponsavel";
import { EtapaOS, Servico, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getFuncionarios } from "@/services/funcionarioService";
import { Funcionario } from "@/types/funcionarios";
import EtapaStatus from "./EtapaStatus";
import EtapaProgresso from "./EtapaProgresso";
import EtapaConcluiButton from "./EtapaConcluiButton";
import EtapaServicos from "./EtapaServicos";
import EtapaTimer from "./EtapaTimer";
import FuncionariosResponsaveis from "./components/FuncionariosResponsaveis";

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
  servicoTipo?: TipoServico;
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
  onSubatividadeSelecionadaToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onFuncionariosChange?: (etapa: EtapaOS, funcionariosIds: string[], funcionariosNomes: string[], servicoTipo?: TipoServico) => void;
}

export default function EtapaCard({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  servicos = [],
  etapaInfo,
  servicoTipo,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange,
  onSubatividadeSelecionadaToggle,
  onFuncionariosChange
}: EtapaCardProps) {
  const { funcionario } = useAuth();
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>(etapaInfo?.funcionarioId || "");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string | undefined>(etapaInfo?.funcionarioNome);
  
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

  // Verificar se o usuário tem permissão para atribuir funcionários
  const podeAtribuirFuncionario = funcionario?.nivelPermissao === 'admin' || 
                                 funcionario?.nivelPermissao === 'gerente';
  
  const podeTrabalharNaEtapa = () => {
    if (funcionario?.nivelPermissao === 'admin' || 
        funcionario?.nivelPermissao === 'gerente') {
      return true;
    }
    
    if (etapa === 'lavagem') {
      return funcionario?.especialidades?.includes('lavagem');
    }
    
    if (etapa === 'inspecao_inicial' || etapa === 'inspecao_final') {
      if (servicoTipo) {
        return funcionario?.especialidades?.includes(servicoTipo);
      }
      return false;
    }
    
    if (servicoTipo) {
      return funcionario?.especialidades?.includes(servicoTipo);
    }
    
    return funcionario?.especialidades?.includes(etapa);
  };
  
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
  
  // Verificar se todas as subatividades dos serviços estão concluídas
  const todasSubatividadesConcluidas = () => {
    if (servicos.length === 0) return true;
    
    return servicos.every(servico => {
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
  
  // Lidar com a mudança de funcionário
  const handleFuncionarioChange = (id: string) => {
    console.log("handleFuncionarioChange:", id);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === id);
    setFuncionarioSelecionadoId(id);
    setFuncionarioSelecionadoNome(funcionarioSelecionado?.nome);
  };

  // Lidar com a atribuição de múltiplos funcionários
  const handleFuncionariosChange = (ids: string[], nomes: string[]) => {
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
      
      toast.success("Funcionários atribuídos com sucesso");
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
          }
        }}
      />
      
      <EtapaProgresso servicos={servicos} />
      
      {/* Novo componente de Funcionários Responsáveis */}
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
          onFuncionariosChange={handleFuncionariosChange}
        />
      )}
      
      {etapaComCronometro && (
        <EtapaTimer
          ordemId={ordemId}
          funcionarioId={funcionarioSelecionadoId || funcionarioId}
          funcionarioNome={funcionarioSelecionadoNome || funcionarioNome}
          etapa={etapa}
          servicoTipo={servicoTipo}
          isEtapaConcluida={isEtapaConcluida()}
          onFinish={handleEtapaConcluida}
          onCustomTimerStart={handleCustomTimerStart}
        />
      )}
      
      <EtapaServicos
        servicos={servicos}
        ordemId={ordemId}
        funcionarioId={funcionarioSelecionadoId || funcionarioId}
        funcionarioNome={funcionarioSelecionadoNome || funcionarioNome}
        etapa={etapa}
        onSubatividadeToggle={onSubatividadeToggle}
        onServicoStatusChange={onServicoStatusChange}
        onSubatividadeSelecionadaToggle={onSubatividadeSelecionadaToggle}
      />
      
      {!isEtapaConcluida() && todasSubatividadesConcluidas() && (
        <EtapaConcluiButton
          isConcluida={isEtapaConcluida()}
          todasSubatividadesConcluidas={todasSubatividadesConcluidas()}
          onConcluir={handleMarcarConcluidoClick}
          temFuncionarioSelecionado={!!funcionarioSelecionadoId}
        />
      )}
    </Card>
  );
}
