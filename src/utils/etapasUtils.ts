
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";

export const verificarEtapasDisponiveis = (ordem: OrdemServico) => {
  const temMontagem = ordem.servicos.some(s => s.tipo === 'montagem');
  const temDinamometro = ordem.servicos.some(s => s.tipo === 'dinamometro');
  return {
    montagem: temMontagem,
    dinamometro: temDinamometro
  };
};

export const getServicosParaEtapa = (ordem: OrdemServico, etapa: EtapaOS, funcionarioNivelPermissao?: string, funcionarioEspecialidades?: string[]): Servico[] => {
  switch (etapa) {
    case 'retifica':
      if (funcionarioNivelPermissao !== 'admin' && funcionarioNivelPermissao !== 'gerente') {
        return ordem.servicos.filter(servico =>
          ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo) &&
          funcionarioEspecialidades?.includes(servico.tipo)
        );
      } else {
        return ordem.servicos.filter(servico =>
          ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
        );
      }
    case 'montagem':
      return ordem.servicos.filter(servico => servico.tipo === 'montagem');
    case 'dinamometro':
      return ordem.servicos.filter(servico => servico.tipo === 'dinamometro');
    case 'lavagem':
      return ordem.servicos.filter(servico => servico.tipo === 'lavagem');
    case 'inspecao_inicial':
    case 'inspecao_final':
      return [];
    default:
      return [];
  }
};

export const getEtapaInfo = (ordem: OrdemServico, etapa: EtapaOS, servicoTipo?: TipoServico) => {
  return ordem.etapasAndamento[etapa];
};

export const calcularProgressoTotal = (ordem: OrdemServico) => {
  const etapasPossiveis: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
  
  const etapasRelevantes = etapasPossiveis.filter(etapa => {
    if (etapa === "retifica") {
      return ordem.servicos?.some(s => 
        ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo));
    } else if (etapa === "montagem") {
      return ordem.servicos?.some(s => s.tipo === "montagem");
    } else if (etapa === "dinamometro") {
      return ordem.servicos?.some(s => s.tipo === "dinamometro");
    } else if (etapa === "lavagem") {
      return ordem.servicos?.some(s => s.tipo === "lavagem");
    }
    return true;
  });
  
  const totalEtapas = etapasRelevantes.length;
  const etapasConcluidas = etapasRelevantes.filter(etapa => 
    ordem.etapasAndamento?.[etapa]?.concluido
  ).length;
  
  const servicosAtivos = ordem.servicos?.filter(s => {
    return s.subatividades?.some(sub => sub.selecionada) || true;
  }) || [];
  
  const totalServicos = servicosAtivos.length;
  const servicosConcluidos = servicosAtivos.filter(s => s.concluido).length;
  
  const totalItens = (totalEtapas * 2) + (totalServicos * 1);
  const itensConcluidos = (etapasConcluidas * 2) + (servicosConcluidos * 1);
  
  return totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;
};
