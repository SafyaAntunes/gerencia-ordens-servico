import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { liberarFuncionarioDeServico } from "@/services/funcionarioEmServicoService";
import { OrdemServico } from "@/types/ordens";

// Helper function to extract all employee IDs from an order
const extractFuncionarioIds = (ordem: OrdemServico): string[] => {
  const funcionarioIds = new Set<string>();
  
  // Extract from services
  if (ordem.servicos) {
    ordem.servicos.forEach(servico => {
      if (servico.funcionarioId) {
        funcionarioIds.add(servico.funcionarioId);
      }
    });
  }
  
  // Extract from etapasAndamento
  if (ordem.etapasAndamento) {
    Object.values(ordem.etapasAndamento).forEach(etapa => {
      if (etapa?.funcionarioId) {
        funcionarioIds.add(etapa.funcionarioId);
      }
    });
  }
  
  return Array.from(funcionarioIds);
};

export const useOrdemDelete = (id: string | undefined) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      console.log(`🗑️ Iniciando deleção da ordem ${id}...`);
      
      // First, get the order data to identify associated employees
      const orderRef = doc(db, "ordens_servico", id);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const ordemData = orderDoc.data() as OrdemServico;
        const funcionarioIds = extractFuncionarioIds(ordemData);
        
        console.log(`👥 Funcionários encontrados na ordem: ${funcionarioIds.length}`, funcionarioIds);
        
        // Free all associated employees
        if (funcionarioIds.length > 0) {
          console.log(`🔓 Liberando ${funcionarioIds.length} funcionários...`);
          
          const liberacaoPromises = funcionarioIds.map(async (funcionarioId) => {
            try {
              const success = await liberarFuncionarioDeServico(funcionarioId);
              if (success) {
                console.log(`✅ Funcionário ${funcionarioId} liberado com sucesso`);
              } else {
                console.warn(`⚠️ Falha ao liberar funcionário ${funcionarioId}`);
              }
              return { funcionarioId, success };
            } catch (error) {
              console.error(`❌ Erro ao liberar funcionário ${funcionarioId}:`, error);
              return { funcionarioId, success: false };
            }
          });
          
          const resultados = await Promise.allSettled(liberacaoPromises);
          const sucessos = resultados.filter(result => 
            result.status === 'fulfilled' && result.value.success
          ).length;
          
          console.log(`📊 Resultado da liberação: ${sucessos}/${funcionarioIds.length} funcionários liberados`);
          
          if (sucessos > 0) {
            toast.success(`${sucessos} funcionário${sucessos > 1 ? 's' : ''} liberado${sucessos > 1 ? 's' : ''} automaticamente`);
          }
          
          if (sucessos < funcionarioIds.length) {
            toast.warning(`Alguns funcionários podem não ter sido liberados corretamente`);
          }
        }
      } else {
        console.warn(`⚠️ Ordem ${id} não encontrada, continuando com deleção...`);
      }
      
      // Delete the order
      await deleteDoc(orderRef);
      
      console.log(`✅ Ordem ${id} deletada com sucesso`);
      toast.success("Ordem de serviço excluída com sucesso!");
      navigate("/ordens");
    } catch (error) {
      console.error("❌ Erro ao excluir ordem de serviço:", error);
      toast.error("Erro ao excluir ordem de serviço");
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  return {
    isSubmitting,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDelete
  };
};
