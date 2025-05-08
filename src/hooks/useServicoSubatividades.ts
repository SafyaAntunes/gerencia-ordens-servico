
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
      dinamometro: ["Limpeza antes do teste", "Limpeza após o teste"]
    },
    inspecao_inicial: {
      bloco: ["Verificação de trincas", "Medição de cilindros", "Verificação de mancais"],
      biela: ["Verificação de alinhamento", "Medição de buchas", "Verificação visual"],
      cabecote: ["Verificação de trincas", "Verificação de válvulas", "Verificação de guias"],
      virabrequim: ["Verificação de trincas", "Medição de mancais", "Verificação visual"],
      eixo_comando: ["Verificação de desgaste", "Medição de pontos", "Verificação visual"],
      montagem: ["Verificação de componentes", "Conferência de peças"],
      dinamometro: ["Verificação de sensores", "Verificação de conexões"]
    },
    inspecao_final: {
      bloco: ["Verificação de medidas", "Teste de pressão", "Conformidade com especificações"],
      biela: ["Verificação de alinhamento final", "Conformidade com especificações"],
      cabecote: ["Teste de vedação", "Verificação de válvulas", "Conformidade com especificações"],
      virabrequim: ["Verificação de polimento", "Verificação de balanceamento", "Conformidade com especificações"],
      eixo_comando: ["Verificação de acabamento", "Conformidade com especificações"],
      montagem: ["Verificação de torque", "Teste de movimentação", "Conformidade com especificações"],
      dinamometro: ["Análise de resultados", "Conformidade com especificações"]
    }
  };

  return { defaultSubatividades, defaultAtividadesEspecificas };
};
