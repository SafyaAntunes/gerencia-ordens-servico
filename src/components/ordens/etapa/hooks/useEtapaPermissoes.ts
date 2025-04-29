
import { useAuth } from "@/hooks/useAuth";
import { EtapaOS, TipoServico } from "@/types/ordens";

export function useEtapaPermissoes(etapa: EtapaOS, servicoTipo?: TipoServico) {
  const { funcionario } = useAuth();
  
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
  
  // Verificação para determinar se o usuário pode reabrir uma atividade já concluída
  const podeReabrirAtividade = () => {
    // Apenas administradores podem reabrir atividades
    return funcionario?.nivelPermissao === 'admin';
  };
  
  return {
    funcionario,
    podeAtribuirFuncionario,
    podeTrabalharNaEtapa,
    podeReabrirAtividade
  };
}
