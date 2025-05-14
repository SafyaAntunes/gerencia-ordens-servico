
import { useState, useCallback } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { OrdemServico, TipoServico } from "@/types/ordens";
import { v4 as uuidv4 } from "uuid";
import { gerarEtapaKey } from "@/hooks/ordens/tracker-subatividades/utils";

interface UseEtapaSubatividadesProps {
  ordem: OrdemServico;
  onUpdate: (ordem: OrdemServico) => void;
}

export function useEtapaSubatividades({ ordem, onUpdate }: UseEtapaSubatividadesProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  const addSubatividade = useCallback(async (servicoTipo: TipoServico, nome: string, tempoEstimado?: number) => {
    if (!ordem || !ordem.id) {
      toast.error("Ordem não encontrada");
      return;
    }
    
    try {
      setIsAdding(true);
      
      // Criar nova subatividade
      const novaSubatividade = {
        id: uuidv4(),
        nome,
        selecionada: true,
        concluida: false,
        tempoEstimado: tempoEstimado || 1,
        servicoTipo: servicoTipo
      };
      
      // Encontrar o índice do serviço
      const servicoIndex = ordem.servicos.findIndex(s => s.tipo === servicoTipo);
      
      if (servicoIndex === -1) {
        toast.error(`Serviço do tipo ${servicoTipo} não encontrado`);
        setIsAdding(false);
        return;
      }
      
      // Criar cópia dos serviços para atualização
      const servicosAtualizados = [...ordem.servicos];
      
      // Garantir que o serviço tenha um array de subatividades
      if (!servicosAtualizados[servicoIndex].subatividades) {
        servicosAtualizados[servicoIndex].subatividades = [];
      }
      
      // Adicionar nova subatividade
      servicosAtualizados[servicoIndex].subatividades = [
        ...servicosAtualizados[servicoIndex].subatividades || [],
        novaSubatividade
      ];
      
      // Atualizar no Firebase
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualizar estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      onUpdate(ordemAtualizada);
      
      // Verificar se a atualização foi bem-sucedida
      const verificacaoRef = doc(db, "ordens_servico", ordem.id);
      const verificacaoSnap = await getDoc(verificacaoRef);
      
      if (verificacaoSnap.exists()) {
        const dadosVerificados = verificacaoSnap.data();
        const servicosVerificados = dadosVerificados.servicos || [];
        const servicoVerificado = servicosVerificados[servicoIndex];
        
        if (servicoVerificado && servicoVerificado.subatividades) {
          const subAtividadeVerificada = servicoVerificado.subatividades.find(
            (sub: any) => sub.id === novaSubatividade.id
          );
          
          if (!subAtividadeVerificada) {
            console.warn(`Falha na verificação: subatividade não encontrada após a atualização`);
          }
        }
      }
      
      toast.success(`Subatividade "${nome}" adicionada com sucesso`);
    } catch (error) {
      console.error("Erro ao adicionar subatividade:", error);
      toast.error("Erro ao adicionar subatividade");
    } finally {
      setIsAdding(false);
    }
  }, [ordem, onUpdate]);
  
  return {
    isAdding,
    addSubatividade
  };
}
