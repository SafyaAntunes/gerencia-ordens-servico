
import { useState, useCallback } from 'react';
import { SubAtividade, TipoServico, OrdemServico } from '@/types/ordens';
import { toast } from 'sonner';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useServicoSubatividades } from '@/hooks/useServicoSubatividades';
import { v4 as uuidv4 } from 'uuid';

interface UseTrackerSubatividadesProps {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void;
}

export const useTrackerSubatividades = ({ ordem, onOrdemUpdate }: UseTrackerSubatividadesProps) => {
  const [isAddingSubatividades, setIsAddingSubatividades] = useState(false);
  const { defaultSubatividades } = useServicoSubatividades();
  
  // Adicionar subatividades predefinidas a um serviço
  const addDefaultSubatividades = useCallback(async (servicoTipo: TipoServico) => {
    if (!ordem?.id) {
      toast.error("ID da ordem não encontrado");
      return;
    }
    
    setIsAddingSubatividades(true);
    
    try {
      // Obter subatividades padrão para este tipo de serviço
      const subatividadesPadrao = defaultSubatividades[servicoTipo] || [];
      
      if (subatividadesPadrao.length === 0) {
        toast.warning(`Não há subatividades configuradas para ${servicoTipo}`);
        setIsAddingSubatividades(false);
        return;
      }
      
      // Encontrar o serviço a ser atualizado
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIndex === -1) {
        toast.error(`Serviço ${servicoTipo} não encontrado`);
        setIsAddingSubatividades(false);
        return;
      }
      
      // Preparar as novas subatividades
      const novasSubatividades: SubAtividade[] = subatividadesPadrao.map(nome => ({
        id: uuidv4(),
        nome,
        selecionada: true, // Já vem selecionada por padrão
        concluida: false,
        tempoEstimado: 1 // Tempo padrão de 1 hora
      }));
      
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
      
      // Atualizar no Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualizar estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      toast.success(`Subatividades adicionadas com sucesso para ${servicoTipo}`);
    } catch (error) {
      console.error("Erro ao adicionar subatividades:", error);
      toast.error("Erro ao adicionar subatividades");
    } finally {
      setIsAddingSubatividades(false);
    }
  }, [ordem, defaultSubatividades, onOrdemUpdate]);
  
  // Adicionar uma única subatividade personalizada
  const addCustomSubatividade = useCallback(async (
    servicoTipo: TipoServico,
    nome: string,
    tempoEstimado: number = 1
  ) => {
    if (!ordem?.id) {
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
      
      // Atualizar estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      if (onOrdemUpdate) {
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
    addDefaultSubatividades,
    addCustomSubatividade
  };
};
