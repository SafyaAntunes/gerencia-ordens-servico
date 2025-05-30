
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { toast } from "sonner";

// Função para diagnosticar o status de um funcionário
export const diagnosticarStatusFuncionario = async (funcionarioId: string) => {
  try {
    console.log(`🔍 Diagnosticando status do funcionário ${funcionarioId}...`);
    
    const funcionarioRef = doc(db, "funcionarios", funcionarioId);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      console.error("❌ Funcionário não encontrado");
      return { erro: "Funcionário não encontrado" };
    }
    
    const funcionarioData = funcionarioDoc.data();
    const diagnostico = {
      funcionarioId,
      nome: funcionarioData.nome,
      statusAtividade: funcionarioData.statusAtividade,
      atividadeAtual: funcionarioData.atividadeAtual,
      ordemExiste: false,
      inconsistente: false
    };
    
    // Verificar se a ordem atual existe
    if (funcionarioData.atividadeAtual?.ordemId) {
      try {
        const ordemRef = doc(db, "ordens_servico", funcionarioData.atividadeAtual.ordemId);
        const ordemDoc = await getDoc(ordemRef);
        diagnostico.ordemExiste = ordemDoc.exists();
        
        // Marcar como inconsistente se está ocupado mas a ordem não existe
        if (funcionarioData.statusAtividade === "ocupado" && !ordemDoc.exists()) {
          diagnostico.inconsistente = true;
        }
      } catch (error) {
        console.warn("⚠️ Erro ao verificar ordem:", error);
        diagnostico.inconsistente = true;
      }
    }
    
    console.log("📋 Diagnóstico completo:", diagnostico);
    return diagnostico;
  } catch (error) {
    console.error("❌ Erro no diagnóstico:", error);
    return { erro: "Erro ao diagnosticar funcionário" };
  }
};

// Função para limpeza preventiva de dados inconsistentes
export const limparDadosInconsistentes = async (funcionarioId: string): Promise<boolean> => {
  try {
    console.log(`🧹 Limpando dados inconsistentes do funcionário ${funcionarioId}...`);
    
    const diagnostico = await diagnosticarStatusFuncionario(funcionarioId);
    
    if (diagnostico.erro) {
      return false;
    }
    
    if (diagnostico.inconsistente) {
      console.log("🔧 Dados inconsistentes detectados, limpando...");
      
      const funcionarioRef = doc(db, "funcionarios", funcionarioId);
      await updateDoc(funcionarioRef, {
        statusAtividade: "disponivel",
        atividadeAtual: null
      });
      
      // Também limpar o registro de tracking se existir
      try {
        const emServicoRef = doc(db, "funcionarios_em_servico", funcionarioId);
        const emServicoDoc = await getDoc(emServicoRef);
        
        if (emServicoDoc.exists()) {
          await updateDoc(emServicoRef, {
            finalizado: Timestamp.now(),
            status: "limpo_automaticamente",
            observacao: "Dados inconsistentes detectados e limpos automaticamente"
          });
        }
      } catch (err) {
        console.warn("⚠️ Aviso: Não foi possível limpar registro de tracking", err);
      }
      
      console.log("✅ Dados inconsistentes limpos com sucesso");
      toast.success("Dados inconsistentes detectados e corrigidos automaticamente");
      return true;
    }
    
    console.log("✅ Dados do funcionário estão consistentes");
    return true;
  } catch (error) {
    console.error("❌ Erro na limpeza de dados:", error);
    return false;
  }
};

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
    
    // Primeiro, fazer limpeza preventiva de dados inconsistentes
    console.log("🧹 Executando limpeza preventiva...");
    await limparDadosInconsistentes(funcionarioId);
    
    // Verificar se o funcionário existe
    console.log(`📋 Verificando se funcionário ${funcionarioId} existe...`);
    const funcionarioRef = doc(db, "funcionarios", funcionarioId);
    
    let funcionarioDoc;
    try {
      funcionarioDoc = await getDoc(funcionarioRef);
    } catch (error: any) {
      console.error("❌ Erro ao buscar funcionário:", error);
      console.error("❌ Detalhes do erro Firebase:", {
        code: error.code,
        message: error.message,
        details: error
      });
      toast.error(`Erro ao acessar dados do funcionário: ${error.message || 'Erro desconhecido'}`);
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
    
    // Verificação mais robusta do status do funcionário
    const isOcupadoEmOutraOrdem = funcionarioData.statusAtividade === "ocupado" && 
                                  funcionarioData.atividadeAtual && 
                                  funcionarioData.atividadeAtual.ordemId !== ordemId;
    
    if (isOcupadoEmOutraOrdem) {
      console.warn("⚠️ Funcionário parece estar ocupado em outra ordem:", {
        funcionarioId,
        ordemAtual: funcionarioData.atividadeAtual.ordemId,
        novaOrdem: ordemId
      });
      
      // Verificar se a ordem atual realmente existe
      console.log("🔍 Verificando se a ordem atual do funcionário ainda existe...");
      try {
        const ordemAtualRef = doc(db, "ordens_servico", funcionarioData.atividadeAtual.ordemId);
        const ordemAtualDoc = await getDoc(ordemAtualRef);
        
        if (!ordemAtualDoc.exists()) {
          console.log("⚠️ Ordem atual do funcionário não existe mais. Liberando funcionário automaticamente...");
          // Liberar funcionário automaticamente se a ordem não existir
          await updateDoc(funcionarioRef, {
            statusAtividade: "disponivel",
            atividadeAtual: null
          });
          console.log("✅ Funcionário liberado automaticamente");
        } else {
          // A ordem existe, então o funcionário realmente está ocupado
          const ordemNome = ordemAtualDoc.data()?.nome || 'Desconhecida';
          console.error("❌ Funcionário realmente está ocupado em outra ordem válida");
          
          // Mostrar mensagem de erro mais informativa com opção de liberação manual
          toast.error(
            `Funcionário ${funcionarioData.nome} está ocupado na ordem "${ordemNome}" (${funcionarioData.atividadeAtual.ordemId}). ` +
            `Use a função de liberação manual se necessário.`,
            {
              duration: 10000,
              action: {
                label: "Liberar Manualmente",
                onClick: () => forcarLiberacaoFuncionario(funcionarioId)
              }
            }
          );
          return false;
        }
      } catch (error: any) {
        console.warn("⚠️ Erro ao verificar ordem atual do funcionário:", error);
        // Em caso de erro, assumir que a ordem não existe e liberar funcionário
        console.log("⚠️ Liberando funcionário devido a erro na verificação...");
        await updateDoc(funcionarioRef, {
          statusAtividade: "disponivel",
          atividadeAtual: null
        });
        console.log("✅ Funcionário liberado devido a erro na verificação");
      }
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
    } catch (e: any) {
      console.warn("⚠️ Erro ao buscar nome da ordem:", e);
    }
    
    // Converter servicoTipo para string de forma segura
    let servicoTipoString: string | null = null;
    if (servicoTipo !== undefined && servicoTipo !== null) {
      if (typeof servicoTipo === 'string') {
        servicoTipoString = servicoTipo;
      } else {
        // Se é um enum TipoServico, converter para string
        servicoTipoString = String(servicoTipo);
      }
    }
    
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
    } catch (error: any) {
      console.error("❌ Erro ao atualizar documento do funcionário:", error);
      console.error("❌ Detalhes do erro Firebase:", {
        code: error.code,
        message: error.message,
        details: error
      });
      toast.error(`Erro ao atualizar status do funcionário: ${error.message || 'Erro desconhecido'}`);
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
    } catch (error: any) {
      console.error("❌ Erro ao criar registro de tracking:", error);
      console.error("❌ Detalhes do erro Firebase:", {
        code: error.code,
        message: error.message,
        details: error
      });
      console.warn("⚠️ Funcionário foi marcado como ocupado, mas tracking falhou");
      // Não falhar completamente se apenas o tracking falhar
    }
    
    console.log(`✅ Funcionário ${funcionarioId} marcado como ocupado com sucesso na ordem ${ordemId}`);
    toast.success(`Funcionário ${funcionarioData.nome} marcado como ocupado`);
    return true;
  } catch (error: any) {
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
    console.log(`🚨 FORÇANDO liberação do funcionário ${funcionarioId}...`);
    
    // Primeiro fazer diagnóstico para logging
    const diagnostico = await diagnosticarStatusFuncionario(funcionarioId);
    console.log("📋 Status antes da liberação forçada:", diagnostico);
    
    // Atualizar o documento do funcionário para registrar que está disponível
    const funcionarioRef = doc(db, "funcionarios", funcionarioId);
    
    await updateDoc(funcionarioRef, {
      statusAtividade: "disponivel",
      atividadeAtual: null
    });
    
    // Atualizar o registro de tracking
    try {
      const emServicoRef = doc(db, "funcionarios_em_servico", funcionarioId);
      const emServicoDoc = await getDoc(emServicoRef);
      
      if (emServicoDoc.exists()) {
        await updateDoc(emServicoRef, {
          finalizado: Timestamp.now(),
          status: "finalizado_forcado",
          observacao: "Liberação forçada pelo usuário - possível inconsistência de dados"
        });
      }
    } catch (err) {
      // Se não encontrar o documento de tracking, não é um problema crítico
      console.warn("Aviso: Não foi possível atualizar registro de tracking", err);
    }
    
    toast.success(`Funcionário liberado forçadamente com sucesso`);
    console.log(`✅ Funcionário ${funcionarioId} liberado forçadamente`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao forçar liberação do funcionário:", error);
    toast.error("Erro ao liberar funcionário forçadamente");
    return false;
  }
};
