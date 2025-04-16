
import { OrdemServico } from "@/types/ordens";
import { Cliente } from "@/types/clientes";

interface OrdemFormProps {
  onSubmit: (values: any) => void;
  isLoading?: boolean;
  defaultValues?: Partial<OrdemServico>;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
  onCancel?: () => void;
  clientes?: Cliente[];
  isLoadingClientes?: boolean;
  hideSubatividades?: boolean;
}

declare const OrdemForm: React.FC<OrdemFormProps>;

export default OrdemForm;
