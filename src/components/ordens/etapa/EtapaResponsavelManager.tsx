
import { useEffect } from "react";
import { useFuncionariosDisponibilidade } from "@/hooks/useFuncionariosDisponibilidade";
import { marcarFuncionarioEmServico } from "@/services/funcionarioEmServicoService";
import { EtapaOS, TipoServico } from "@/types/ordens";

interface EtapaResponsavelManagerProps {
  ordemId: string;
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  funcionarioId?: string;
  funcionarioNome?: string;
  isEtapaConcluida?: boolean;
}

/**
 * Componente para gerenciar o status de ocupação do funcionário em tempo real
 */
export function EtapaResponsavelManager({
  ordemId,
  etapa,
  servicoTipo,
  funcionarioId,
  funcionarioNome,
  isEtapaConcluida
}: EtapaResponsavelManagerProps) {
  const { funcionariosStatus } = useFuncionariosDisponibilidade();

  // Efeito para sincronizar o status do funcionário quando ele for atribuído
  useEffect(() => {
    // Se não tiver funcionário atribuído ou a etapa já foi concluída, não precisa sincronizar
    if (!funcionarioId || isEtapaConcluida) {
      return;
    }

    // Verificar se o funcionário está marcado como ocupado nesta etapa
    const funcionarioAtual = funcionariosStatus.find(f => f.id === funcionarioId);
    const estaOcupadoNestaEtapa = funcionarioAtual?.atividadeAtual?.ordemId === ordemId && 
                                 funcionarioAtual?.atividadeAtual?.etapa === etapa &&
                                 (
                                   !servicoTipo || 
                                   funcionarioAtual?.atividadeAtual?.servicoTipo === servicoTipo
                                 );

    // Se não está ocupado nesta etapa, atualizamos o status dele
    if (funcionarioAtual && !estaOcupadoNestaEtapa && funcionarioAtual.status !== 'inativo') {
      console.log(`Sincronizando status do funcionário ${funcionarioId} (${funcionarioNome}) para a etapa ${etapa}`);
      
      // Função para atualizar o status do funcionário de forma assíncrona
      const atualizarStatusFuncionario = async () => {
        await marcarFuncionarioEmServico(
          funcionarioId,
          ordemId,
          etapa,
          servicoTipo
        );
      };

      atualizarStatusFuncionario();
    }
  }, [funcionarioId, ordemId, etapa, servicoTipo, funcionariosStatus, isEtapaConcluida, funcionarioNome]);

  // Este componente não renderiza nada, apenas gerencia o estado
  return null;
}
