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
    // Determinar a chave da etapa com base no tipo de serviço
    const etapaKey = ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final' || etapa === 'lavagem') && servicoTipo)
      ? `${etapa}_${servicoTipo}`
      : etapa;
    
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
        ordemId: ordemId || null,
        etapa: etapa || null,
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
            [`