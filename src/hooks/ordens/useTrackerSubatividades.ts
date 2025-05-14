
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { OrdemServico, TipoServico, SubAtividade } from "@/types/ordens";
import { v4 as uuidv4 } from "uuid";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSubatividades } from "@/services/subatividadeService";
import { filtrarSubatividadesSelecionadas } from "./tracker-subatividades/utils";

interface UseTrackerSubatividadesProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
}

export function useTrackerSubatividades({ ordem, onOrdemUpdate }: UseTrackerSubatividadesProps) {
  const [isAddingSubatividades, setIsAddingSubatividades] = useState(false);
  const [subatividadesPredefinidas, setSubatividadesPredefinidas] = useState<Record<string, SubAtividade[]>>({});
  const [isLoadingSubatividades, setIsLoadingSubatividades] = useState(false);

  // Carregar subatividades predefinidas
  useEffect(() => {
    const carregarSubatividades = async () => {
      setIsLoadingSubatividades(true);
      try {
        const subatividadesData = await getSubatividades();
        setSubatividadesPredefinidas(subatividadesData);
      } catch (error) {
        console.error("Erro ao carregar subatividades predefinidas:", error);
      } finally {
        setIsLoadingSubatividades(false);
      }
    };

    carregarSubatividades();
  }, []);

  // Adicionar subatividades personalizadas
  const addCustomSubatividade = useCallback(async (
    servicoTipo: TipoServico,
    nome: string,
    tempoEstimado: number = 1
  ) => {
    if (!ordem || !ordem.id) {
      toast.error("Ordem não encontrada");
      return Promise.reject("Ordem não encontrada");
    }
    
    setIsAddingSubatividades(true);
    try {
      console.log(`Adicionando subatividade personalizada: ${nome} para serviço ${servicoTipo}`);
      
      // Encontrar serviço correspondente
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIndex === -1) {
        const erro = `Serviço ${servicoTipo} não encontrado`;
        console.error(erro);
        toast.error(erro);
        return Promise.reject(erro);
      }
      
      // Criar nova subatividade
      const novaSubatividade = {
        id: uuidv4(),
        nome,
        selecionada: true,
        concluida: false,
        tempoEstimado,
        servicoTipo
      };
      
      // Criar cópia do array de serviços
      const servicosAtualizados = [...ordem.servicos];
      const servicoAtual = { ...servicosAtualizados[servicoIndex] };
      
      // Garantir que o serviço tenha um array de subatividades
      const subatividades = servicoAtual.subatividades || [];
      
      // Adicionar nova subatividade
      servicoAtual.subatividades = [...subatividades, novaSubatividade];
      servicosAtualizados[servicoIndex] = servicoAtual;
      
      // Atualizar no Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualizar estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      onOrdemUpdate(ordemAtualizada);
      
      return Promise.resolve();
    } catch (error) {
      console.error("Erro ao adicionar subatividade personalizada:", error);
      toast.error("Erro ao adicionar subatividade");
      return Promise.reject(error);
    } finally {
      setIsAddingSubatividades(false);
    }
  }, [ordem, onOrdemUpdate]);

  // Adicionar subatividades selecionadas de uma lista predefinida
  const addSelectedSubatividades = useCallback(async (
    servicoTipo: TipoServico,
    subatividadesIds: string[]
  ) => {
    if (!ordem || !ordem.id) {
      toast.error("Ordem não encontrada");
      return Promise.reject("Ordem não encontrada");
    }
    
    setIsAddingSubatividades(true);
    try {
      console.log(`Adicionando ${subatividadesIds.length} subatividades selecionadas para serviço ${servicoTipo}`);
      
      // Obter subatividades predefinidas para este tipo de serviço
      const subatividades = subatividadesPredefinidas[servicoTipo] || [];
      
      if (subatividades.length === 0) {
        toast.warning(`Não há subatividades predefinidas para ${servicoTipo}`);
        return Promise.reject("Sem subatividades predefinidas");
      }
      
      // Filtrar apenas as subatividades selecionadas
      const selecionadas = subatividades.filter(sub => 
        subatividadesIds.includes(sub.id)
      );
      
      if (selecionadas.length === 0) {
        toast.warning("Nenhuma subatividade selecionada");
        return Promise.reject("Nenhuma subatividade selecionada");
      }
      
      // Encontrar serviço correspondente
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIndex === -1) {
        const erro = `Serviço ${servicoTipo} não encontrado`;
        console.error(erro);
        toast.error(erro);
        return Promise.reject(erro);
      }
      
      // Criar cópia do array de serviços
      const servicosAtualizados = [...ordem.servicos];
      const servicoAtual = { ...servicosAtualizados[servicoIndex] };
      
      // Garantir que o serviço tenha um array de subatividades
      let subatividadesAtuais = servicoAtual.subatividades || [];
      
      // Para cada subatividade selecionada, verificar se já existe
      // e adicionar apenas as novas
      for (const subatividade of selecionadas) {
        const subAtividadeExistente = subatividadesAtuais.find(
          sub => sub.nome === subatividade.nome
        );
        
        if (!subAtividadeExistente) {
          // Adicionar como nova subatividade com ID exclusivo
          subatividadesAtuais.push({
            ...subatividade,
            id: uuidv4(),
            selecionada: true,
            concluida: false,
            servicoTipo
          });
        }
      }
      
      // Atualizar as subatividades do serviço
      servicoAtual.subatividades = subatividadesAtuais;
      servicosAtualizados[servicoIndex] = servicoAtual;
      
      // Atualizar no Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualizar estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      onOrdemUpdate(ordemAtualizada);
      
      return Promise.resolve();
    } catch (error) {
      console.error("Erro ao adicionar subatividades selecionadas:", error);
      toast.error("Erro ao adicionar subatividades");
      return Promise.reject(error);
    } finally {
      setIsAddingSubatividades(false);
    }
  }, [ordem, onOrdemUpdate, subatividadesPredefinidas]);

  return {
    isAddingSubatividades,
    isLoadingSubatividades,
    subatividadesPredefinidas,
    addCustomSubatividade,
    addSelectedSubatividades,
  };
}
