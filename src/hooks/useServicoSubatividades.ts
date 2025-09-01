
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
    montagem_parcial: [
      "Preparação", 
      "Montagem parcial do cabeçote", 
      "Montagem parcial do bloco", 
      "Verificação intermediária"
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
      montagem_parcial: ["Preparação", "Limpeza de componentes parciais", "Secagem"],
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
      montagem_parcial: ["Verificação de componentes parciais", "Conferência de peças"],
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
      montagem_parcial: ["Verificação de torque parcial", "Teste básico", "Conformidade com especificações"],
      dinamometro: ["Análise de resultados", "Conformidade com especificações"],
      lavagem: ["Verificação final de limpeza"],
      inspecao_inicial: ["Revisão da inspeção inicial"],
      inspecao_final: ["Inspeção final completa", "Liberação para entrega"]
    }
  };

  return { defaultSubatividades, defaultAtividadesEspecificas };
};
