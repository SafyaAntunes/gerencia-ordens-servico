
import { ServicoStatus } from "../types/servicoTrackerTypes";

/**
 * Define o status do serviço com base no estado atual
 */
export function getServicoStatus(
  isRunning: boolean, 
  isPaused: boolean, 
  concluido: boolean
): ServicoStatus {
  if (concluido) {
    return 'concluido';
  }
  
  if (isRunning) {
    if (isPaused) {
      return 'pausado';
    }
    return 'em_andamento';
  }
  
  return 'nao_iniciado' as ServicoStatus;
}

/**
 * Verifica se o serviço pode ser iniciado
 */
export function canStartServico(
  status: ServicoStatus, 
  temPermissao: boolean
): boolean {
  return status === 'nao_iniciado' && temPermissao;
}

/**
 * Verifica se o serviço pode ser pausado
 */
export function canPauseServico(
  status: ServicoStatus, 
  temPermissao: boolean
): boolean {
  return status === 'em_andamento' && temPermissao;
}

/**
 * Verifica se o serviço pode ser retomado
 */
export function canResumeServico(
  status: ServicoStatus, 
  temPermissao: boolean
): boolean {
  return status === 'pausado' && temPermissao;
}

/**
 * Verifica se o serviço pode ser finalizado
 */
export function canFinishServico(
  status: ServicoStatus, 
  temPermissao: boolean
): boolean {
  return (status === 'em_andamento' || status === 'pausado') && temPermissao;
}
