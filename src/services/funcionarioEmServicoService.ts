
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { toast } from "sonner";

// Marcar um funcionário como ocupado em um serviço
export const marcarFuncionarioEmServico = async (
  funcionarioId: string,
  ordemId: string,
  etapa: EtapaOS,
  servicoTipo?: TipoServico
): Promise<boolean> => {
  if (!funcionarioId || !ordemId) {
    console.error("IDs de funcionário ou ordem inválidos");
    return false;
  }

  try {
    // Atualizar o documento do funcionário para registrar que está ocupado
    const funcionarioRef = doc(db, "funcionarios", funcionarioId);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      console.error("Funcionário não encontrado:", funcionarioId);
      return false;
    }
    
    // Registrar a atividade atual do funcionário
    const atividadeAtual = {
      ordemId,
      etapa,
      servicoTipo: servicoTipo || null,
      inicio: new Date()
    };
    
    await updateDoc(funcionarioRef, {
      statusAtividade: "ocupado",
      atividadeAtual
    });
    
    // Também podemos registrar essa informação em uma coleção separada para tracking
    const emServicoRef = doc(db, "funcionarios_em_servico", funcionarioId);
    await setDoc(emServicoRef, {
      funcionarioId,
      ordemId,
      etapa,
      servicoTipo: servicoTipo || null,
      inicio: new Date(),
      timestamp: new Date()
    });
    
    console.log(`Funcionário ${funcionarioId} marcado como ocupado na ordem ${ordemId}`);
    return true;
  } catch (error) {
    console.error("Erro ao marcar funcionário como ocupado:", error);
    return false;
  }
};

// Liberar um funcionário quando o serviço é pausado ou concluído
export const liberarFuncionarioDeServico = async (
  funcionarioId: string
): Promise<boolean> => {
  if (!funcionarioId) {
    console.error("ID de funcionário inválido");
    return false;
  }
  
  try {
    // Atualizar o documento do funcionário para registrar que está disponível
    const funcionarioRef = doc(db, "funcionarios", funcionarioId);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      console.error("Funcionário não encontrado:", funcionarioId);
      return false;
    }
    
    await updateDoc(funcionarioRef, {
      statusAtividade: "disponivel",
      atividadeAtual: null
    });
    
    // Remover registro da coleção de tracking
    try {
      const emServicoRef = doc(db, "funcionarios_em_servico", funcionarioId);
      await updateDoc(emServicoRef, {
        finalizado: new Date(),
        status: "finalizado"
      });
    } catch (err) {
      console.warn("Aviso: Não foi possível atualizar registro de tracking", err);
      // Não falhar completamente se apenas o tracking falhar
    }
    
    console.log(`Funcionário ${funcionarioId} liberado do serviço`);
    return true;
  } catch (error) {
    console.error("Erro ao liberar funcionário do serviço:", error);
    return false;
  }
};

// Função para forçar a liberação de um funcionário (usado em casos excepcionais)
export const forcarLiberacaoFuncionario = async (
  funcionarioId: string
): Promise<boolean> => {
  if (!funcionarioId) {
    console.error("ID de funcionário inválido");
    return false;
  }
  
  try {
    // Atualizar o documento do funcionário para registrar que está disponível
    const funcionarioRef = doc(db, "funcionarios", funcionarioId);
    
    await updateDoc(funcionarioRef, {
      statusAtividade: "disponivel",
      atividadeAtual: null
    });
    
    // Atualizar o registro de tracking
    try {
      const emServicoRef = doc(db, "funcionarios_em_servico", funcionarioId);
      await updateDoc(emServicoRef, {
        finalizado: new Date(),
        status: "finalizado_forcado",
        observacao: "Liberação forçada pelo sistema"
      });
    } catch (err) {
      // Se não encontrar o documento de tracking, não é um problema crítico
      console.warn("Aviso: Não foi possível atualizar registro de tracking", err);
    }
    
    toast.success(`Funcionário liberado com sucesso`);
    console.log(`Funcionário ${funcionarioId} liberado forçadamente`);
    return true;
  } catch (error) {
    console.error("Erro ao forçar liberação do funcionário:", error);
    toast.error("Erro ao liberar funcionário");
    return false;
  }
};
