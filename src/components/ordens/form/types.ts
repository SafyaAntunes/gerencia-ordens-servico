
import { z } from "zod";
import { Prioridade, SubAtividade } from "@/types/ordens";

// Underlying zod schema for form validation
export const formSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(3, { message: "Nome da ordem deve ter no mínimo 3 caracteres" }),
  clienteId: z.string().min(1, { message: "Cliente é obrigatório" }),
  motorId: z.string().optional(),
  dataAbertura: z.date(),
  dataPrevistaEntrega: z.date(),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"] as const),
  servicosTipos: z.array(z.string()).optional(),
  servicosDescricoes: z.record(z.string()).optional(),
  etapasTempoPreco: z.record(z.any()).optional(),
});

// Type derived from zod schema
export type FormValues = z.infer<typeof formSchema> & {
  servicosSubatividades?: Record<string, SubAtividade[]>;
};

// Props for the OrdemForm component
export interface OrdemFormProps {
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
  defaultValues?: FormValues;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
  onCancel?: () => void;
  clientes?: any[];
  isLoadingClientes?: boolean;
}
