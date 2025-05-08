
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
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
      
      // Garantir que não perdemos informações de cliente
      const clienteAtualizado = {
        ...ordem.cliente,
        id: values.clienteId || ordem.cliente.id,
      };
      
      const updatedOrder: Partial<OrdemServico> = {
        id: ordem.id, // Garantir que o ID nunca se perca
        nome: values.nome,
        cliente: clienteAtualizado,
        dataAbertura: values.dataAbertura,
        dataPrevistaEntrega: values.dataPrevistaEntrega,
        prioridade: values.prioridade,
        motorId: values.motorId,
        servicos: preserveExistingSubactivities(ordem.servicos, values.servicosTipos),
        etapasAndamento: etapasAtualizado // Preservar informações das etapas
      };
      
      // Garantir que fotosEntrada e fotosSaida sejam sempre arrays
      const fotosEntradaAtual = Array.isArray(ordem.fotosEntrada) ? ordem.fotosEntrada : [];
      const fotosSaidaAtual = Array.isArray(ordem.fotosSaida) ? ordem.fotosSaida : [];

      // Processamento de fotos de entrada
      if (values.fotosEntrada && Array.isArray(values.fotosEntrada)) {
        // Filtrar apenas arquivos válidos (File ou string URL)
        const validFotosEntrada = values.fotosEntrada.filter((f: any) => {
          if (f instanceof File) return true;
          if (typeof f === 'string' && f.startsWith('http')) return true;
          if (f && typeof f === 'object' && f.data && typeof f.data === 'string') return true;
          return false;
        });
        
        // Fotos existentes que são URLs ou objetos com data
        const existingEntradaUrls = validFotosEntrada.filter((f: any) => 
          typeof f === 'string' || (f && typeof f === 'object' && f.data)
        );
          
        // Novos arquivos para upload
        const newEntradaFiles = validFotosEntrada.filter((f: any) => f instanceof File);
        
        console.log("Fotos de entrada existentes:", existingEntradaUrls.length);
        console.log("Novas fotos de entrada para upload:", newEntradaFiles.length);
        
        // Upload de novos arquivos
        const newEntradaUrls = [];
        for (const file of newEntradaFiles) {
          try {
            const url = await uploadFile(file, `ordens/${id}/entrada`);
            if (url) {
              console.log("Foto entrada enviada com sucesso:", url);
              newEntradaUrls.push(url);
            }
          } catch (uploadError) {
            console.error("Erro ao fazer upload:", uploadError);
          }
        }
        
        updatedOrder.fotosEntrada = [...existingEntradaUrls, ...newEntradaUrls];
        console.log("Total de fotos de entrada após update:", updatedOrder.fotosEntrada.length);
      } else {
        // Garantir que fotosEntrada seja sempre um array, mesmo que vazio
        updatedOrder.fotosEntrada = fotosEntradaAtual;
      }
      
      // Processamento de fotos de saída
      if (values.fotosSaida && Array.isArray(values.fotosSaida)) {
        // Filtrar apenas arquivos válidos (File ou string URL)
        const validFotosSaida = values.fotosSaida.filter((f: any) => {
          if (f instanceof File) return true;
          if (typeof f === 'string' && f.startsWith('http')) return true;
          if (f && typeof f === 'object' && f.data && typeof f.data === 'string') return true;
          return false;
        });
        
        // Fotos existentes que são URLs ou objetos com data
        const existingSaidaUrls = validFotosSaida.filter((f: any) => 
          typeof f === 'string' || (f && typeof f === 'object' && f.data)
        );
          
        // Novos arquivos para upload
        const newSaidaFiles = validFotosSaida.filter((f: any) => f instanceof File);
        
        console.log("Fotos de saída existentes:", existingSaidaUrls.length);
        console.log("Novas fotos de saída para upload:", newSaidaFiles.length);
        
        // Upload de novos arquivos
        const newSaidaUrls = [];
        for (const file of newSaidaFiles) {
          try {
            const url = await uploadFile(file, `ordens/${id}/saida`);
            if (url) {
              console.log("Foto saída enviada com sucesso:", url);
              newSaidaUrls.push(url);
            }
          } catch (uploadError) {
            console.error("Erro ao fazer upload:", uploadError);
          }
        }
        
        updatedOrder.fotosSaida = [...existingSaidaUrls, ...newSaidaUrls];
        console.log("Total de fotos de saída após update:", updatedOrder.fotosSaida.length);
      } else {
        // Garantir que fotosSaida seja sempre um array, mesmo que vazio
        updatedOrder.fotosSaida = fotosSaidaAtual;
      }
      
      console.log("Atualizando ordem com dados:", updatedOrder);
      
      const orderRef = doc(db, "ordens_servico", id);
      await updateDoc(orderRef, updatedOrder);
      
      // Atualizar o estado da ordem com os dados atualizados
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

  // Permitir sempre salvar a ordem, mesmo que nenhuma alteração tenha sido feita
  const handleOrdemUpdate = (ordemAtualizada: OrdemServico) => {
    console.log("Recebendo atualização de ordem:", ordemAtualizada);
    
    // Garantir que os arrays de fotos existam
    if (!ordemAtualizada.fotosEntrada) {
      ordemAtualizada.fotosEntrada = [];
    }
    
    if (!ordemAtualizada.fotosSaida) {
      ordemAtualizada.fotosSaida = [];
    }
    
    // Garantir que o id permaneça consistente
    if (!ordemAtualizada.id && ordem?.id) {
      ordemAtualizada.id = ordem.id;
    }
    
    setOrdem(ordemAtualizada);
  };

  return {
    isSubmitting,
    handleSubmit,
    handleOrdemUpdate
  };
};
