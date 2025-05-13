
import { z } from "zod";
import { SubAtividade, Prioridade, TipoServico, EtapaOS } from "@/types/ordens";
import { Cliente } from "@/types/clientes";

export const formSchema = z.object({
  id: z.string().min(1, { message: "Número da OS é obrigatório" }),
  nome: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  clienteId: z.string({ required_error: "Selecione um cliente" }),
  motorId: z.string().optional(),
  dataAbertura: z.date({ required_error: "Selecione a data de abertura" }),
  dataPrevistaEntrega: z.date({ required_error: "Selecione a data prevista para entrega" }),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"] as const),
  servicosTipos: z.array(z.string()).optional(),
  servicosDescricoes: z.record(z.string()).optional(),
  servicosSubatividades: z.record(z.array(z.any())).optional(),
  etapasTempoPreco: z.record(z.object({
    precoHora: z.number().optional(),
    tempoEstimado: z.number().optional()
  })).optional(),
});

export type FormValues = z.infer<typeof formSchema>;

export interface OrdemFormProps {
  onSubmit: (values: FormValues & { fotosEntrada: File[], fotosSaida: File[] }) => void;
  isLoading?: boolean;
  defaultValues?: Partial<FormValues>;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
  onCancel?: () => void;
  onSubatividadeToggle?: (servicoTipo: string, subatividadeId: string, checked: boolean) => void;
  isSubatividadeEditingEnabled?: boolean;
  clientes?: Cliente[];
  isLoadingClientes?: boolean;
}

export const tiposServico: { value: TipoServico; label: string }[] = [
  { value: "lavagem", label: "Lavagem" },
  { value: "inspecao_inicial", label: "Inspeção Inicial" },
  { value: "bloco", label: "Bloco" },
  { value: "biela", label: "Biela" },
  { value: "cabecote", label: "Cabeçote" },
  { value: "virabrequim", label: "Virabrequim" },
  { value: "eixo_comando", label: "Eixo de Comando" },
  { value: "montagem", label: "Montagem" },
  { value: "dinamometro", label: "Dinamômetro" },
  { value: "inspecao_final", label: "Inspeção Final" }
];

export const ETAPAS_CONFIG = {
  lavagem: {
    icon: "Droplet",
    label: "Lavagem"
  },
  inspecao_inicial: {
    icon: "Search",
    label: "Inspeção Inicial"
  },
  inspecao_final: {
    icon: "FileSearch",
    label: "Inspeção Final"
  }
};
