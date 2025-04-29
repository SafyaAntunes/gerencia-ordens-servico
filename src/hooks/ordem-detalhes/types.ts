
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
  handleSubmit: (values: any) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleStatusChange: (newStatus: StatusOS) => Promise<void>;
}

// Define the type for setOrdem function
export type SetOrdemFunction = (ordem: OrdemServico | null | ((prev: OrdemServico | null) => OrdemServico | null)) => void;
