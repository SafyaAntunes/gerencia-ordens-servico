
import { EtapaTimer } from "./etapa";
import { EtapaOS, TipoServico } from "@/types/ordens";

export interface OrdemCronometroProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  onStart?: () => void;
  onCustomStart?: () => void; // Prop for custom initialization
  onPause?: (motivo?: string) => void;
  onResume?: () => void;
  onFinish?: (tempoTotal: number) => void;
  isEtapaConcluida?: boolean;
}

export default function OrdemCronometro(props: OrdemCronometroProps) {
  // Simply pass all props to EtapaTimer component
  return <EtapaTimer {...props} />;
}
