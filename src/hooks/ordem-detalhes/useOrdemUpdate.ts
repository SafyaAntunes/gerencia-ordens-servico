
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { OrdemServico } from "@/types/ordens";
import { toast } from "sonner";
import { SetOrdemFunction } from "./types";

export const useOrdemUpdate = (
  id: string | undefined, 
  ordem: OrdemServico | null, 
  setOrdem: SetOrdemFunction,
  fetchMotorDetails: () => Promise<void>,
  setIsEditando: (isEditando: boolean) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    if (!id || !ordem) return;
    
    try {
      setIsSubmitting(true);
      
      // Combine formData with existing ordem, preserving service statuses and funcionarios
      const updatedOrdem = {
        ...ordem,
        ...formData,
        servicos: formData.servicos.map((newServico: any, index: number) => {
          // Preserve existing service data if available
          const existingServico = ordem.servicos[index] || {};
          return {
            ...newServico,
            // Preserve status, funcionarioId and funcionarioNome if they exist
            status: existingServico.status || 'nao_iniciado',
            funcionarioId: existingServico.funcionarioId || null,
            funcionarioNome: existingServico.funcionarioNome || null,
            concluido: existingServico.concluido || false,
            dataConclusao: existingServico.dataConclusao || null
          };
        })
      };
      
      const orderRef = doc(db, "ordens_servico", id);
      await updateDoc(orderRef, updatedOrdem);
      
      setOrdem(updatedOrdem);
      await fetchMotorDetails();
      
      toast.success("Ordem atualizada com sucesso");
      setIsEditando(false);
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrdemUpdate = async (ordemAtualizada: OrdemServico) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      const orderRef = doc(db, "ordens_servico", id);
      
      // Ensure we don't lose data during updates
      await updateDoc(orderRef, ordemAtualizada);
      
      setOrdem(ordemAtualizada);
      toast.success("Ordem atualizada com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    handleSubmit,
    handleOrdemUpdate
  };
};
