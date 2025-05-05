import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";

interface UseEtapaResponsavelProps {
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  funcionarioSelecionadoId: string;
  funcionarioSelecionadoNome: string;
  isEtapaConcluida: (etapaInfo?: any) => boolean;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
  etapaInfo?: any;
}

export function useEtapaResponsavel({
  etapa,
  servicoTipo,
  funcionarioSelecionadoId,
  funcionarioSelecionadoNome,
  isEtapaConcluida,
  onEtapaStatusChange,
  etapaInfo
}: UseEtapaResponsavelProps) {
  
  // Função para salvar o responsável - works during execution
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
  
  const handleCustomTimerStart = (): boolean => {
    console.log("handleCustomTimerStart chamado em useEtapaResponsavel");
    
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
  
  const handleMarcarConcluidoClick = () => {
    if (!funcionarioSelecionadoId) {
      toast.error("É necessário selecionar um responsável antes de concluir a etapa");
      return;
    }
    
    if (onEtapaStatusChange) {
      // Usa o ID e nome do funcionário selecionado
      console.log("Concluindo etapa com funcionário:", funcionarioSelecionadoNome);
      
      onEtapaStatusChange(
        etapa, 
        true, 
        funcionarioSelecionadoId, 
        funcionarioSelecionadoNome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
  };
  
  return {
    handleSaveResponsavel,
    handleCustomTimerStart,
    handleMarcarConcluidoClick
  };
}
