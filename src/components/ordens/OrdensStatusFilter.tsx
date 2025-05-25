
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { StatusOS } from "@/types/ordens";

const statusOptions: Option[] = [
  { value: "desmontagem", label: "Desmontagem" },
  { value: "inspecao_inicial", label: "Inspeção Inicial" },
  { value: "orcamento", label: "Orçamento" },
  { value: "aguardando_aprovacao", label: "Aguardando Aprovação" },
  { value: "autorizado", label: "Autorizado" },
  { value: "executando_servico", label: "Executando Serviço" },
  { value: "aguardando_peca_cliente", label: "Aguardando Peça (Cliente)" },
  { value: "aguardando_peca_interno", label: "Aguardando Peça (Interno)" },
  { value: "finalizado", label: "Finalizado" },
  { value: "entregue", label: "Entregue" }
];

interface OrdensStatusFilterProps {
  selectedStatus: string[];
  onStatusChange: (status: string[]) => void;
}

export default function OrdensStatusFilter({
  selectedStatus,
  onStatusChange
}: OrdensStatusFilterProps) {
  return (
    <div className="w-64">
      <MultiSelect
        options={statusOptions}
        selected={selectedStatus}
        onChange={onStatusChange}
        placeholder="Filtrar por status..."
        emptyMessage="Nenhum status encontrado"
      />
    </div>
  );
}
