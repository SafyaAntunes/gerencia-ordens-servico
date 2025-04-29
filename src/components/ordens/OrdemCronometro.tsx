
import { EtapaTimer } from "./etapa";
import { EtapaOS, TipoServico } from "@/types/ordens";

export interface OrdemCronometroProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  onStart?: () => void;
  onCustomStart?: () => void; 
  onPause?: (motivo?: string) => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
  isEtapaConcluida?: boolean;
}

export default function OrdemCronometro(props: OrdemCronometroProps) {
  console.log("OrdemCronometro rendering with props:", props);
  
  // Verificar se as props essenciais estão presentes
  if (!props.ordemId || !props.etapa) {
    console.error("OrdemCronometro: props essenciais estão faltando", props);
  }
  
  return <EtapaTimer {...props} />;
}
