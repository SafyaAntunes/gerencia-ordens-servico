
import { z } from "zod";
import { SubAtividade, Prioridade } from "@/types/ordens";

export const formSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  clienteId: z.string().min(1, "Selecione um cliente"),
  motorId: z.string().optional(),
  dataAbertura: z.date(),
  dataPrevistaEntrega: z.date(),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"] as const),
  servicosTipos: z.array(z.string()).min(1, "Selecione pelo menos um tipo de serviço"),
  servicosDescricoes: z.record(z.string()).optional(),
  etapasTempoPreco: z.record(z.any()).optional(),
});

export type FormValues = z.infer<typeof formSchema>;

export interface OrdemFormProps {
  onSubmit: (data: FormValues & { 
    servicosDescricoes: Record<string, string>,
    fotosEntrada?: any[],
    fotosSaida?: any[],
    etapasTempoPreco?: Record<string, any>
  }) => void;
  isLoading?: boolean;
  defaultValues?: Partial<FormValues>;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
  onCancel?: () => void;
  clientes?: any[];
  isLoadingClientes?: boolean;
  onSubatividadeToggle?: (tipo: string, subId: string, checked: boolean) => void;
  prepareSubatividadesForEdit?: () => Record<string, SubAtividade[]>;
  isSubatividadeEditingEnabled?: boolean;
}
