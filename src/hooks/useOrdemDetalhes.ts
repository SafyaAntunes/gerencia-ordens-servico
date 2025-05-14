
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrdemFetch } from "./ordem-detalhes/useOrdemFetch";
import { useOrdemStatus } from "./ordem-detalhes/useOrdemStatus";
import { useOrdemUpdate } from "./ordem-detalhes/useOrdemUpdate";
import { useOrdemDelete } from "./ordem-detalhes/useOrdemDelete";
import { UseOrdemDetalhesResult } from "./ordem-detalhes/types";

export const useOrdemDetalhes = (id: string | undefined): UseOrdemDetalhesResult & { canEditThisOrder: boolean } => {
  const [activeTab, setActiveTab] = useState<string>("detalhes");
  const [isEditando, setIsEditando] = useState(false);
  const { funcionario, canEditOrder } = useAuth();
  
  // Fetch ordem data
  const { ordem, setOrdem, isLoading, fetchMotorDetails } = useOrdemFetch(id);
  
  // Handle ordem status
  const { isSubmitting: isStatusSubmitting, handleStatusChange } = useOrdemStatus(id, setOrdem);
  
  // Handle ordem update
  const { 
    isSubmitting: isUpdateSubmitting, 
    handleSubmit, 
    handleOrdemUpdate 
  } = useOrdemUpdate(id, ordem, setOrdem, fetchMotorDetails, setIsEditando);
  
  // Handle ordem delete
  const { 
    isSubmitting: isDeleteSubmitting, 
    deleteDialogOpen, 
    setDeleteDialogOpen, 
    handleDelete 
  } = useOrdemDelete(id);
  
  // Combine submission states
  const isSubmitting = isStatusSubmitting || isUpdateSubmitting || isDeleteSubmitting;
  
  // Check if the current user can edit this order
  const canEditThisOrder = ordem ? canEditOrder(ordem.id) : false;

  return {
    ordem,
    isLoading,
    isSubmitting,
    activeTab,
    isEditando,
    deleteDialogOpen,
    setActiveTab,
    setIsEditando,
    setDeleteDialogOpen,
    handleOrdemUpdate,
    handleSubmit,
    handleDelete,
    handleStatusChange,
    canEditThisOrder
  };
};
