
import { useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrdemServico, TipoServico, SubAtividade } from "@/types/ordens";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { fetchSubatividadesPreset } from "@/services/subatividadeService";

/**
 * Hook que fornece operações para adicionar e gerenciar subatividades em serviços
 */
export const useSubatividadeOperations = (ordem?: OrdemServico, onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void) => {
  const [isAddingSubatividades, setIsAddingSubatividades] = useState(false);
  
  /**
   * Adiciona subatividades predefinidas a um serviço
   */
  const addSelectedSubatividades = async (servicoTipo: TipoServico, subatividadesIds: string[]): Promise<void> => {
    if (!ordem?.id) {
      console.error("Ordem não fornecida para addSelectedSubatividades");
      return Promise.reject(new Error("Ordem não fornecida"));
    }
    
    console.log("addSelectedSubatividades iniciado:", { servicoTipo, subatividadesIds, ordemId: ordem.id });
    setIsAddingSubatividades(true);
    
    try {
      // Buscar a ordem mais recente do Firestore
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const ordemSnapshot = await getDoc(ordemRef);
      
      if (!ordemSnapshot.exists()) {
        throw new Error("Ordem não encontrada no Firestore");
      }
      
      // Obter dados atualizados da ordem
      const ordemData = ordemSnapshot.data() as OrdemServico;
      
      // Buscar preset de subatividades do Firestore
      const presetsData = await fetchSubatividadesPreset();
      
      // Encontrar o serviço a ser atualizado
      const servicoExistente = ordemData.servicos.find(s => s.tipo === servicoTipo);
      
      if (!servicoExistente) {
        console.error(`Serviço ${servicoTipo} não encontrado na ordem`, ordemData.servicos);
        throw new Error(`Serviço ${servicoTipo} não encontrado na ordem`);
      }
      
      // Inicializar array de subatividades se não existir
      if (!servicoExistente.subatividades) {
        servicoExistente.subatividades = [];
      }
      
      // Criar um mapa de subatividades existentes para fácil verificação
      const subatividadesExistentes = new Map();
      servicoExistente.subatividades.forEach(sub => {
        subatividadesExistentes.set(sub.id, sub);
      });
      
      // Filtrar presets relevantes e criar novas subatividades
      const novasSubatividades: SubAtividade[] = [];
      
      // Para cada ID de subatividade selecionada, adicionar à lista
      for (const subId of subatividadesIds) {
        // Verificar se a subatividade já existe
        if (!subatividadesExistentes.has(subId)) {
          // Encontrar a definição da subatividade no preset
          const presetItem = presetsData.find(preset => 
            preset.subatividades?.some(sub => sub.id === subId)
          );
          
          if (presetItem) {
            const subatividade = presetItem.subatividades?.find(sub => sub.id === subId);
            
            if (subatividade) {
              novasSubatividades.push({
                id: subatividade.id,
                nome: subatividade.nome,
                selecionada: true,
                concluida: false,
                tempoEstimado: subatividade.tempoEstimado || 1,
                servicoTipo: servicoTipo
              });
            }
          }
        }
      }
      
      console.log(`Adicionando ${novasSubatividades.length} novas subatividades ao serviço ${servicoTipo}`);
      
      // Adicionar novas subatividades à lista existente
      const subatividadesAtualizadas = [
        ...servicoExistente.subatividades,
        ...novasSubatividades
      ];
      
      // Criar serviço atualizado
      const servicoAtualizado = {
        ...servicoExistente,
        subatividades: subatividadesAtualizadas
      };
      
      // Atualizar array de serviços
      const servicosAtualizados = ordemData.servicos.map(s => 
        s.tipo === servicoTipo ? servicoAtualizado : s
      );
      
      // Criar objeto de atualização
      const updateData = {
        servicos: servicosAtualizados
      };
      
      // Atualizar no Firestore
      await updateDoc(ordemRef, updateData);
      
      console.log("Subatividades adicionadas com sucesso:", novasSubatividades);
      
      // Atualizar estado local
      const ordemAtualizada = {
        ...ordemData,
        servicos: servicosAtualizados
      };
      
      // Chamar callback se fornecido
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error("Erro ao adicionar subatividades:", error);
      toast.error("Erro ao adicionar subatividades selecionadas");
      return Promise.reject(error);
    } finally {
      setIsAddingSubatividades(false);
    }
  };
  
  /**
   * Adiciona uma subatividade personalizada a um serviço
   */
  const addCustomSubatividade = async (servicoTipo: TipoServico, nome: string, tempoEstimado: number = 1): Promise<void> => {
    if (!ordem?.id) {
      console.error("Ordem não fornecida para addCustomSubatividade");
      return Promise.reject(new Error("Ordem não fornecida"));
    }
    
    console.log("addCustomSubatividade iniciado:", { servicoTipo, nome, tempoEstimado, ordemId: ordem.id });
    setIsAddingSubatividades(true);
    
    try {
      // Buscar a ordem mais recente do Firestore
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const ordemSnapshot = await getDoc(ordemRef);
      
      if (!ordemSnapshot.exists()) {
        throw new Error("Ordem não encontrada no Firestore");
      }
      
      // Obter dados atualizados da ordem
      const ordemData = ordemSnapshot.data() as OrdemServico;
      
      // Encontrar o serviço a ser atualizado
      const servicoExistente = ordemData.servicos.find(s => s.tipo === servicoTipo);
      
      if (!servicoExistente) {
        console.error(`Serviço ${servicoTipo} não encontrado na ordem`, ordemData.servicos);
        throw new Error(`Serviço ${servicoTipo} não encontrado na ordem`);
      }
      
      // Inicializar array de subatividades se não existir
      if (!servicoExistente.subatividades) {
        servicoExistente.subatividades = [];
      }
      
      // Criar nova subatividade com ID único
      const novaSubatividade: SubAtividade = {
        id: uuidv4(),
        nome: nome,
        selecionada: true,
        concluida: false,
        tempoEstimado: tempoEstimado,
        servicoTipo: servicoTipo
      };
      
      // Adicionar nova subatividade à lista existente
      const subatividadesAtualizadas = [
        ...servicoExistente.subatividades,
        novaSubatividade
      ];
      
      // Criar serviço atualizado
      const servicoAtualizado = {
        ...servicoExistente,
        subatividades: subatividadesAtualizadas
      };
      
      // Atualizar array de serviços
      const servicosAtualizados = ordemData.servicos.map(s => 
        s.tipo === servicoTipo ? servicoAtualizado : s
      );
      
      // Criar objeto de atualização
      const updateData = {
        servicos: servicosAtualizados
      };
      
      // Atualizar no Firestore
      await updateDoc(ordemRef, updateData);
      
      console.log("Subatividade personalizada adicionada com sucesso:", novaSubatividade);
      
      // Atualizar estado local
      const ordemAtualizada = {
        ...ordemData,
        servicos: servicosAtualizados
      };
      
      // Chamar callback se fornecido
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error("Erro ao adicionar subatividade personalizada:", error);
      toast.error("Erro ao adicionar subatividade personalizada");
      return Promise.reject(error);
    } finally {
      setIsAddingSubatividades(false);
    }
  };
  
  return {
    isAddingSubatividades,
    addSelectedSubatividades,
    addCustomSubatividade
  };
};
