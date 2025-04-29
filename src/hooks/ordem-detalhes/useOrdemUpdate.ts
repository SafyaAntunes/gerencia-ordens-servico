
import { useState } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { OrdemServico } from "@/types/ordens";
import { toast } from "sonner";

export const useOrdemUpdate = (
  id: string | undefined, 
  ordem: OrdemServico | null, 
  setOrdem: (ordem: OrdemServico | null) => void,
  fetchMotorDetails: (clienteId: string, motorId: string) => Promise<void>,
  setIsEditando: (editing: boolean) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      if (!id || !ordem) return;
      
      const processImages = async (files: File[], folder: string, existingUrls: string[] = []): Promise<string[]> => {
        const imageUrls: string[] = [...existingUrls];
        
        for (const file of files) {
          if (file && file instanceof File) {
            const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            imageUrls.push(url);
          }
        }
        
        return imageUrls;
      };
      
      // Preserve existing subactivities
      const preserveExistingSubactivities = (currentServicos = [], newServicosTipos = []) => {
        const servicosMap = currentServicos.reduce((acc, servico) => {
          acc[servico.tipo] = servico;
          return acc;
        }, {});
        
        return newServicosTipos.map(tipo => {
          const existingServico = servicosMap[tipo];
          
          const novasSubatividades = values.servicosSubatividades?.[tipo] || [];
          
          if (existingServico && existingServico.subatividades) {
            const subatividadesPreservadas = novasSubatividades.map(novaSub => {
              const subExistente = existingServico.subatividades?.find(s => s.id === novaSub.id);
              if (subExistente) {
                return {
                  ...novaSub,
                  concluida: subExistente.concluida !== undefined ? subExistente.concluida : novaSub.concluida
                };
              }
              return novaSub;
            });
            
            return {
              tipo,
              descricao: values.servicosDescricoes?.[tipo] || "",
              concluido: existingServico.concluido || false,
              subatividades: subatividadesPreservadas,
              funcionarioId: existingServico.funcionarioId,
              funcionarioNome: existingServico.funcionarioNome,
              dataConclusao: existingServico.dataConclusao
            };
          }
          
          return {
            tipo,
            descricao: values.servicosDescricoes?.[tipo] || "",
            concluido: false,
            subatividades: novasSubatividades
          };
        });
      };
      
      const updatedOrder: Partial<OrdemServico> = {
        nome: values.nome,
        cliente: {
          ...ordem.cliente,
          id: values.clienteId,
        },
        dataAbertura: values.dataAbertura,
        dataPrevistaEntrega: values.dataPrevistaEntrega,
        prioridade: values.prioridade,
        motorId: values.motorId,
        servicos: preserveExistingSubactivities(ordem.servicos, values.servicosTipos)
      };
      
      if (values.fotosEntrada && values.fotosEntrada.length > 0) {
        const existingEntradaUrls = ordem.fotosEntrada?.filter(url => typeof url === 'string') || [];
        const newEntradaUrls = await processImages(
          values.fotosEntrada.filter((f: any) => f instanceof File), 
          `ordens/${id}/entrada`,
          existingEntradaUrls
        );
        updatedOrder.fotosEntrada = newEntradaUrls;
      }
      
      if (values.fotosSaida && values.fotosSaida.length > 0) {
        const existingSaidaUrls = ordem.fotosSaida?.filter(url => typeof url === 'string') || [];
        const newSaidaUrls = await processImages(
          values.fotosSaida.filter((f: any) => f instanceof File), 
          `ordens/${id}/saida`,
          existingSaidaUrls
        );
        updatedOrder.fotosSaida = newSaidaUrls;
      }
      
      const orderRef = doc(db, "ordens_servico", id);
      await updateDoc(orderRef, updatedOrder);
      
      setOrdem(prev => {
        if (!prev) return null;
        return { ...prev, ...updatedOrder } as OrdemServico;
      });
      
      if (values.motorId && values.motorId !== ordem.motorId) {
        await fetchMotorDetails(values.clienteId, values.motorId);
      }
      
      toast.success("Ordem atualizada com sucesso!");
      setIsEditando(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erro ao atualizar ordem de serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrdemUpdate = (ordemAtualizada: OrdemServico) => {
    setOrdem(ordemAtualizada);
  };

  return {
    isSubmitting,
    handleSubmit,
    handleOrdemUpdate
  };
};
