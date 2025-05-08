
import { ComponentPropsWithoutRef } from "react";
import { SubAtividade, TipoServico, PrioridadeOS } from "@/types/ordens";

export interface OrdemFormValues {
  id?: string;
  nome: string;
  clienteId: string;
  motorId?: string;
  dataAbertura?: Date;
  dataPrevistaEntrega?: Date;
  prioridade: PrioridadeOS;
  servicosTipos: TipoServico[];
  servicosDescricoes: Record<TipoServico, string>;
  servicosSubatividades: Record<TipoServico, SubAtividade[]>;
}

export interface OrdemFormProps extends ComponentPropsWithoutRef<"form"> {
  onSubmit: (data: OrdemFormValues) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: Partial<OrdemFormValues>;
  defaultFotosEntrada?: string[];
  defaultFotosSaida?: string[];
  onCancel?: () => void;
  onSubatividadeToggle?: (servicoTipo: string, subatividadeId: string, checked: boolean) => void;
  isSubatividadeEditingEnabled?: boolean;
}
