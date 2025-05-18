
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, setDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
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
    console.log(`Marcando funcionário ${funcionarioId} como ocupado na ordem ${ordemId}`);
    
    // Verificar se o funcionário existe
    const funcionarioRef = doc(db, "funcionarios", funcionarioId);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      console.error("Funcionário não encontrado:", funcionarioId);
      return false;
    }
    
    // Verificar se o funcionário já está ocupado
    const funcionarioData = funcionarioDoc.data();
    if (funcionarioData.statusAtividade === "ocupado" && 
        funcionarioData.atividadeAtual && 
        funcionarioData.atividadeAtual.ordemId !== ordemId) {
      console.warn("Funcionário já está ocupado em outra ordem:", funcionarioData.atividadeAtual.ordemId);
      return false;
    }
    
    // Verificar se o funcionário está realmente trabalhando nesta ordem
    // Se sim, apenas atualizar - Se não, liberar primeiro antes de marcar para nova atividade
    if (funcionarioData.statusAtividade === "ocupado" && 
        funcionarioData.atividadeAtual && 
        funcionarioData.atividadeAtual.ordemId !== ordemId) {
      // Liberar da atividade anterior antes de atribuir a nova
      await liberarFuncionarioDeServico(funcionarioId);
    }
    
    // Buscar o nome da ordem para salvar na atividade atual
    let ordemNome = "";
    try {
      const ordemRef = doc(db, "ordens_servico", ordemId);
      const ordemDoc = await getDoc(ordemRef);
      if (ordemDoc.exists()) {
        ordemNome = ordemDoc.data().nome || "";
      }
    } catch (e) {
      console.warn("Erro ao buscar nome da ordem:", e);
    }
    
    // Registrar a atividade atual do funcionário
    const atividadeAtual = {
      ordemId,
      ordemNome,
      etapa,
      servicoTipo: servicoTipo || null,
      inicio: Timestamp.now()
    };
    
    // Atualizar o documento do funcionário
    await updateDoc(funcionarioRef, {
      statusAtividade: "ocupado",
      atividadeAtual
    });
    
    // Registrar na coleção de tracking
    const emServicoRef = doc(db, "funcionarios_em_servico", funcionarioId);
    await setDoc(emServicoRef, {
      funcionarioId,
      ordemId,
      ordemNome,
      etapa,
      servicoTipo: servicoTipo || null,
      inicio: Timestamp.now(),
      timestamp: Timestamp.now(),
      status: "em_andamento"
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
    console.log(`Liberando funcionário ${funcionarioId} do serviço`);
    
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
    
    // Atualizar registro da coleção de tracking
    try {
      const emServicoRef = doc(db, "funcionarios_em_servico", funcionarioId);
      const emServicoDoc = await getDoc(emServicoRef);
      
      if (emServicoDoc.exists()) {
        await updateDoc(emServicoRef, {
          finalizado: Timestamp.now(),
          status: "finalizado"
        });
      } else {
        console.warn("Registro de tracking não encontrado para o funcionário:", funcionarioId);
      }
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
      const emServicoSnap = await getDoc(emServicoRef);
      
      if (emServicoSnap.exists()) {
        await updateDoc(emServicoRef, {
          finalizado: Timestamp.now(),
          status: "finalizado_forcado",
          observacao: "Liberação forçada pelo sistema"
        });
      }
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

// Nova função para verificar e corrigir todos os funcionários com status incorreto
export const verificarECorrigirTodosFuncionarios = async (): Promise<boolean> => {
  try {
    // Buscar funcionários marcados como ocupados
    const funcionariosRef = collection(db, "funcionarios");
    const q = query(funcionariosRef, where("statusAtividade", "==", "ocupado"));
    const snapshot = await getDocs(q);
    
    let corrigidos = 0;
    
    // Para cada funcionário ocupado, verificar se realmente está em alguma ordem
    for (const docSnap of snapshot.docs) {
      const funcionarioId = docSnap.id;
      const funcionarioData = docSnap.data();
      
      // Verificar se o funcionário está realmente em alguma ordem
      const estaEmAlgumaOrdem = await verificarFuncionarioEmOrdens(funcionarioId);
      
      if (!estaEmAlgumaOrdem) {
        // Se não estiver em nenhuma ordem, corrigir o status
        await updateDoc(doc(db, "funcionarios", funcionarioId), {
          statusAtividade: "disponivel",
          atividadeAtual: null
        });
        
        // Também corrigir qualquer registro pendente em funcionarios_em_servico
        const emServicoRef = doc(db, "funcionarios_em_servico", funcionarioId);
        const emServicoSnap = await getDoc(emServicoRef);
        
        if (emServicoSnap.exists()) {
          await updateDoc(emServicoRef, {
            finalizado: Timestamp.now(),
            status: "finalizado_correcao",
            observacao: "Correção automática - funcionário sem atividade real"
          });
        }
        
        corrigidos++;
      }
    }
    
    if (corrigidos > 0) {
      toast.success(`${corrigidos} funcionários tiveram o status corrigido`);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao verificar e corrigir status dos funcionários:", error);
    toast.error("Erro na verificação de status dos funcionários");
    return false;
  }
};

// Função auxiliar para verificar se um funcionário está realmente trabalhando em alguma ordem
const verificarFuncionarioEmOrdens = async (funcionarioId: string): Promise<boolean> => {
  try {
    // Buscar ordens em andamento
    const ordensRef = collection(db, "ordens_servico");
    const q = query(
      ordensRef,
      where("status", "in", ["executando_servico", "orcamento", "aguardando_aprovacao"])
    );
    const snapshot = await getDocs(q);
    
    // Verificar cada ordem
    for (const docSnap of snapshot.docs) {
      const ordem = { 
        id: docSnap.id, 
        ...docSnap.data(),
        etapasAndamento: docSnap.data().etapasAndamento || {}
      } as any;
      
      // Verificar etapas
      if (ordem.etapasAndamento) {
        for (const [_, etapaInfo] of Object.entries(ordem.etapasAndamento)) {
          const info = etapaInfo as any;
          if (info.funcionarioId === funcionarioId && !info.concluido && info.iniciado && !info.finalizado) {
            return true;
          }
        }
      }
      
      // Verificar serviços
      if (Array.isArray(ordem.servicos)) {
        for (const servico of ordem.servicos) {
          if (servico.funcionarioId === funcionarioId && servico.status === "em_andamento" && !servico.concluido) {
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (err) {
    console.error("Erro ao verificar funcionário em ordens:", err);
    return false;
  }
};
