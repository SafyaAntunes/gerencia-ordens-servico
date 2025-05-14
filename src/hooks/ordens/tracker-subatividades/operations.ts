
import { useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { OrdemServico, TipoServico, SubAtividade } from "@/types/ordens";
import { v4 as uuidv4 } from "uuid";
import { TrackerSubatividadesProps, TrackerResponse, EtapaStatusUpdateParams } from "./types";
import { gerarEtapaKey, verificarEtapaConcluida } from "./utils";

export const useTrackerOperations = ({ ordem, onOrdemUpdate }: TrackerSubatividadesProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Atualiza o status de uma etapa no Firebase e no estado local
   */
  const atualizarEtapaStatus = async ({
    etapa, 
    concluida,
    funcionarioId,
    funcionarioNome,
    servicoTipo
  }: EtapaStatusUpdateParams): Promise<TrackerResponse> => {
    if (!ordem?.id) {
      return { success: false, message: "ID da ordem não encontrado" };
    }
    
    try {
      setIsProcessing(true);
      
      // Determine a chave da etapa com base no tipo de serviço
      const etapaKey = gerarEtapaKey(etapa, servicoTipo);
      
      console.log(`Atualizando status da etapa: ${etapaKey}`, {
        concluida, 
        funcionarioId, 
        funcionarioNome, 
        servicoTipo
      });
      
      // Obter dados atualizados para garantir consistência
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      const ordemSnap = await getDoc(ordemRef);
      
      if (!ordemSnap.exists()) {
        return { success: false, message: "Ordem não encontrada" };
      }
      
      const dadosAtuais = ordemSnap.data();
      const etapasAndamento = dadosAtuais.etapasAndamento || {};
      const etapaAtual = etapasAndamento[etapaKey] || {};
      
      // Verificar se o status já está como desejado para evitar atualizações desnecessárias
      if (etapaAtual.concluido === concluida && 
          etapaAtual.funcionarioId === funcionarioId &&
          etapaAtual.funcionarioNome === funcionarioNome) {
        console.log(`Etapa ${etapaKey} já está com o status ${concluida ? 'concluída' : 'não concluída'}`);
        setIsProcessing(false);
        return { success: true, message: "Status já está atualizado" };
      }
      
      // Preparar o objeto para atualização, garantindo que todos os campos existam
      // e mantenham valores anteriores quando apropriado
      const etapaAtualizada = {
        concluido: concluida,
        funcionarioId: funcionarioId || etapaAtual.funcionarioId || null,
        funcionarioNome: funcionarioNome || etapaAtual.funcionarioNome || "",
        iniciado: etapaAtual.iniciado || new Date(),
        finalizado: concluida ? new Date() : null,
        servicoTipo: servicoTipo || etapaAtual.servicoTipo || null,
      };
      
      console.log(`Salvando etapa ${etapaKey} no Firebase:`, etapaAtualizada);
      
      // Atualizar no Firebase
      await updateDoc(ordemRef, {
        [`etapasAndamento.${etapaKey}`]: etapaAtualizada
      });
      
      // Atualizar estado local
      const etapasAndamentoAtualizado = { ...ordem.etapasAndamento || {} };
      etapasAndamentoAtualizado[etapaKey] = etapaAtualizada;
      
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento: etapasAndamentoAtualizado
      };
      
      // Notificar o componente pai
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Verificar se a atualização foi bem-sucedida
      const verificacaoRef = doc(db, "ordens_servico", ordem.id);
      const verificacaoSnap = await getDoc(verificacaoRef);
      
      if (verificacaoSnap.exists()) {
        const dadosVerificados = verificacaoSnap.data();
        const etapasVerificadas = dadosVerificados.etapasAndamento || {};
        const etapaVerificada = etapasVerificadas[etapaKey] || {};
        
        if (etapaVerificada.concluido !== concluida) {
          console.warn(`Falha na verificação da etapa ${etapaKey}. Status esperado: ${concluida}, status atual: ${etapaVerificada.concluido}`);
        } else {
          console.log(`Verificação bem-sucedida para etapa ${etapaKey}. Status: ${etapaVerificada.concluido}`);
        }
      }
      
      setIsProcessing(false);
      return { 
        success: true, 
        message: `Etapa ${concluida ? 'concluída' : 'atualizada'} com sucesso` 
      };
    } catch (error) {
      console.error("Erro ao atualizar status da etapa:", error);
      setIsProcessing(false);
      return { success: false, message: "Erro ao atualizar status da etapa" };
    }
  };

  return {
    isProcessing,
    atualizarEtapaStatus
  };
};
