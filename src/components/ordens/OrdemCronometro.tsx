
import { EtapaTimer } from "./etapa";
import { EtapaOS, TipoServico } from "@/types/ordens";

export interface OrdemCronometroProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  onStart?: () => void;
  onCustomStart?: () => boolean; // Updated to return boolean
  onPause?: (motivo?: string) => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
  isEtapaConcluida?: boolean;
}

export default function OrdemCronometro(props: OrdemCronometroProps) {
  // Log detalhado para debug
  console.log("OrdemCronometro rendering with props:", props);
  
  // Validação de props críticas
  if (!props.ordemId || !props.etapa) {
    console.error("OrdemCronometro: props essenciais estão faltando", props);
    return <div className="text-red-500">Erro: Dados insuficientes para iniciar o cronômetro</div>;
  }
  
  // Validação adicional para etapas específicas
  const isValidEtapa = ['lavagem', 'inspecao_inicial', 'retifica', 'montagem', 'dinamometro', 'inspecao_final'].includes(props.etapa);
  
  if (!isValidEtapa) {
    console.error(`OrdemCronometro: tipo de etapa inválido: ${props.etapa}`);
    return <div className="text-red-500">Erro: Tipo de etapa inválido</div>;
  }
  
  return <EtapaTimer {...props} />;
}
