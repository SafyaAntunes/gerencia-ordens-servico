
import { useState } from 'react';
import { SubAtividade, TipoServico, OrdemServico } from '@/types/ordens';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { 
  validateOrdem, 
  createSubatividades, 
  prepareServiceUpdate, 
  updateOrdemWithNewServicos 
} from './utils';

export function useSubatividadeOperations(
  ordem?: OrdemServico,
  onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void
) {
  const [isAddingSubatividades, setIsAddingSubatividades] = useState(false);
  
  // Add multiple predefined subatividades to a service
  const addSelectedSubatividades = async (
    servicoTipo: TipoServico,
    subatividadesNomes: string[]
  ): Promise<OrdemServico | void> => {
    console.log("useTrackerSubatividades.addSelectedSubatividades - iniciando com:", {
      servicoTipo,
      subatividadesNomes,
      temOrdem: !!ordem,
      temOrdemId: ordem?.id ? true : false,
      temCallback: !!onOrdemUpdate
    });
    
    if (!validateOrdem(ordem)) {
      return Promise.reject("Invalid ordem");
    }
    
    if (subatividadesNomes.length === 0) {
      const warning = "Nenhuma subatividade selecionada";
      toast.warning(warning);
      return Promise.reject(warning);
    }
    
    // Check if already in process of adding
    if (isAddingSubatividades) {
      console.log("Já está adicionando subatividades, ignorando nova solicitação");
      return Promise.reject("Operação em andamento");
    }
    
    setIsAddingSubatividades(true);
    
    try {
      // Find the service to be updated
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIndex === -1) {
        const error = `Serviço ${servicoTipo} não encontrado`;
        toast.error(error);
        return Promise.reject(error);
      }
      
      // Prepare new subatividades
      const novasSubatividades = createSubatividades(subatividadesNomes);
      console.log("Novas subatividades a serem adicionadas:", novasSubatividades);
      
      // Update services with new subatividades
      const servicosAtualizados = prepareServiceUpdate(servicoIndex, ordem.servicos, novasSubatividades);
      
      if (servicosAtualizados === ordem.servicos) {
        setIsAddingSubatividades(false);
        return Promise.resolve();
      }
      
      console.log("Serviços atualizados:", servicosAtualizados);
      
      // Update in Firebase and get updated ordem
      const ordemAtualizada = await updateOrdemWithNewServicos(ordem, servicosAtualizados);
      
      // Update local state through callback
      if (onOrdemUpdate) {
        console.log("Chamando onOrdemUpdate com ordem atualizada");
        onOrdemUpdate(ordemAtualizada);
      } else {
        console.warn("onOrdemUpdate não está definido, não foi possível atualizar a UI");
      }
      
      toast.success(`Subatividades adicionadas com sucesso para ${servicoTipo}`);
      return Promise.resolve(ordemAtualizada);
    } catch (error) {
      console.error("Erro ao adicionar subatividades:", error);
      toast.error("Erro ao adicionar subatividades");
      return Promise.reject(error);
    } finally {
      setIsAddingSubatividades(false);
    }
  };
  
  // Add a single custom subatividade
  const addCustomSubatividade = async (
    servicoTipo: TipoServico,
    nome: string,
    tempoEstimado: number = 1
  ): Promise<SubAtividade | void> => {
    console.log("useTrackerSubatividades.addCustomSubatividade - iniciando com:", {
      servicoTipo,
      nome,
      tempoEstimado,
      temOrdem: !!ordem,
      temOrdemId: ordem?.id ? true : false,
      temCallback: !!onOrdemUpdate
    });
    
    if (!validateOrdem(ordem)) {
      return Promise.reject("Invalid ordem");
    }
    
    if (!nome.trim()) {
      const error = "Nome da subatividade não pode ser vazio";
      toast.error(error);
      return Promise.reject(error);
    }
    
    // Check if already in process of adding
    if (isAddingSubatividades) {
      console.log("Já está adicionando subatividades, ignorando nova solicitação");
      return Promise.reject("Operação em andamento");
    }
    
    setIsAddingSubatividades(true);
    
    try {
      // Find the service to be updated
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIndex === -1) {
        const error = `Serviço ${servicoTipo} não encontrado`;
        toast.error(error);
        return Promise.reject(error);
      }
      
      // Create new subatividade
      const novaSubatividade: SubAtividade = {
        id: uuidv4(),
        nome: nome.trim(),
        selecionada: true,
        concluida: false,
        tempoEstimado
      };
      
      // Create a copy of the services array for modification
      const servicosAtualizados = [...ordem.servicos];
      const existentes = servicosAtualizados[servicoIndex].subatividades || [];
      
      // Check if a subatividade with the same name already exists
      if (existentes.some(s => s.nome.toLowerCase() === nome.trim().toLowerCase())) {
        const error = "Já existe uma subatividade com este nome";
        toast.error(error);
        return Promise.reject(error);
      }
      
      // Add new subatividade
      servicosAtualizados[servicoIndex] = {
        ...servicosAtualizados[servicoIndex],
        subatividades: [...existentes, novaSubatividade]
      };
      
      // Update in Firebase and get updated ordem
      const ordemAtualizada = await updateOrdemWithNewServicos(ordem, servicosAtualizados);
      
      // Update local state through callback
      if (onOrdemUpdate) {
        console.log("Chamando onOrdemUpdate com ordem atualizada");
        onOrdemUpdate(ordemAtualizada);
      } else {
        console.warn("onOrdemUpdate não está definido, não foi possível atualizar a UI");
      }
      
      toast.success(`Subatividade "${nome}" adicionada com sucesso`);
      return Promise.resolve(novaSubatividade);
    } catch (error) {
      console.error("Erro ao adicionar subatividade:", error);
      toast.error("Erro ao adicionar subatividade");
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
}
