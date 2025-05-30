import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { toast } from "sonner";

// Marcar um funcionário como ocupado em um serviço
export const marcarFuncionarioEmServico = async (
  funcionarioId: string,
  ordemId: string,
  etapa: EtapaOS,
  servicoTipo?: TipoServico | string
): Promise<boolean> => {
  if (!funcionarioId || !ordemId) {
    console.error("IDs de funcionário ou ordem inválidos", { funcionarioId, ordemId });
    toast.error("Dados inválidos para marcar funcionário como ocupado");
    return false;
  }

  try {
    console.log(`🔄 Iniciando processo para marcar funcionário ${funcionarioId} como ocupado na ordem ${ordemId}`);
    console.log("Parâmetros recebidos:", { funcionarioId, ordemId, etapa, servicoTipo });
    
    // Verificar conexão com Firebase
    if (!db) {
      console.error("❌ Conexão com Firebase não disponível");
      toast.error("Erro de conexão com o banco de dados");
      return false;
    }
    
    console.log("✅ Conexão com Firebase OK");
    
    // Verificar se o funcionário existe
    console.log(`📋 Verificando se funcionário ${funcionarioId} existe...`);
    const funcionarioRef = doc(db, "funcionarios", funcionarioId);
    
    let funcionarioDoc;
    try {
      funcionarioDoc = await getDoc(funcionarioRef);
    } catch (error) {
      console.error("❌ Erro ao buscar funcionário:", error);
      toast.error(`Erro ao acessar dados do funcionário: ${error.message}`);
      return false;
    }
    
    if (!funcionarioDoc.exists()) {
      console.error("❌ Funcionário não encontrado:", funcionarioId);
      toast.error("Funcionário não encontrado no sistema");
      return false;
    }
    
    const funcionarioData = funcionarioDoc.data();
    console.log("✅ Funcionário encontrado:", { 
      id: funcionarioId, 
      nome: funcionarioData.nome,
      statusAtividade: funcionarioData.statusAtividade,
      atividadeAtual: funcionarioData.atividadeAtual
    });
    
    // Verificar se o funcionário já está ocupado em outra ordem
    if (funcionarioData.statusAtividade === "ocupado" && 
        funcionarioData.atividadeAtual && 
        funcionarioData.atividadeAtual.ordemId !== ordemId) {
      console.warn("⚠️ Funcionário já está ocupado em outra ordem:", {
        funcionarioId,
        ordemAtual: funcionarioData.atividadeAtual.ordemId,
        novaOrdem: ordemId
      });
      toast.error(`Funcionário ${funcionarioData.nome} já está ocupado em outra ordem`);
      return false;
    }
    
    // Se já está ocupado na mesma ordem, permitir (pode ser mudança de serviço)
    if (funcionarioData.statusAtividade === "ocupado" && 
        funcionarioData.atividadeAtual && 
        funcionarioData.atividadeAtual.ordemId === ordemId) {
      console.log("🔄 Funcionário já está ocupado na mesma ordem, atualizando serviço");
    }
    
    // Buscar o nome da ordem para salvar na atividade atual
    let ordemNome = "";
    try {
      console.log(`📋 Buscando dados da ordem ${ordemId}...`);
      const ordemRef = doc(db, "ordens_servico", ordemId);
      const ordemDoc = await getDoc(ordemRef);
      if (ordemDoc.exists()) {
        ordemNome = ordemDoc.data().nome || "";
        console.log("✅ Nome da ordem encontrado:", ordemNome);
      } else {
        console.warn("⚠️ Ordem não encontrada, mas continuando...");
      }
    } catch (e) {
      console.warn("⚠️ Erro ao buscar nome da ordem:", e);
    }
    
    // Converter servicoTipo para string se for enum
    const servicoTipoString = typeof servicoTipo === 'string' ? servicoTipo : servicoTipo?.toString() || null;
    
    // Registrar a atividade atual do funcionário
    const atividadeAtual = {
      ordemId,
      ordemNome,
      etapa,
      servicoTipo: servicoTipoString,
      inicio: Timestamp.now()
    };
    
    console.log("🔄 Atualizando status do funcionário para ocupado:", atividadeAtual);
    
    // Atualizar o documento do funcionário
    try {
      await updateDoc(funcionarioRef, {
        statusAtividade: "ocupado",
        atividadeAtual
      });
      console.log("✅ Documento do funcionário atualizado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao atualizar documento do funcionário:", error);
      toast.error(`Erro ao atualizar status do funcionário: ${error.message}`);
      return false;
    }
    
    // Registrar na coleção de tracking
    try {
      console.log("🔄 Criando registro de tracking...");
      const emServicoRef = doc(db, "funcionarios_em_servico", funcionarioId);
      await setDoc(emServicoRef, {
        funcionarioId,
        ordemId,
        ordemNome,
        etapa,
        servicoTipo: servicoTipoString,
        inicio: Timestamp.now(),
        timestamp: Timestamp.now(),
        status: "em_andamento"
      });
      console.log("✅ Registro de tracking criado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao criar registro de tracking:", error);
      console.warn("⚠️ Funcionário foi marcado como ocupado, mas tracking falhou");
      // Não falhar completamente se apenas o tracking falhar
    }
    
    console.log(`✅ Funcionário ${funcionarioId} marcado como ocupado com sucesso na ordem ${ordemId}`);
    toast.success(`Funcionário ${funcionarioData.nome} marcado como ocupado`);
    return true;
  } catch (error) {
    console.error("❌ Erro geral ao marcar funcionário como ocupado:", error);
    console.error("❌ Detalhes do erro:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    toast.error(`Erro interno: ${error.message || 'Erro desconhecido'}`);
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
      await updateDoc(emServicoRef, {
        finalizado: Timestamp.now(),
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
