
import { useState, useCallback } from 'react';
import { SubAtividade, TipoServico, OrdemServico } from '@/types/ordens';
import { toast } from 'sonner';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

interface UseTrackerSubatividadesProps {
  ordem?: OrdemServico;
  onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void;
}

export const useTrackerSubatividades = ({ ordem, onOrdemUpdate }: UseTrackerSubatividadesProps = {}) => {
  const [isAddingSubatividades, setIsAddingSubatividades] = useState(false);
  
  // Adicionar subatividades específicas a um serviço
  const addSelectedSubatividades = useCallback(async (
    servicoTipo: TipoServico,
    subatividadesNomes: string[]
  ) => {
    if (!ordem) {
      toast.error("Ordem não encontrada");
      console.error("Ordem não encontrada:", ordem);
      return;
    }
    
    if (!ordem.id) {
      toast.error("ID da ordem não encontrado");
      console.error("ordem.id não encontrado:", ordem);
      return;
    }
    
    if (subatividadesNomes.length === 0) {
      toast.warning("Nenhuma subatividade selecionada");
      return;
    }
    
    setIsAddingSubatividades(true);
    
    try {
      // Encontrar o serviço a ser atualizado
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIndex === -1) {
        toast.error(`Serviço ${servicoTipo} não encontrado`);
        setIsAddingSubatividades(false);
        return;
      }
      
      // Preparar as novas subatividades
      const novasSubatividades: SubAtividade[] = subatividadesNomes.map(nome => ({
        id: uuidv4(),
        nome,
        selecionada: true, // Já vem selecionada por padrão
        concluida: false,
        tempoEstimado: 1 // Tempo padrão de 1 hora
      }));
      
      console.log("Novas subatividades a serem adicionadas:", novasSubatividades);
      
      // Criar uma cópia do array de serviços para modificação
      const servicosAtualizados = [...ordem.servicos];
      
      // Se já existir subatividades, adicionar apenas as que não existem
      if (servicosAtualizados[servicoIndex].subatividades?.length) {
        const existentes = servicosAtualizados[servicoIndex].subatividades || [];
        const nomesExistentes = existentes.map(s => s.nome.toLowerCase());
        
        // Filtrar apenas subatividades que não existem ainda
        const novasParaAdicionar = novasSubatividades.filter(
          sub => !nomesExistentes.includes(sub.nome.toLowerCase())
        );
        
        if (novasParaAdicionar.length === 0) {
          toast.info("Todas as subatividades já foram adicionadas");
          setIsAddingSubatividades(false);
          return;
        }
        
        console.log("Subatividades filtradas para adicionar:", novasParaAdicionar);
        
        // Adicionar novas subatividades às existentes
        servicosAtualizados[servicoIndex] = {
          ...servicosAtualizados[servicoIndex],
          subatividades: [...existentes, ...novasParaAdicionar]
        };
      } else {
        // Se não existir nenhuma subatividade, adicionar todas
        servicosAtualizados[servicoIndex] = {
          ...servicosAtualizados[servicoIndex],
          subatividades: novasSubatividades
        };
      }
      
      console.log("Serviços atualizados:", servicosAtualizados);
      
      // Atualizar no Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Buscar a ordem atualizada para garantir que temos os dados mais recentes
      const ordemDoc = await getDoc(ordemRef);
      let ordemAtualizada: OrdemServico;
      
      if (ordemDoc.exists()) {
        ordemAtualizada = { ...ordemDoc.data(), id: ordemDoc.id } as OrdemServico;
        console.log("Ordem atualizada do Firestore:", ordemAtualizada);
      } else {
        // Se não conseguir buscar a ordem atualizada, usar a versão local
        ordemAtualizada = {
          ...ordem,
          servicos: servicosAtualizados
        };
        console.log("Usando ordem local atualizada:", ordemAtualizada);
      }
      
      // Atualizar estado local através do callback
      if (onOrdemUpdate) {
        console.log("Chamando onOrdemUpdate com ordem atualizada");
        onOrdemUpdate(ordemAtualizada);
      } else {
        console.warn("onOrdemUpdate não está definido, não foi possível atualizar a UI");
      }
      
      toast.success(`Subatividades adicionadas com sucesso para ${servicoTipo}`);
    } catch (error) {
      console.error("Erro ao adicionar subatividades:", error);
      toast.error("Erro ao adicionar subatividades");
    } finally {
      setIsAddingSubatividades(false);
    }
  }, [ordem, onOrdemUpdate]);
  
  // Adicionar uma única subatividade personalizada
  const addCustomSubatividade = useCallback(async (
    servicoTipo: TipoServico,
    nome: string,
    tempoEstimado: number = 1
  ) => {
    if (!ordem) {
      toast.error("Ordem não encontrada");
      return;
    }
    
    if (!ordem.id) {
      toast.error("ID da ordem não encontrado");
      return;
    }
    
    if (!nome.trim()) {
      toast.error("Nome da subatividade não pode ser vazio");
      return;
    }
    
    try {
      // Encontrar o serviço a ser atualizado
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIndex === -1) {
        toast.error(`Serviço ${servicoTipo} não encontrado`);
        return;
      }
      
      // Criar nova subatividade
      const novaSubatividade: SubAtividade = {
        id: uuidv4(),
        nome: nome.trim(),
        selecionada: true,
        concluida: false,
        tempoEstimado
      };
      
      // Criar uma cópia do array de serviços para modificação
      const servicosAtualizados = [...ordem.servicos];
      const existentes = servicosAtualizados[servicoIndex].subatividades || [];
      
      // Verificar se já existe subatividade com mesmo nome
      if (existentes.some(s => s.nome.toLowerCase() === nome.trim().toLowerCase())) {
        toast.error("Já existe uma subatividade com este nome");
        return;
      }
      
      // Adicionar nova subatividade
      servicosAtualizados[servicoIndex] = {
        ...servicosAtualizados[servicoIndex],
        subatividades: [...existentes, novaSubatividade]
      };
      
      // Atualizar no Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Buscar a ordem atualizada para garantir que temos os dados mais recentes
      const ordemDoc = await getDoc(ordemRef);
      let ordemAtualizada: OrdemServico;
      
      if (ordemDoc.exists()) {
        ordemAtualizada = { ...ordemDoc.data(), id: ordemDoc.id } as OrdemServico;
      } else {
        // Se não conseguir buscar a ordem atualizada, usar a versão local
        ordemAtualizada = {
          ...ordem,
          servicos: servicosAtualizados
        };
      }
      
      // Atualizar estado local através do callback
      if (onOrdemUpdate) {
        console.log("Chamando onOrdemUpdate com ordem atualizada após adicionar subatividade personalizada");
        onOrdemUpdate(ordemAtualizada);
      }
      
      toast.success(`Subatividade "${nome}" adicionada com sucesso`);
      return novaSubatividade;
    } catch (error) {
      console.error("Erro ao adicionar subatividade:", error);
      toast.error("Erro ao adicionar subatividade");
      return null;
    }
  }, [ordem, onOrdemUpdate]);

  return {
    isAddingSubatividades,
    addSelectedSubatividades,
    addCustomSubatividade
  };
};
