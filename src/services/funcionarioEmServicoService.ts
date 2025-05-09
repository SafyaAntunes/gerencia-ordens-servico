import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, setDoc, collection, query, where, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from 'sonner';
import { EtapaOS, TipoServico } from '@/types/ordens';

// Tipo de registro de serviço
interface ServicoRegistro {
  ordemId: string;
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  inicio: Date;
  fim?: Date;
}

/**
 * Marca um funcionário como "em serviço" e registra a atividade que ele está realizando
 */
export async function marcarFuncionarioEmServico(
  funcionarioId: string, 
  ordemId: string, 
  etapa: EtapaOS, 
  servicoTipo?: TipoServico
): Promise<boolean> {
  try {
    // Verificar se o funcionário existe
    const funcionarioRef = doc(db, 'funcionarios', funcionarioId);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      toast.error('Funcionário não encontrado');
      return false;
    }
    
    // Se o funcionário estiver inativo, não permitir marcar como em serviço
    const funcionarioData = funcionarioDoc.data();
    if (funcionarioData.ativo === false) {
      toast.error('Funcionário inativo não pode ser atribuído a serviços');
      return false;
    }
    
    // Verificar se a ordem existe
    const ordemRef = doc(db, 'ordens_servico', ordemId);
    const ordemDoc = await getDoc(ordemRef);
    
    if (!ordemDoc.exists()) {
      toast.error('Ordem de serviço não encontrada');
      return false;
    }
    
    // Atualizar status do funcionário
    await updateDoc(funcionarioRef, {
      em_servico: true,
      ultima_atividade: {
        ordemId,
        etapa,
        servicoTipo,
        inicio: new Date(),
        ordemNome: ordemDoc.data().nome || ordemId
      }
    });
    
    // Registrar a atribuição na coleção de registros
    const registroId = `${funcionarioId}_${ordemId}_${etapa}_${servicoTipo || 'geral'}_${new Date().getTime()}`;
    const registroRef = doc(db, 'registros_servico', registroId);
    
    await setDoc(registroRef, {
      funcionarioId,
      ordemId,
      etapa,
      servicoTipo,
      inicio: new Date(),
      ordemNome: ordemDoc.data().nome || ordemId
    });

    // Atualizar o documento da ordem para adicionar este funcionário à etapa
    const etapaKey = servicoTipo ? `${etapa}_${servicoTipo}` : etapa;
    
    // Verificar se já existe informação sobre esta etapa
    const etapaPath = `etapasAndamento.${etapaKey}`;
    const etapaData = ordemDoc.data().etapasAndamento?.[etapaKey] || {};
    
    // Criar ou atualizar a lista de funcionários para esta etapa
    const funcionariosData = {
      id: funcionarioId,
      nome: funcionarioData.nome,
      inicio: new Date()
    };
    
    // Se etapaData.funcionarios não existir, criar um array com este funcionário
    if (!etapaData.funcionarios) {
      await updateDoc(ordemRef, {
        [`${etapaPath}.funcionarios`]: [funcionariosData]
      });
    } else {
      // Verificar se o funcionário já está na lista
      const funcionarioJaExiste = etapaData.funcionarios.some((f: any) => f.id === funcionarioId);
      if (!funcionarioJaExiste) {
        // Adicionar ao array de funcionários
        await updateDoc(ordemRef, {
          [`${etapaPath}.funcionarios`]: arrayUnion(funcionariosData)
        });
      }
    }
    
    // Garantir que a etapa esteja marcada como iniciada
    if (!etapaData.iniciado) {
      await updateDoc(ordemRef, {
        [`${etapaPath}.iniciado`]: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao marcar funcionário em serviço:', error);
    toast.error('Erro ao atualizar status do funcionário');
    return false;
  }
}

/**
 * Marca um funcionário como disponível após concluir um serviço
 */
export async function marcarFuncionarioDisponivel(
  funcionarioId: string, 
  ordemId: string, 
  etapa: EtapaOS,
  servicoTipo?: TipoServico
): Promise<boolean> {
  try {
    // Verificar se o funcionário existe
    const funcionarioRef = doc(db, 'funcionarios', funcionarioId);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      toast.error('Funcionário não encontrado');
      return false;
    }
    
    // Encontrar o registro correspondente para esta atividade
    const registrosRef = collection(db, 'registros_servico');
    
    // Construir a query base
    let q = query(
      registrosRef, 
      where('funcionarioId', '==', funcionarioId),
      where('ordemId', '==', ordemId),
      where('etapa', '==', etapa)
    );
    
    // Se tivermos um servicoTipo, criar uma nova query incluindo esse filtro
    if (servicoTipo) {
      q = query(
        registrosRef,
        where('funcionarioId', '==', funcionarioId),
        where('ordemId', '==', ordemId),
        where('etapa', '==', etapa),
        where('servicoTipo', '==', servicoTipo)
      );
    }
    
    const registrosSnapshot = await getDocs(q);
    
    // Atualizar o registro com data de fim
    registrosSnapshot.forEach(async (docSnapshot) => {
      const registroRef = doc(db, 'registros_servico', docSnapshot.id);
      await updateDoc(registroRef, {
        fim: new Date()
      });
    });
    
    // Verificar se o funcionário tem outros serviços ativos
    const outrosServicosQuery = query(
      registrosRef,
      where('funcionarioId', '==', funcionarioId),
      where('fim', '==', null)
    );
    
    const outrosServicosSnapshot = await getDocs(outrosServicosQuery);
    
    // Se não tiver outros serviços ativos, marcar como disponível
    if (outrosServicosSnapshot.empty) {
      await updateDoc(funcionarioRef, {
        em_servico: false,
        ultima_atividade: {
          ...funcionarioDoc.data().ultima_atividade,
          fim: new Date()
        }
      });
    }
    
    // Atualizar o documento da ordem para remover este funcionário da etapa
    const ordemRef = doc(db, 'ordens_servico', ordemId);
    const ordemDoc = await getDoc(ordemRef);
    
    if (ordemDoc.exists()) {
      const etapaKey = servicoTipo ? `${etapa}_${servicoTipo}` : etapa;
      const etapaPath = `etapasAndamento.${etapaKey}`;
      const etapaData = ordemDoc.data().etapasAndamento?.[etapaKey] || {};
      
      if (etapaData.funcionarios && Array.isArray(etapaData.funcionarios)) {
        // Remover este funcionário do array de funcionários
        const funcionariosAtualizados = etapaData.funcionarios.filter(
          (f: any) => f.id !== funcionarioId
        );
        
        // Atualizar a lista de funcionários
        await updateDoc(ordemRef, {
          [`${etapaPath}.funcionarios`]: funcionariosAtualizados
        });
        
        // Se não houver mais funcionários trabalhando nesta etapa e não estiver marcada como concluída
        if (funcionariosAtualizados.length === 0 && !etapaData.concluido) {
          // Podemos opcionalmente marcar a etapa como "parada" ou manter um registro que não há funcionários
          await updateDoc(ordemRef, {
            [`${etapaPath}.semFuncionarios`]: true
          });
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao marcar funcionário como disponível:', error);
    toast.error('Erro ao atualizar status do funcionário');
    return false;
  }
}

/**
 * Verifica se um funcionário está disponível para ser atribuído a um novo serviço
 */
export async function verificarDisponibilidadeFuncionario(funcionarioId: string): Promise<boolean> {
  try {
    const funcionarioRef = doc(db, 'funcionarios', funcionarioId);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      return false;
    }
    
    const funcionarioData = funcionarioDoc.data();
    
    // Funcionário inativo nunca está disponível
    if (funcionarioData.ativo === false) {
      return false;
    }
    
    // Verificar flag em_servico
    return !funcionarioData.em_servico;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do funcionário:', error);
    return false;
  }
}

/**
 * Função administrativa para forçar a liberação de um funcionário
 * Útil quando há problemas de sincronização ou bugs
 */
export async function forcarLiberacaoFuncionario(funcionarioId: string): Promise<boolean> {
  try {
    const funcionarioRef = doc(db, 'funcionarios', funcionarioId);
    await updateDoc(funcionarioRef, {
      em_servico: false
    });
    
    // Fechar todos os registros em aberto
    const registrosRef = collection(db, 'registros_servico');
    const q = query(
      registrosRef,
      where('funcionarioId', '==', funcionarioId),
      where('fim', '==', null)
    );
    
    const registrosSnapshot = await getDocs(q);
    
    const updatePromises = registrosSnapshot.docs.map(docSnapshot => {
      const registroRef = doc(db, 'registros_servico', docSnapshot.id);
      return updateDoc(registroRef, {
        fim: new Date(),
        liberacao_forcada: true
      });
    });
    
    await Promise.all(updatePromises);
    
    toast.success('Funcionário liberado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao forçar liberação do funcionário:', error);
    toast.error('Erro ao liberar funcionário');
    return false;
  }
}

/**
 * Marca vários funcionários como "em serviço" na mesma atividade
 */
export async function marcarVariosFuncionariosEmServico(
  funcionariosIds: string[],
  ordemId: string,
  etapa: EtapaOS,
  servicoTipo?: TipoServico
): Promise<boolean> {
  try {
    if (funcionariosIds.length === 0) {
      toast.error('Nenhum funcionário selecionado');
      return false;
    }

    // Verificar se a ordem existe
    const ordemRef = doc(db, 'ordens_servico', ordemId);
    const ordemDoc = await getDoc(ordemRef);
    
    if (!ordemDoc.exists()) {
      toast.error('Ordem de serviço não encontrada');
      return false;
    }

    const ordemNome = ordemDoc.data().nome || ordemId;
    
    // Para cada funcionário, marcar como em serviço
    const promises = funcionariosIds.map(async (funcionarioId) => {
      return marcarFuncionarioEmServico(funcionarioId, ordemId, etapa, servicoTipo);
    });
    
    const resultados = await Promise.all(promises);
    
    // Verificar se todos foram atribuídos com sucesso
    const todosSucesso = resultados.every(resultado => resultado === true);
    
    if (todosSucesso) {
      toast.success(`${funcionariosIds.length} funcionários atribuídos com sucesso`);
      return true;
    } else {
      toast.warning('Alguns funcionários não puderam ser atribuídos');
      return false;
    }
  } catch (error) {
    console.error('Erro ao marcar vários funcionários em serviço:', error);
    toast.error('Erro ao atribuir funcionários');
    return false;
  }
}

/**
 * Obtém todos os funcionários atribuídos a uma etapa específica
 */
export async function obterFuncionariosAtribuidos(
  ordemId: string,
  etapa: EtapaOS,
  servicoTipo?: TipoServico
): Promise<Array<{id: string, nome: string, inicio: Date}>> {
  try {
    console.log(`Buscando funcionários para ordem=${ordemId}, etapa=${etapa}, servicoTipo=${servicoTipo || 'N/A'}`);
    const ordemRef = doc(db, 'ordens_servico', ordemId);
    const ordemDoc = await getDoc(ordemRef);
    
    if (!ordemDoc.exists()) {
      console.error('Ordem não encontrada');
      return [];
    }
    
    const etapaKey = servicoTipo ? `${etapa}_${servicoTipo}` : etapa;
    const ordemData = ordemDoc.data();
    
    // Log detalhado da estrutura
    console.log("Estrutura da ordem:", {
      temEtapasAndamento: !!ordemData.etapasAndamento,
      etapasKeys: ordemData.etapasAndamento ? Object.keys(ordemData.etapasAndamento) : [],
      etapaKeyBuscada: etapaKey,
      temEtapaEspecifica: ordemData.etapasAndamento && ordemData.etapasAndamento[etapaKey],
      etapaEspecifica: ordemData.etapasAndamento && ordemData.etapasAndamento[etapaKey],
    });
    
    const etapaData = ordemData.etapasAndamento?.[etapaKey] || {};
    
    if (!etapaData.funcionarios || !Array.isArray(etapaData.funcionarios)) {
      console.log(`Nenhum funcionário encontrado para etapa ${etapaKey}`);
      return [];
    }
    
    console.log(`Funcionários encontrados para etapa ${etapaKey}:`, etapaData.funcionarios);
    
    return etapaData.funcionarios.map((f: any) => ({
      id: f.id,
      nome: f.nome,
      inicio: f.inicio?.toDate ? f.inicio.toDate() : new Date(f.inicio)
    }));
  } catch (error) {
    console.error('Erro ao obter funcionários atribuídos:', error);
    return [];
  }
}
