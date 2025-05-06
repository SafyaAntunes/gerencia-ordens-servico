
import { useState } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { OrdemServico } from "@/types/ordens";
import { toast } from "sonner";
import { SetOrdemFunction } from "./types";
import { useStorage } from "@/hooks/useStorage";

export const useOrdemUpdate = (
  id: string | undefined, 
  ordem: OrdemServico | null, 
  setOrdem: SetOrdemFunction,
  fetchMotorDetails: (clienteId: string, motorId: string) => Promise<void>,
  setIsEditando: (editing: boolean) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadFile } = useStorage();

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      if (!id || !ordem) return;
      
      // Preserve existing subactivities and worker information
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
      
      // Preservar informações das etapas, incluindo responsáveis
      const etapasAtualizado = { ...ordem.etapasAndamento };
      
      // Garantir que não perdemos informações de responsáveis ao atualizar a ordem
      console.log("Preservando etapas e responsáveis:", etapasAtualizado);
      
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
        servicos: preserveExistingSubactivities(ordem.servicos, values.servicosTipos),
        etapasAndamento: etapasAtualizado // Preservar informações das etapas
      };
      
      // Processar fotos de entrada
      if (values.fotosEntrada && values.fotosEntrada.length > 0) {
        const existingEntradaUrls = ordem.fotosEntrada?.filter(url => typeof url === 'string') || [];
        const newEntradaFiles = values.fotosEntrada.filter((f: any) => f instanceof File);
        
        // Upload de novos arquivos
        const newEntradaUrls = [];
        for (const file of newEntradaFiles) {
          const url = await uploadFile(file, `ordens/${id}/entrada`);
          if (url) newEntradaUrls.push(url);
        }
        
        updatedOrder.fotosEntrada = [...existingEntradaUrls, ...newEntradaUrls];
      }
      
      // Processar fotos de saída
      if (values.fotosSaida && values.fotosSaida.length > 0) {
        const existingSaidaUrls = ordem.fotosSaida?.filter(url => typeof url === 'string') || [];
        const newSaidaFiles = values.fotosSaida.filter((f: any) => f instanceof File);
        
        // Upload de novos arquivos
        const newSaidaUrls = [];
        for (const file of newSaidaFiles) {
          const url = await uploadFile(file, `ordens/${id}/saida`);
          if (url) newSaidaUrls.push(url);
        }
        
        updatedOrder.fotosSaida = [...existingSaidaUrls, ...newSaidaUrls];
      }
      
      console.log("Atualizando ordem com dados:", updatedOrder);
      
      const orderRef = doc(db, "ordens_servico", id);
      await updateDoc(orderRef, updatedOrder);
      
      setOrdem((prev) => {
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
    console.log("Recebendo atualização de ordem:", ordemAtualizada);
    setOrdem(ordemAtualizada);
  };

  return {
    isSubmitting,
    handleSubmit,
    handleOrdemUpdate
  };
};
