
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
    // Verificação de parâmetros obrigatórios
    if (!funcionarioId || !ordemId || !etapa) {
      console.error('Parâmetros obrigatórios faltando em marcarFuncionarioEmServico');
      return false;
    }

    // Determinar a chave da etapa com base no tipo de serviço
    const etapaKey = ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final' || etapa === 'lavagem') && servicoTipo)
      ? `${etapa}_${servicoTipo}`
      : etapa;
    
    console.log(`Marcando funcionário ${funcionarioId} em serviço para etapa ${etapaKey}`);
    
    // Obter dados do funcionário
    const funcionarioRef = doc(db, "funcionarios", funcionarioId);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      toast.error("Funcionário não encontrado");
      return false;
    }
    
    const funcionarioData = funcionarioDoc.data();
    
    // Atualizar último serviço do funcionário
    await updateDoc(funcionarioRef, {
      ultima_atividade: {
        ordemId: ordemId,
        etapa: etapa,
        servicoTipo: servicoTipo || null,
        data: new Date()
      }
    });
    
    // Obter dados da ordem
    const ordemRef = doc(db, "ordens_servico", ordemId);
    const ordemDoc = await getDoc(ordemRef);
    
    if (!ordemDoc.exists()) {
      toast.error("Ordem de serviço não encontrada");
      return false;
    }
    
    // Verificar se já existe informação sobre esta etapa
    const etapaPath = `etapasAndamento.${etapaKey}`;
    const etapaData = ordemDoc.data().etapasAndamento?.[etapaKey] || {};
    
    // Criar ou atualizar a lista de funcionários para esta etapa
    const funcionariosData = {
      id: funcionarioId,
      nome: funcionarioData.nome || "",
      inicio: new Date()
    };
    
    // Se etapaData.funcionarios não existir, criar um array com este funcionário
    if (!etapaData.funcionarios) {
      await updateDoc(ordemRef, {
        [`${etapaPath}.funcionarios`]: [funcionariosData],
        [`${etapaPath}.iniciado`]: new Date()
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
    
    return true;
  } catch (error) {
    console.error('Erro ao marcar funcionário em serviço:', error);
    toast.error('Erro ao atualizar status do funcionário');
    return false;
  }
}

/**
 * Marca vários funcionários como "em serviço" para uma mesma etapa
 */
export async function marcarVariosFuncionariosEmServico(
  funcionariosIds: string[],
  ordemId: string,
  etapa: EtapaOS,
  servicoTipo?: TipoServico
): Promise<boolean> {
  try {
    // Verificar se há funcionários para atribuir
    if (!funcionariosIds.length) {
      console.error('Nenhum funcionário para atribuir');
      return false;
    }

    // Processar cada funcionário individualmente
    const resultados = await Promise.all(
      funcionariosIds.map(id => marcarFuncionarioEmServico(id, ordemId, etapa, servicoTipo))
    );

    // Verificar se todos foram bem-sucedidos
    return resultados.every(result => result === true);
  } catch (error) {
    console.error('Erro ao marcar vários funcionários em serviço:', error);
    toast.error('Erro ao atribuir múltiplos funcionários');
    return false;
  }
}

/**
 * Força a liberação de um funcionário, encerrando todas as suas atividades em andamento
 */
export async function forcarLiberacaoFuncionario(funcionarioId: string): Promise<boolean> {
  try {
    // Verificar se o funcionário existe
    const funcionarioRef = doc(db, 'funcionarios', funcionarioId);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      toast.error('Funcionário não encontrado');
      return false;
    }
    
    const funcionarioData = funcionarioDoc.data();
    
    // Se o funcionário não tiver atividade atual, não há nada a fazer
    if (!funcionarioData.ultima_atividade || !funcionarioData.ultima_atividade.ordemId) {
      toast.info('Funcionário não possui atividades em andamento');
      return true;
    }
    
    // Obter a última atividade para liberar da ordem
    const ultimaAtividade = funcionarioData.ultima_atividade;
    
    // Liberar o funcionário da atividade
    const liberado = await marcarFuncionarioDisponivel(
      funcionarioId,
      ultimaAtividade.ordemId,
      ultimaAtividade.etapa,
      ultimaAtividade.servicoTipo
    );
    
    if (liberado) {
      toast.success('Funcionário liberado com sucesso');
    }
    
    // Encerrar quaisquer registros de serviço abertos
    const registrosRef = collection(db, 'registros_servico');
    const q = query(
      registrosRef,
      where('funcionarioId', '==', funcionarioId),
      where('fim', '==', null)
    );
    
    const registrosSnapshot = await getDocs(q);
    
    // Marcar todos os registros como encerrados
    const atualizacoes = registrosSnapshot.docs.map(doc => updateDoc(
      doc.ref,
      { fim: new Date() }
    ));
    
    // Aguardar todas as atualizações
    if (atualizacoes.length > 0) {
      await Promise.all(atualizacoes);
    }
    
    // Atualizar o status do funcionário para disponível
    await updateDoc(funcionarioRef, {
      em_servico: false,
      ultima_atividade: {
        ...funcionarioData.ultima_atividade,
        fim: new Date()
      }
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao forçar liberação do funcionário:', error);
    toast.error('Não foi possível liberar o funcionário');
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
    // Verificação de parâmetros obrigatórios
    if (!funcionarioId || !ordemId || !etapa) {
      console.error('Parâmetros obrigatórios faltando em marcarFuncionarioDisponivel');
      return false;
    }

    console.log(`Marcando funcionário ${funcionarioId} disponível para etapa ${etapa} (serviço: ${servicoTipo || 'nenhum'})`);

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
            [`${etapaPath}.status`]: "parada"
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
 * Obtém a lista de funcionários atribuídos a uma etapa
 */
export async function obterFuncionariosAtribuidos(
  ordemId: string, 
  etapa: EtapaOS,
  servicoTipo?: TipoServico
): Promise<any[]> {
  try {
    // Verificação de parâmetros obrigatórios
    if (!ordemId || !etapa) {
      console.error('Parâmetros obrigatórios faltando em obterFuncionariosAtribuidos');
      return [];
    }

    console.log(`Buscando funcionários atribuídos à etapa ${etapa} ${servicoTipo ? `(${servicoTipo})` : ''}`);

    // Obter dados da ordem
    const ordemRef = doc(db, 'ordens_servico', ordemId);
    const ordemDoc = await getDoc(ordemRef);
    
    if (!ordemDoc.exists()) {
      console.error("Ordem de serviço não encontrada");
      return [];
    }
    
    // Determinar a chave da etapa
    const etapaKey = servicoTipo ? `${etapa}_${servicoTipo}` : etapa;
    
    // Buscar dados dos funcionários atribuídos a esta etapa
    const etapaData = ordemDoc.data().etapasAndamento?.[etapaKey];
    
    if (!etapaData || !etapaData.funcionarios || !Array.isArray(etapaData.funcionarios)) {
      return [];
    }
    
    // Retornar a lista de funcionários com dados formatados corretamente
    return etapaData.funcionarios.map((f: any) => ({
      id: f.id,
      nome: f.nome || "Funcionário",
      inicio: f.inicio?.toDate ? f.inicio.toDate() : new Date(f.inicio)
    }));
  } catch (error) {
    console.error("Erro ao buscar funcionários atribuídos:", error);
    return [];
  }
}
