
import { OrdemServico } from "@/types/ordens";
import { Cliente } from "@/types/ordens";

interface OrdemFormProps {
  onSubmit: (values: any) => void;
  isLoading?: boolean;
  defaultValues?: Partial<OrdemServico>;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
  onCancel?: () => void;
  clientes?: Cliente[];
  isLoadingClientes?: boolean;
  onChange?: (values: any) => void;
}

declare const OrdemForm: React.FC<OrdemFormProps>;

export default OrdemForm;
