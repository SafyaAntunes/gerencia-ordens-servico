
import { TipoServico } from "@/types/ordens";

// This hook provides default subactivities for all service types, including 'lavagem'
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
      "Preparação", 
      "Aquecimento", 
      "Teste de potência", 
      "Teste de torque", 
      "Análise"
    ],
    lavagem: [
      "Preparação", 
      "Lavagem externa", 
      "Lavagem interna", 
      "Secagem", 
      "Inspeção final"
    ]
  };

  return { defaultSubatividades };
};
