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
      
      // Enhanced function to properly preserve existing subactivities and add new ones
      const preserveExistingSubactivities = (currentServicos = [], newServicosTipos = []) => {
        // Create a map of existing services for quick lookup
        const servicosMap = currentServicos.reduce((acc, servico) => {
          acc[servico.tipo] = servico;
          return acc;
        }, {});
        
        console.log("Current servicos:", currentServicos);
        console.log("New servicos tipos:", newServicosTipos);
        
        return newServicosTipos.map(tipo => {
          const existingServico = servicosMap[tipo];
          console.log(`Processing tipo: ${tipo}, exists: ${!!existingServico}`);
          
          // Get the updated subatividades from the form values
          const formSubatividades = values.servicosSubatividades?.[tipo] || [];
          console.log(`Form subatividades for ${tipo}:`, formSubatividades);
          
          // If this is a new service type (not in the existing order)
          const isNewServiceType = !existingServico;
          
          // Process subatividades - preserve existing status for those that were already present
          let processedSubatividades = formSubatividades
            .filter(formSub => formSub.selecionada) // Only include selected subatividades
            .map(formSub => {
              // Find if this subatividade existed before
              const existingSub = existingServico?.subatividades?.find(s => s.id === formSub.id);
              
              // If the subatividade existed, preserve its 'concluida' status
              // Otherwise, set it to false for new selections
              const preservedStatus = existingSub ? existingSub.concluida : false;
              console.log(`Subatividade ${formSub.nome}: preserving status = ${preservedStatus}`);
              
              return {
                ...formSub,
                concluida: preservedStatus
              };
            });
          
          console.log(`Processed subatividades for ${tipo}:`, processedSubatividades);
          
          // If this is not a new service type AND we don't have any processed subatividades,
          // but we have existing subatividades, preserve those
          if (!isNewServiceType && processedSubatividades.length === 0 && existingServico?.subatividades?.length > 0) {
            console.log(`No processed subatividades, preserving existing for ${tipo}`);
            processedSubatividades = [...existingServico.subatividades];
          }
          
          // Build the servico object
          return {
            tipo,
            descricao: values.servicosDescricoes?.[tipo] || "",
            concluido: existingServico?.concluido || false,
            subatividades: processedSubatividades,
            funcionarioId: existingServico?.funcionarioId,
            funcionarioNome: existingServico?.funcionarioNome,
            dataConclusao: existingServico?.dataConclusao
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
      
      // Remover os funcionários responsáveis de todas as etapas
      if (ordem.etapasAndamento) {
        const etapasAtualizadas = { ...ordem.etapasAndamento };
        
        Object.keys(etapasAtualizadas).forEach(etapa => {
          if (etapasAtualizadas[etapa]) {
            // Remover as referências ao funcionário responsável
            const etapaAtualizada = { ...etapasAtualizadas[etapa] };
            delete etapaAtualizada.funcionarioId;
            delete etapaAtualizada.funcionarioNome;
            
            etapasAtualizadas[etapa] = etapaAtualizada;
          }
        });
        
        updateData.etapasAndamento = etapasAtualizadas;
      }
      
      // Limpar dados indefinidos antes de enviar para o Firestore
      // Firestore não aceita valores undefined
      const cleanObject = (obj: Record<string, any>): Record<string, any> => {
        const cleanedObj: Record<string, any> = {};
        
        Object.keys(obj).forEach(key => {
          // Pular campos indefinidos
          if (obj[key] === undefined) return;
          
          // Limpar objetos aninhados
          if (obj[key] !== null && typeof obj[key] === 'object' && !(obj[key] instanceof Date) && !(obj[key] instanceof Timestamp)) {
            if (Array.isArray(obj[key])) {
              cleanedObj[key] = obj[key].map((item: any) => {
                if (item !== null && typeof item === 'object') {
                  return cleanObject(item);
                }
                return item;
              }).filter((item: any) => item !== undefined);
            } else {
              cleanedObj[key] = cleanObject(obj[key]);
            }
          } else {
            cleanedObj[key] = obj[key];
          }
        });
        
        return cleanedObj;
      };
      
      // Limpar todos os valores undefined antes de enviar para o Firestore
      const cleanedUpdateData = cleanObject(updateData);
      
      // Inicializar arrays de fotos se não existirem
      if (!cleanedUpdateData.fotosEntrada) {
        cleanedUpdateData.fotosEntrada = [];
      }
      
      if (!cleanedUpdateData.fotosSaida) {
        cleanedUpdateData.fotosSaida = [];
      }
      
      // Processar fotos se existirem
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
        
        cleanedUpdateData.fotosEntrada = [...existingPhotos, ...uploadedUrls];
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
        
        cleanedUpdateData.fotosSaida = [...existingPhotos, ...uploadedUrls];
      }
      
      console.log("Dados para atualização:", cleanedUpdateData);
      
      // Atualizar no Firestore
      const orderRef = doc(db, "ordens_servico", id);
      await updateDoc(orderRef, cleanedUpdateData);
      
      // Preparar objeto para atualização local com conversão de Timestamp para Date
      const localUpdateData = {
        ...cleanedUpdateData,
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
