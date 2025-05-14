
import { useState } from "react";
import { db } from "@/lib/firebase";
import { 
  doc, 
  updateDoc, 
  getDoc, 
  arrayUnion, 
  collection, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { toast } from "sonner";
import { OrdemServico, SubAtividade, TipoServico } from "@/types/ordens";
import { v4 as uuidv4 } from "uuid";
import { getSubatividadesByTipo } from "@/services/subatividadeService";

/**
 * Hook for operations related to subatividades in tracking context
 */
export const useSubatividadeOperations = (
  ordem?: OrdemServico,
  onOrdemUpdate?: (ordemAtualizada: OrdemServico) => void
) => {
  const [isAddingSubatividades, setIsAddingSubatividades] = useState(false);

  /**
   * Add selected subatividades to a servico
   */
  const addSelectedSubatividades = async (
    servicoTipo: TipoServico,
    subatividadesNomes: string[]
  ): Promise<OrdemServico | void> => {
    if (!ordem?.id) {
      toast.error("Ordem não encontrada");
      return;
    }

    try {
      setIsAddingSubatividades(true);
      console.log(`Adicionando ${subatividadesNomes.length} subatividades ao serviço ${servicoTipo}`);

      // Buscar a ordem mais recente do Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const ordemSnap = await getDoc(ordemRef);

      if (!ordemSnap.exists()) {
        toast.error("Ordem não encontrada");
        return;
      }

      const ordemAtual = ordemSnap.data() as OrdemServico;
      
      // Encontrar o serviço para adicionar as subatividades
      const servicoIdx = ordemAtual.servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIdx === -1) {
        toast.error(`Serviço ${servicoTipo} não encontrado na ordem`);
        return;
      }

      // Criar novas subatividades
      const novasSubatividades: SubAtividade[] = subatividadesNomes.map(nome => ({
        id: uuidv4(),
        nome,
        concluida: false,
        selecionada: true,
        tempoEstimado: 1 // Tempo padrão
      }));

      // Adicionar subatividades ao serviço
      const servicosAtualizados = [...ordemAtual.servicos];
      if (!servicosAtualizados[servicoIdx].subatividades) {
        servicosAtualizados[servicoIdx].subatividades = [];
      }

      // Filtrar subatividades já existentes
      const subatividadesExistentes = servicosAtualizados[servicoIdx].subatividades || [];
      const subatividadesExistentesNomes = subatividadesExistentes.map(sub => sub.nome.toLowerCase());
      
      const subatividadesFiltradas = novasSubatividades.filter(
        subatividade => !subatividadesExistentesNomes.includes(subatividade.nome.toLowerCase())
      );

      if (subatividadesFiltradas.length === 0) {
        toast.info("Todas as subatividades selecionadas já existem");
        return ordemAtual;
      }

      // Adicionar as novas subatividades
      servicosAtualizados[servicoIdx].subatividades = [
        ...subatividadesExistentes,
        ...subatividadesFiltradas
      ];

      // Atualizar a ordem no Firebase
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      console.log("Subatividades adicionadas com sucesso:", subatividadesFiltradas);
      
      // Buscar a ordem atualizada
      const ordemSnapAtualizada = await getDoc(ordemRef);
      if (ordemSnapAtualizada.exists()) {
        const ordemAtualizada = ordemSnapAtualizada.data() as OrdemServico;
        
        // Notificar componente pai da atualização
        if (onOrdemUpdate) {
          console.log("Chamando onOrdemUpdate após adicionar subatividades");
          onOrdemUpdate(ordemAtualizada);
        }
        
        return ordemAtualizada;
      }
      
      return ordemAtual;
    } catch (error) {
      console.error("Erro ao adicionar subatividades:", error);
      toast.error("Erro ao adicionar subatividades");
    } finally {
      setIsAddingSubatividades(false);
    }
  };

  /**
   * Add custom subatividade to a servico
   */
  const addCustomSubatividade = async (
    servicoTipo: TipoServico,
    nome: string,
    tempoEstimado: number = 1
  ): Promise<SubAtividade | void> => {
    if (!nome.trim() || !ordem?.id) {
      toast.error("Nome da subatividade ou ordem inválidos");
      return;
    }

    try {
      setIsAddingSubatividades(true);
      console.log(`Adicionando subatividade personalizada "${nome}" ao serviço ${servicoTipo}`);

      // Buscar a ordem mais recente do Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const ordemSnap = await getDoc(ordemRef);

      if (!ordemSnap.exists()) {
        toast.error("Ordem não encontrada");
        return;
      }

      const ordemAtual = ordemSnap.data() as OrdemServico;
      
      // Encontrar o serviço para adicionar as subatividades
      const servicoIdx = ordemAtual.servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIdx === -1) {
        toast.error(`Serviço ${servicoTipo} não encontrado na ordem`);
        return;
      }

      // Criar nova subatividade
      const novaSubatividade: SubAtividade = {
        id: uuidv4(),
        nome,
        concluida: false,
        selecionada: true,
        tempoEstimado
      };

      // Verificar se a subatividade já existe
      const subatividadesExistentes = ordemAtual.servicos[servicoIdx].subatividades || [];
      const jaExiste = subatividadesExistentes.some(
        sub => sub.nome.toLowerCase() === nome.toLowerCase()
      );

      if (jaExiste) {
        toast.info("Esta subatividade já existe");
        return;
      }

      // Atualizar o serviço com a nova subatividade
      const servicosAtualizados = [...ordemAtual.servicos];
      if (!servicosAtualizados[servicoIdx].subatividades) {
        servicosAtualizados[servicoIdx].subatividades = [];
      }
      servicosAtualizados[servicoIdx].subatividades.push(novaSubatividade);

      // Atualizar a ordem no Firebase
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      console.log("Subatividade personalizada adicionada com sucesso:", novaSubatividade);
      
      // Buscar a ordem atualizada
      const ordemSnapAtualizada = await getDoc(ordemRef);
      if (ordemSnapAtualizada.exists()) {
        const ordemAtualizada = ordemSnapAtualizada.data() as OrdemServico;
        
        // Notificar componente pai da atualização
        if (onOrdemUpdate) {
          console.log("Chamando onOrdemUpdate após adicionar subatividade personalizada");
          onOrdemUpdate(ordemAtualizada);
        }
      }
      
      return novaSubatividade;
    } catch (error) {
      console.error("Erro ao adicionar subatividade personalizada:", error);
      toast.error("Erro ao adicionar subatividade");
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
