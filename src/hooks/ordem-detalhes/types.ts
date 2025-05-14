
import { OrdemServico, StatusOS } from "@/types/ordens";

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
