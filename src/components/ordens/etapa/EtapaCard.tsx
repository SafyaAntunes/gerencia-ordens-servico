
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEtapaCard } from "./useEtapaCard";
import { getFuncionarios } from "@/services/funcionarioService";
import { Funcionario } from "@/types/funcionarios";
import { 
  EtapaHeader, 
  EtapaProgressDisplay, 
  EtapaTimerSection, 
  EtapaServicosLista 
} from "./components";
import { useSubatividadesVerifier } from "./hooks/useSubatividadesVerifier";
import { useEtapaStatusHandlers } from "./hooks/useEtapaStatusHandlers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form";
import { User } from "lucide-react";

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
    servicoTipo?: TipoServico;
  };
  servicoTipo?: TipoServico;
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
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
  onEtapaStatusChange
}: EtapaCardProps) {
  const { funcionario } = useAuth();
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const { todasSubatividadesConcluidas } = useSubatividadesVerifier();
  const { 
    isAtivo, 
    setIsAtivo, 
    isEtapaConcluida, 
    getEtapaStatus 
  } = useEtapaStatusHandlers(etapa, servicoTipo);
  
  const {
    podeAtribuirFuncionario,
    podeTrabalharNaEtapa,
    handleIniciarTimer,
    handleTimerStart,
    handleMarcarConcluido
  } = useEtapaCard(etapa, servicoTipo);
  
  // Estado para armazenar o ID e nome do funcionário selecionado
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>("");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>("");
  
  // Fetch real funcionarios from database
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const funcionariosData = await getFuncionarios();
        if (funcionariosData) {
          setFuncionariosOptions(funcionariosData);
          
          // Inicializa com o funcionário atual
          if (funcionario?.id) {
            setFuncionarioSelecionadoId(funcionario.id);
            setFuncionarioSelecionadoNome(funcionario.nome || "");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
        toast.error("Erro ao carregar lista de funcionários");
      }
    };
    
    carregarFuncionarios();
  }, [funcionario]);

  const etapaComCronometro = ['lavagem', 'inspecao_inicial', 'inspecao_final'].includes(etapa);
  
  useEffect(() => {
    if (etapaInfo?.iniciado && !etapaInfo?.concluido) {
      setIsAtivo(true);
    } else {
      setIsAtivo(false);
    }
  }, [etapaInfo, setIsAtivo]);
  
  const handleEtapaConcluida = (tempoTotal: number) => {
    // Verificar se todas as subatividades estão concluídas
    if (!todasSubatividadesConcluidas(servicos)) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
      return;
    }
    
    if (onEtapaStatusChange) {
      // Usa o ID e nome do funcionário selecionado
      onEtapaStatusChange(
        etapa, 
        true, 
        funcionarioSelecionadoId || funcionario?.id, 
        funcionarioSelecionadoNome || funcionario?.nome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
  };
  
  const handleFuncionarioChange = (value: string) => {
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    setFuncionarioSelecionadoNome(funcionarioSelecionado?.nome || "");
  };
  
  const handleMarcarConcluidoClick = () => {
    if (!todasSubatividadesConcluidas(servicos)) {
      toast.error("É necessário concluir todas as subatividades antes de finalizar a etapa");
      return;
    }
    
    if (onEtapaStatusChange) {
      // Usa o ID e nome do funcionário selecionado
      console.log("Concluindo etapa com funcionário:", funcionarioSelecionadoNome || funcionario?.nome);
      
      onEtapaStatusChange(
        etapa, 
        true, 
        funcionarioSelecionadoId || funcionario?.id, 
        funcionarioSelecionadoNome || funcionario?.nome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
  };

  // Esta função será chamada pelo componente EtapaTimer quando o cronômetro for iniciado
  const handleCustomTimerStart = (): boolean => {
    console.log("handleCustomTimerStart chamado em EtapaCard");
    
    if (!funcionarioSelecionadoId) {
      toast.error("É necessário selecionar um responsável antes de iniciar a etapa");
      return false;
    }
    
    return true; // Permite que o timer inicie automaticamente
  };

  return (
    <Card className="p-6 mb-4">
      <EtapaHeader 
        etapaNome={etapaNome}
        status={getEtapaStatus(etapaInfo)}
        isEtapaConcluida={isEtapaConcluida(etapaInfo)}
        funcionarioNome={etapaInfo?.funcionarioNome}
        podeReiniciar={false}
        onReiniciar={() => {}}
      />
      
      <EtapaProgressDisplay 
        servicos={servicos} 
        onAllServicosConcluidos={() => {
          // Não fazer nada automático, deixar usuário clicar em concluir
        }} 
      />
      
      {!isEtapaConcluida(etapaInfo) && (
        <div className="mb-4">
          <FormLabel className="flex items-center text-sm font-medium mb-1">
            <User className="h-4 w-4 mr-1" />
            Responsável
          </FormLabel>
          <Select 
            value={funcionarioSelecionadoId} 
            onValueChange={handleFuncionarioChange}
            disabled={isEtapaConcluida(etapaInfo)}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {funcionariosOptions.map((func) => (
                <SelectItem key={func.id} value={func.id}>
                  {func.nome} {func.id === funcionario?.id ? "(você)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {etapaComCronometro && (
        <EtapaTimerSection 
          ordemId={ordemId}
          funcionarioId={funcionarioSelecionadoId || funcionarioId}
          funcionarioNome={funcionarioSelecionadoNome || funcionarioNome}
          etapa={etapa}
          tipoServico={servicoTipo}
          isEtapaConcluida={isEtapaConcluida(etapaInfo)}
          onEtapaConcluida={handleEtapaConcluida}
          onMarcarConcluido={handleMarcarConcluidoClick}
          onTimerStart={handleTimerStart}
          onCustomStart={handleCustomTimerStart}
        />
      )}
      
      <EtapaServicosLista
        servicos={servicos}
        ordemId={ordemId}
        funcionarioId={funcionarioSelecionadoId || funcionarioId}
        funcionarioNome={funcionarioSelecionadoNome || funcionarioNome}
        etapa={etapa}
        onSubatividadeToggle={onSubatividadeToggle}
        onServicoStatusChange={onServicoStatusChange}
      />
    </Card>
  );
}
