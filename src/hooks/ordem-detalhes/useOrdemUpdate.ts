
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
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
      if (!id || !ordem) {
        toast.error("ID da ordem ou dados não disponíveis");
        setIsSubmitting(false);
        return;
      }
      
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
              subatividades: subatividadesPreservadas
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
      
      // Buscar informações atualizadas do cliente, se o cliente foi alterado
      let clienteData = { ...ordem.cliente };
      if (values.clienteId !== ordem.cliente?.id) {
        try {
          const clienteDoc = await getDoc(doc(db, "clientes", values.clienteId));
          if (clienteDoc.exists()) {
            const clienteInfo = clienteDoc.data();
            clienteData = {
              id: values.clienteId,
              nome: clienteInfo.nome || "Cliente sem nome",
              telefone: clienteInfo.telefone || "",
              email: clienteInfo.email || "",
              ...clienteInfo
            };
          }
        } catch (error) {
          console.error("Erro ao buscar informações do cliente:", error);
        }
      }
      
      // Convert JavaScript Date objects to Firestore Timestamp objects
      const dataAbertura = values.dataAbertura instanceof Date 
        ? Timestamp.fromDate(values.dataAbertura) 
        : Timestamp.now();
      
      const dataPrevistaEntrega = values.dataPrevistaEntrega instanceof Date 
        ? Timestamp.fromDate(values.dataPrevistaEntrega) 
        : Timestamp.now();
      
      // Prepare update object - Use Record<string, any> to avoid type constraints
      const updateData: Record<string, any> = {
        nome: values.nome,
        cliente: clienteData,
        dataAbertura: dataAbertura,
        dataPrevistaEntrega: dataPrevistaEntrega,
        prioridade: values.prioridade,
        motorId: values.motorId,
        servicos: preserveExistingSubactivities(ordem.servicos, values.servicosTipos),
      };
      
      // Initialize fotosEntrada and fotosSaida arrays if they don't exist
      updateData.fotosEntrada = [];
      updateData.fotosSaida = [];
      
      // Atualizar fotos se necessário
      if (values.fotosEntrada && Array.isArray(values.fotosEntrada)) {
        // Processar fotos de entrada
        const existingPhotos = values.fotosEntrada.filter(f => typeof f === 'string' || (f && typeof f === 'object' && f.data));
        const newFiles = values.fotosEntrada.filter(f => f instanceof File);
        
        const uploadedUrls = [];
        for (const file of newFiles) {
          try {
            const url = await uploadFile(file, `ordens/${id}/entrada`);
            if (url) uploadedUrls.push(url);
          } catch (error) {
            console.error("Erro ao fazer upload:", error);
          }
        }
        
        updateData.fotosEntrada = [...existingPhotos, ...uploadedUrls];
      }
      
      if (values.fotosSaida && Array.isArray(values.fotosSaida)) {
        // Processar fotos de saída
        const existingPhotos = values.fotosSaida.filter(f => typeof f === 'string' || (f && typeof f === 'object' && f.data));
        const newFiles = values.fotosSaida.filter(f => f instanceof File);
        
        const uploadedUrls = [];
        for (const file of newFiles) {
          try {
            const url = await uploadFile(file, `ordens/${id}/saida`);
            if (url) uploadedUrls.push(url);
          } catch (error) {
            console.error("Erro ao fazer upload:", error);
          }
        }
        
        updateData.fotosSaida = [...existingPhotos, ...uploadedUrls];
      }
      
      // Atualizar no Firestore
      const orderRef = doc(db, "ordens_servico", id);
      await updateDoc(orderRef, updateData);
      
      // Preparar objeto para atualização local com conversão de Timestamp para Date
      const localUpdateData = {
        ...updateData,
        dataAbertura: values.dataAbertura instanceof Date ? values.dataAbertura : new Date(),
        dataPrevistaEntrega: values.dataPrevistaEntrega instanceof Date ? values.dataPrevistaEntrega : new Date(),
      };
      
      // Atualiza o estado local
      setOrdem((prev) => {
        if (!prev) return null;
        return { ...prev, ...localUpdateData } as OrdemServico;
      });
      
      // Buscar detalhes de motor se houver mudança
      if (values.motorId && values.motorId !== ordem.motorId) {
        await fetchMotorDetails(values.clienteId, values.motorId);
      }
      
      toast.success("Ordem atualizada com sucesso!");
      setIsEditando(false);
      
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem de serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrdemUpdate = (ordemAtualizada: OrdemServico) => {
    // Garantir que os arrays de fotos existam
    if (!ordemAtualizada.fotosEntrada) {
      ordemAtualizada.fotosEntrada = [];
    }
    
    if (!ordemAtualizada.fotosSaida) {
      ordemAtualizada.fotosSaida = [];
    }
    
    // Atualizar o estado
    setOrdem(ordemAtualizada);
  };

  return {
    isSubmitting,
    handleSubmit,
    handleOrdemUpdate
  };
};
