import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { OrdemServico, Servico, ServicoStatus, TipoServico } from "@/types/ordens";
import { toast } from "sonner";
import { SetOrdemFunction } from "./types";
import { useStorage } from "@/hooks/useStorage";

// Define a type for the existingServico to prevent type errors
interface ExistingServicoPartial {
  status?: ServicoStatus;
  funcionarioId?: string | null;
  funcionarioNome?: string | null;
  concluido?: boolean;
  dataConclusao?: Date | null;
}

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const useOrdemUpdate = (
  id: string | undefined, 
  ordem: OrdemServico | null, 
  setOrdem: SetOrdemFunction,
  fetchMotorDetails: () => Promise<void>,
  setIsEditando: (isEditando: boolean) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadFiles } = useStorage();

  const handleSubmit = async (formData: any) => {
    if (!id || !ordem) return;
    
    try {
      setIsSubmitting(true);
      
      // Create new services array from formData
      const servicos: Servico[] = [];
      
      // If servicosTipos exists, create services from it
      if (formData.servicosTipos && Array.isArray(formData.servicosTipos)) {
        formData.servicosTipos.forEach((tipo: TipoServico) => {
          // Find existing service to preserve its data
          const existingServico = ordem.servicos.find(s => s.tipo === tipo);
          
          servicos.push({
            tipo,
            descricao: formData.servicosDescricoes?.[tipo] || "",
            concluido: existingServico?.concluido || false,
            status: existingServico?.status || 'nao_iniciado',
            funcionarioId: existingServico?.funcionarioId || null,
            funcionarioNome: existingServico?.funcionarioNome || null,
            dataConclusao: existingServico?.dataConclusao || null,
            subatividades: existingServico?.subatividades || [],
            atividadesRelacionadas: existingServico?.atividadesRelacionadas || {}
          });
        });
      }

      // Process new photos
      let fotosEntrada = [...(formData.fotosEntrada || [])];
      let fotosSaida = [...(formData.fotosSaida || [])];

      // Upload new photos to Storage
      const newFotosEntrada = fotosEntrada.filter(foto => foto instanceof File);
      const newFotosSaida = fotosSaida.filter(foto => foto instanceof File);

      if (newFotosEntrada.length > 0) {
        const urls = await uploadFiles(newFotosEntrada, `ordens/${id}/entrada`);
        fotosEntrada = [
          ...fotosEntrada.filter(foto => !(foto instanceof File)),
          ...urls
        ];
      }

      if (newFotosSaida.length > 0) {
        const urls = await uploadFiles(newFotosSaida, `ordens/${id}/saida`);
        fotosSaida = [
          ...fotosSaida.filter(foto => !(foto instanceof File)),
          ...urls
        ];
      }
      
      // Combine formData with existing ordem, preserving service statuses and funcionarios
      const updatedOrdem = {
        ...ordem,
        ...formData,
        servicos,
        fotosEntrada,
        fotosSaida
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
      
      // Process new photos
      let fotosEntrada = [...(ordemAtualizada.fotosEntrada || [])];
      let fotosSaida = [...(ordemAtualizada.fotosSaida || [])];

      // Upload new photos to Storage
      const newFotosEntrada = fotosEntrada.filter(foto => foto instanceof File);
      const newFotosSaida = fotosSaida.filter(foto => foto instanceof File);

      if (newFotosEntrada.length > 0) {
        const urls = await uploadFiles(newFotosEntrada, `ordens/${id}/entrada`);
        fotosEntrada = [
          ...fotosEntrada.filter(foto => !(foto instanceof File)),
          ...urls
        ];
      }

      if (newFotosSaida.length > 0) {
        const urls = await uploadFiles(newFotosSaida, `ordens/${id}/saida`);
        fotosSaida = [
          ...fotosSaida.filter(foto => !(foto instanceof File)),
          ...urls
        ];
      }
      
      // Ensure we don't lose data during updates
      const updatedData = {
        ...ordemAtualizada,
        fotosEntrada,
        fotosSaida
      };
      
      await updateDoc(orderRef, updatedData);
      
      setOrdem(updatedData);
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
