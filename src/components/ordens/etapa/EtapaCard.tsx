
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
import { User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  // IMPORTANTE: Priorização corrigida para usar o funcionário da etapa no carregamento
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>("");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>("");
  
  // Fetch funcionarios from database
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const funcionariosData = await getFuncionarios();
        if (funcionariosData) {
          setFuncionariosOptions(funcionariosData);
          
          // Atualizar a ordem de prioridade para usar etapaInfo primeiro
          if (etapaInfo?.funcionarioId) {
            setFuncionarioSelecionadoId(etapaInfo.funcionarioId);
            if (etapaInfo.funcionarioNome) {
              setFuncionarioSelecionadoNome(etapaInfo.funcionarioNome);
            } else {
              // Buscar nome do funcionário se não estiver definido
              const funcionarioEncontrado = funcionariosData.find(f => f.id === etapaInfo.funcionarioId);
              if (funcionarioEncontrado) {
                setFuncionarioSelecionadoNome(funcionarioEncontrado.nome);
              }
            }
          } 
          // Se não tiver etapaInfo, usar o funcionarioId do parâmetro
          else if (funcionarioId) {
            setFuncionarioSelecionadoId(funcionarioId);
            if (funcionarioNome) {
              setFuncionarioSelecionadoNome(funcionarioNome);
            } else {
              // Buscar nome do funcionário se não estiver definido
              const funcionarioEncontrado = funcionariosData.find(f => f.id === funcionarioId);
              if (funcionarioEncontrado) {
                setFuncionarioSelecionadoNome(funcionarioEncontrado.nome);
              }
            }
          }
          // Em último caso, usar o funcionário atual
          else if (funcionario?.id) {
            setFuncionarioSelecionadoId(funcionario.id);
            setFuncionarioSelecionadoNome(funcionario.nome || "");
          }
          
          // Verificar se o funcionário salvo existe na lista e logar aviso
          if (etapaInfo?.funcionarioId) {
            const funcionarioExiste = funcionariosData.some(f => f.id === etapaInfo.funcionarioId);
            if (!funcionarioExiste) {
              console.warn(`Funcionário com ID ${etapaInfo.funcionarioId} não encontrado na lista.`);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
        toast.error("Erro ao carregar lista de funcionários");
      }
    };
    
    carregarFuncionarios();
  }, [etapaInfo, funcionario, funcionarioId, funcionarioNome]);

  // Atualizar o estado quando etapaInfo mudar
  useEffect(() => {
    if (etapaInfo?.funcionarioId) {
      console.log("Atualizando funcionário selecionado a partir de etapaInfo:", etapaInfo.funcionarioId, etapaInfo.funcionarioNome);
      setFuncionarioSelecionadoId(etapaInfo.funcionarioId);
      setFuncionarioSelecionadoNome(etapaInfo.funcionarioNome || "");
    }
  }, [etapaInfo?.funcionarioId, etapaInfo?.funcionarioNome]);

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
    
    // Se estamos iniciando a etapa, vamos atualizar o status com o funcionário responsável
    if (onEtapaStatusChange && !etapaInfo?.iniciado) {
      onEtapaStatusChange(
        etapa,
        false,
        funcionarioSelecionadoId,
        funcionarioSelecionadoNome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
    
    return true; // Permite que o timer inicie automaticamente
  };
  
  // Função para salvar o responsável - FIXED to work during execution
  const handleSaveResponsavel = () => {
    if (!funcionarioSelecionadoId) {
      toast.error("É necessário selecionar um responsável para salvar");
      return;
    }
    
    if (onEtapaStatusChange) {
      // Manter o status atual (concluído ou não) mas atualizar o funcionário
      const etapaConcluida = isEtapaConcluida(etapaInfo);
      const isIniciada = etapaInfo?.iniciado ? true : false;
      
      console.log("Salvando responsável:", {
        etapa,
        concluida: etapaConcluida,
        iniciada: isIniciada,
        funcionarioId: funcionarioSelecionadoId,
        funcionarioNome: funcionarioSelecionadoNome,
        servicoTipo: (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      });
      
      // IMPORTANT: Keep the current iniciado state from etapaInfo instead of setting it to false
      onEtapaStatusChange(
        etapa,
        etapaConcluida,
        funcionarioSelecionadoId,
        funcionarioSelecionadoNome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
      
      toast.success(`Responsável ${funcionarioSelecionadoNome} salvo com sucesso!`);
    } else {
      console.error("onEtapaStatusChange não está definido");
      toast.error("Não foi possível salvar o responsável");
    }
  };

  return (
    <Card className="p-6 mb-4">
      <EtapaHeader 
        etapaNome={etapaNome}
        status={getEtapaStatus(etapaInfo)}
        isEtapaConcluida={isEtapaConcluida(etapaInfo)}
        funcionarioNome={funcionarioSelecionadoNome || etapaInfo?.funcionarioNome}
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
          <div className="flex items-center text-sm font-medium mb-1">
            <User className="h-4 w-4 mr-1" />
            Responsável
          </div>
          
          <div className="flex space-x-2">
            <div className="flex-1">
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
            
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              onClick={handleSaveResponsavel}
              disabled={isEtapaConcluida(etapaInfo)}
            >
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </div>
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
          onSaveResponsavel={handleSaveResponsavel}
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
