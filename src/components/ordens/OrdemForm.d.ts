
import { OrdemServico } from "@/types/ordens";

interface OrdemFormProps {
  onSubmit: (values: any) => void;
  isLoading?: boolean;
  defaultValues?: Partial<OrdemServico>;
  defaultFotosEntrada?: any[];
  defaultFotosSaida?: any[];
}

declare const OrdemForm: React.FC<OrdemFormProps>;

export default OrdemForm;
