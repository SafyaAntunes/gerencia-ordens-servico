
import { OrdemServico } from "@/types/ordens";

interface OrdemFormProps {
  onSubmit: (values: any) => void;
  isLoading?: boolean;
  defaultValues?: Partial<OrdemServico>;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
  onCancel?: () => void;
}

declare const OrdemForm: React.FC<OrdemFormProps>;

export default OrdemForm;
