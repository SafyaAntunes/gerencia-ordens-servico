
import { OrdemServico, StatusOS } from "@/types/ordens";

// Define the SetOrdemFunction type that was missing
export type SetOrdemFunction = React.Dispatch<React.SetStateAction<OrdemServico | null>>;

export interface UseOrdemDetalhesResult {
  ordem: OrdemServico | null;
  isLoading: boolean;
  isSubmitting: boolean;
  activeTab: string;
  isEditando: boolean;
  deleteDialogOpen: boolean;
  setActiveTab: (tab: string) => void;
  setIsEditando: (editing: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  handleOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
  handleSubmit: (data: any) => void;
  handleDelete: () => void;
  handleStatusChange: (status: StatusOS) => void;
}
