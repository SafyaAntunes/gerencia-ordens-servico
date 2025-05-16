
import { useState } from "react";
import { useOrdemFetch } from "./ordem-detalhes/useOrdemFetch";
import { useOrdemStatus } from "./ordem-detalhes/useOrdemStatus";
import { useOrdemUpdate } from "./ordem-detalhes/useOrdemUpdate";
import { useOrdemDelete } from "./ordem-detalhes/useOrdemDelete";
import { UseOrdemDetalhesResult } from "./ordem-detalhes/types";

export const useOrdemDetalhes = (id: string | undefined): UseOrdemDetalhesResult => {
  const [activeTab, setActiveTab] = useState<string>("detalhes");
  const [isEditando, setIsEditando] = useState(false);
  
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
  };
};
