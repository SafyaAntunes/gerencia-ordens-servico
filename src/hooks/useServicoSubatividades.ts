
import { TipoServico, TipoAtividade } from "@/types/ordens";

// This hook provides default subactivities for all service types
export const useServicoSubatividades = () => {
  const defaultSubatividades: Record<TipoServico, string[]> = {
    bloco: [
      "Lavagem", 
      "Inspeção", 
      "Análise de trincas", 
      "Retífica", 
      "Brunimento", 
      "Mandrilhamento"
    ],
    biela: [
      "Inspeção", 
      "Alinhamento", 
      "Troca de buchas", 
      "Balanceamento"
    ],
    cabecote: [
      "Lavagem", 
      "Teste de trincas", 
      "Plano", 
      "Assentamento de válvulas", 
      "Sedes", 
      "Guias"
    ],
    virabrequim: [
      "Inspeção", 
      "Retífica", 
      "Polimento", 
      "Balanceamento"
    ],
    eixo_comando: [
      "Inspeção", 
      "Retífica", 
      "Balanceamento"
    ],
    montagem: [
      "Preparação", 
      "Montagem do cabeçote", 
      "Montagem do bloco", 
      "Ajustes finais", 
      "Testes"
    ],
    dinamometro: [
      "Potência", 
      "Torque", 
      "Consumo", 
      "Análise"
    ],
    lavagem: [
      "Preparação", 
      "Lavagem química", 
      "Lavagem externa", 
      "Secagem"
    ],
    inspecao_inicial: [
      "Verificação de trincas", 
      "Medição de componentes", 
      "Verificação dimensional"
    ],
    inspecao_final: [
      "Verificação visual", 
      "Teste de qualidade", 
      "Conformidade com especificações"
    ]
  };

  // Default activities for each service type
  const defaultAtividadesEspecificas: Record<TipoAtividade, Record<TipoServico, string[]>> = {
    lavagem: {
      bloco: ["Preparação", "Lavagem química", "Lavagem externa", "Secagem"],
      biela: ["Preparação", "Lavagem química", "Secagem"],
      cabecote: ["Preparação", "Lavagem química", "Secagem"],
      virabrequim: ["Preparação", "Lavagem química", "Secagem"],
      eixo_comando: ["Preparação", "Lavagem química", "Secagem"],
      montagem: ["Preparação", "Limpeza de componentes", "Secagem"],
      dinamometro: ["Limpeza antes do teste", "Limpeza após o teste"],
      lavagem: ["Preparação", "Limpeza geral", "Secagem"],
      inspecao_inicial: ["Limpeza para inspeção"],
      inspecao_final: ["Limpeza final"]
    },
    inspecao_inicial: {
      bloco: ["Verificação de trincas", "Medição de cilindros", "Verificação de mancais"],
      biela: ["Verificação de alinhamento", "Medição de buchas", "Verificação visual"],
      cabecote: ["Verificação de trincas", "Verificação de válvulas", "Verificação de guias"],
      virabrequim: ["Verificação de trincas", "Medição de mancais", "Verificação visual"],
      eixo_comando: ["Verificação de desgaste", "Medição de pontos", "Verificação visual"],
      montagem: ["Verificação de componentes", "Conferência de peças"],
      dinamometro: ["Verificação de sensores", "Verificação de conexões"],
      lavagem: ["Inspeção de limpeza", "Verificação de produtos químicos"],
      inspecao_inicial: ["Verificação inicial completa", "Documentação"],
      inspecao_final: ["Verificação prévia"]
    },
    inspecao_final: {
      bloco: ["Verificação de medidas", "Teste de pressão", "Conformidade com especificações"],
      biela: ["Verificação de alinhamento final", "Conformidade com especificações"],
      cabecote: ["Teste de vedação", "Verificação de válvulas", "Conformidade com especificações"],
      virabrequim: ["Verificação de polimento", "Verificação de balanceamento", "Conformidade com especificações"],
      eixo_comando: ["Verificação de acabamento", "Conformidade com especificações"],
      montagem: ["Verificação de torque", "Teste de movimentação", "Conformidade com especificações"],
      dinamometro: ["Análise de resultados", "Conformidade com especificações"],
      lavagem: ["Verificação final de limpeza"],
      inspecao_inicial: ["Revisão da inspeção inicial"],
      inspecao_final: ["Inspeção final completa", "Liberação para entrega"]
    },
    retifica: {     // Added entry for retifica
      bloco: ["Verificação de medidas", "Controle de qualidade"],
      biela: ["Verificação de medidas", "Controle de qualidade"],
      cabecote: ["Verificação de medidas", "Controle de qualidade"],
      virabrequim: ["Verificação de medidas", "Controle de qualidade"],
      eixo_comando: ["Verificação de medidas", "Controle de qualidade"],
      montagem: ["Verificação de ajustes", "Controle de qualidade"],
      dinamometro: ["Calibração", "Verificação"],
      lavagem: ["Qualidade da limpeza"],
      inspecao_inicial: ["Verificação de medidas"],
      inspecao_final: ["Verificação final"]
    },
    montagem: {     // Added entry for montagem
      bloco: ["Preparação de componentes", "Montagem precisa"],
      biela: ["Preparação de componentes", "Montagem precisa"],
      cabecote: ["Preparação de componentes", "Montagem precisa"],
      virabrequim: ["Preparação de componentes", "Montagem precisa"],
      eixo_comando: ["Preparação de componentes", "Montagem precisa"],
      montagem: ["Sequência de montagem", "Verificação"],
      dinamometro: ["Preparação para teste"],
      lavagem: ["Preparação para montagem"],
      inspecao_inicial: ["Verificação pré-montagem"],
      inspecao_final: ["Verificação pós-montagem"]
    },
    dinamometro: {  // Added entry for dinamometro
      bloco: ["Preparação para teste", "Análise de desempenho"],
      biela: ["Preparação para teste", "Análise de desempenho"],
      cabecote: ["Preparação para teste", "Análise de desempenho"],
      virabrequim: ["Preparação para teste", "Análise de desempenho"],
      eixo_comando: ["Preparação para teste", "Análise de desempenho"],
      montagem: ["Preparação para teste", "Análise de desempenho"],
      dinamometro: ["Calibração", "Execução de teste"],
      lavagem: ["Limpeza pós-teste"],
      inspecao_inicial: ["Verificação de sensores"],
      inspecao_final: ["Análise de resultados"]
    }
  };

  return { defaultSubatividades, defaultAtividadesEspecificas };
};
