
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { OrdemServico, TipoServico, EtapaOS } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
}

const EtapasTracker = ({ ordem, onOrdemUpdate }: EtapasTrackerProps) => {
  const [etapasAtivas, setEtapasAtivas] = useState<EtapaOS[]>([]);
  const { funcionario } = useAuth();

  useEffect(() => {
    // Qualquer lógica de inicialização pode ser colocada aqui
  }, [ordem]);

  // Função para calcular o progresso total se necessário
  const calcularProgressoTotal = (ordemAtualizada: OrdemServico, etapasAtivas: EtapaOS[]) => {
    // Implementar se necessário a lógica de cálculo
    // Este é apenas um placeholder, implementar a lógica real conforme necessário
    return ordemAtualizada;
  };

  // Função para lidar com a troca de status do serviço
  const handleServicoStatusChange = async (servicoTipo: TipoServico, concluido: boolean) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Crie uma cópia dos serviços atuais
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo) {
          // Se estiver marcando como concluído manualmente, todas as subatividades também serão marcadas
          let subatividades = servico.subatividades;
          if (concluido && subatividades) {
            subatividades = subatividades.map(sub => {
              if (sub.selecionada) {
                return { ...sub, concluida: true };
              }
              return sub;
            });
          }
          
          return { 
            ...servico, 
            concluido,
            subatividades
          };
        }
        return servico;
      });
      
      // Atualize o Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      // Calcule o novo progresso
      calcularProgressoTotal(ordemAtualizada, etapasAtivas);
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Exiba um toast de sucesso
      toast.success(`Serviço ${servicoTipo} ${concluido ? 'concluído' : 'reaberto'}`);
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    }
  };

  // Aqui deveria estar o JSX retornado pelo componente
  // Por enquanto, vamos deixar um placeholder
  return (
    <div>
      {/* Implementar o conteúdo do componente conforme necessário */}
      <p>Rastreador de Etapas</p>
    </div>
  );
};

export default EtapasTracker;
