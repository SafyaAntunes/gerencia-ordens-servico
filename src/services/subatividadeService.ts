
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, writeBatch, QuerySnapshot } from 'firebase/firestore';
import { SubAtividade, TipoServico, TipoAtividade } from '@/types/ordens';
import { toast } from 'sonner';

// Obter todas as subatividades agrupadas por tipo de serviço
export async function getSubatividades(): Promise<Record<TipoServico | TipoAtividade, SubAtividade[]>> {
  try {
    const subatividadesRef = collection(db, 'subatividades');
    const snapshot = await getDocs(subatividadesRef);
    
    const result: Record<TipoServico | TipoAtividade, SubAtividade[]> = {
      bloco: [],
      biela: [],
      cabecote: [],
      virabrequim: [],
      eixo_comando: [],
      montagem: [],
      dinamometro: [],
      lavagem: [],
      inspecao_inicial: [],
      inspecao_final: [],
    };
    
    console.log(`[getSubatividades] Encontradas ${snapshot.size} subatividades no total`);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const tipoServico = data.tipoServico as TipoServico | TipoAtividade;
      const subatividade: SubAtividade = {
        id: data.id,
        nome: data.nome,
        selecionada: false,
        tempoEstimado: data.tempoEstimado || 0,
        servicoTipo: data.servicoTipo || null,
        descricao: data.descricao || '',
      };
      
      if (result[tipoServico]) {
        result[tipoServico].push(subatividade);
      }
    });
    
    // Log de depuração para mostrar quantas subatividades foram encontradas para cada tipo
    Object.entries(result).forEach(([tipo, subs]) => {
      console.log(`[getSubatividades] Tipo: ${tipo}, Quantidade: ${subs.length}`);
    });
    
    return result;
  } catch (error) {
    console.error('Erro ao buscar subatividades:', error);
    throw error;
  }
}

// Salvar uma subatividade
export async function saveSubatividade(subatividade: SubAtividade, tipoServico: TipoServico | TipoAtividade): Promise<void> {
  try {
    const subatividadeRef = doc(db, 'subatividades', subatividade.id);
    const dataToSave = {
      ...subatividade,
      tipoServico,
      // Garantir que servicoTipo não seja undefined
      servicoTipo: subatividade.servicoTipo || null,
    };
    await setDoc(subatividadeRef, dataToSave);
  } catch (error) {
    console.error('Erro ao salvar subatividade:', error);
    throw error;
  }
}

// Salvar múltiplas subatividades
export async function saveSubatividades(subatividadesMap: Partial<Record<TipoServico | TipoAtividade, SubAtividade[]>>): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Primeiro, exclui todas as subatividades existentes
    const subatividadesRef = collection(db, 'subatividades');
    const snapshot = await getDocs(subatividadesRef);
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Inicializar um objeto com todas as chaves possíveis como arrays vazios
    const completeMap: Record<TipoServico | TipoAtividade, SubAtividade[]> = {
      bloco: [],
      biela: [],
      cabecote: [],
      virabrequim: [],
      eixo_comando: [],
      montagem: [],
      dinamometro: [],
      lavagem: [],
      inspecao_inicial: [],
      inspecao_final: [],
    };
    
    // Combinar o mapa parcial com o mapa completo
    Object.entries(subatividadesMap).forEach(([key, value]) => {
      if (key in completeMap && value) {
        completeMap[key as TipoServico | TipoAtividade] = value;
      }
    });
    
    // Log de depuração para verificar o que está sendo salvo
    console.log("[saveSubatividades] Salvando subatividades:");
    Object.entries(completeMap).forEach(([tipo, subs]) => {
      console.log(`   - Tipo: ${tipo}, Quantidade: ${subs.length}`);
      if (subs.length > 0) {
        console.log(`     - Exemplo: ${subs[0].nome}`);
      }
    });
    
    // Adicionar as novas subatividades
    Object.entries(completeMap).forEach(([tipoServico, subatividades]) => {
      subatividades.forEach((subatividade) => {
        const subatividadeRef = doc(db, 'subatividades', subatividade.id);
        // Garantir que servicoTipo não seja undefined
        const dataToSave = {
          ...subatividade,
          tipoServico,
          servicoTipo: subatividade.servicoTipo || null
        };
        batch.set(subatividadeRef, dataToSave);
      });
    });
    
    await batch.commit();
    console.log("Subatividades atualizadas com sucesso!");
    toast.success("Subatividades salvas com sucesso!");
  } catch (error) {
    console.error('Erro ao salvar subatividades:', error);
    toast.error("Erro ao salvar subatividades!");
    throw error;
  }
}

// Obter subatividades por tipo de serviço
export async function getSubatividadesByTipo(tipoServico: TipoServico | TipoAtividade): Promise<SubAtividade[]> {
  try {
    console.log(`[getSubatividadesByTipo] Buscando subatividades para tipo: ${tipoServico}`);
    
    const subatividadesRef = collection(db, 'subatividades');
    const q = query(subatividadesRef, where('tipoServico', '==', tipoServico));
    
    // Log da query para depuração
    console.log(`[getSubatividadesByTipo] Query criada: ${q}`);
    
    // Executar a consulta
    const snapshot = await getDocs(q);
    
    // Log detalhado do snapshot para depuração
    console.log(`[getSubatividadesByTipo] Encontrados ${snapshot.size} documentos para ${tipoServico}`);
    const snapshotEmpty = snapshot.empty;
    console.log(`[getSubatividadesByTipo] Snapshot está vazio? ${snapshotEmpty ? 'Sim' : 'Não'}`);
    
    // Log completo de todos os documentos no Firestore para depuração
    console.log("[getSubatividadesByTipo] Buscando todos os documentos da coleção para verificação:");
    const allDocsSnapshot = await getDocs(collection(db, 'subatividades'));
    console.log(`[getSubatividadesByTipo] Total de documentos na coleção: ${allDocsSnapshot.size}`);
    
    // Adicionar logs para cada documento encontrado
    const allDocs: Record<string, any>[] = [];
    allDocsSnapshot.forEach((doc) => {
      const data = doc.data();
      allDocs.push({
        id: doc.id,
        tipoServico: data.tipoServico,
        nome: data.nome
      });
    });
    console.log("[getSubatividadesByTipo] Todos os documentos:", allDocs);
    
    // Recuperar e mapear os documentos do snapshot original
    const subatividades: SubAtividade[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`[getSubatividadesByTipo] Documento encontrado: ${doc.id}`, data);
      
      subatividades.push({
        id: data.id,
        nome: data.nome,
        selecionada: false,
        concluida: false,
        tempoEstimado: data.tempoEstimado || 0,
        servicoTipo: data.servicoTipo || null,
        descricao: data.descricao || '',
      });
    });
    
    console.log(`[getSubatividadesByTipo] Retornando ${subatividades.length} subatividades para ${tipoServico}:`, subatividades);
    
    if (subatividades.length === 0) {
      console.log(`[getSubatividadesByTipo] AVISO: Nenhuma subatividade encontrada para ${tipoServico}!`);
    }
    
    return subatividades;
  } catch (error) {
    console.error(`Erro ao buscar subatividades do tipo ${tipoServico}:`, error);
    throw error;
  }
}

// Excluir uma subatividade
export async function deleteSubatividade(id: string): Promise<void> {
  try {
    const subatividadeRef = doc(db, 'subatividades', id);
    await deleteDoc(subatividadeRef);
  } catch (error) {
    console.error('Erro ao excluir subatividade:', error);
    throw error;
  }
}

// Adicionar função para deletar completamente todas as subatividades
export async function deleteAllSubatividades(): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Buscar todas as subatividades
    const subatividadesRef = collection(db, 'subatividades');
    const snapshot = await getDocs(subatividadesRef);
    
    // Deletar cada uma delas
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Commitar as alterações
    await batch.commit();
    console.log("Todas as subatividades foram removidas com sucesso!");
    toast.success("Todas as subatividades foram removidas com sucesso!");
  } catch (error) {
    console.error('Erro ao deletar todas as subatividades:', error);
    toast.error("Erro ao deletar todas as subatividades!");
    throw error;
  }
}

// Função adicional para diagnóstico - busca todas as subatividades
export async function getAllSubatividades(): Promise<{id: string, tipoServico: string, nome: string}[]> {
  try {
    const subatividadesRef = collection(db, 'subatividades');
    const snapshot = await getDocs(subatividadesRef);
    
    const result: {id: string, tipoServico: string, nome: string}[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      result.push({
        id: doc.id,
        tipoServico: data.tipoServico,
        nome: data.nome
      });
    });
    
    return result;
  } catch (error) {
    console.error('Erro ao buscar todas as subatividades:', error);
    throw error;
  }
}
