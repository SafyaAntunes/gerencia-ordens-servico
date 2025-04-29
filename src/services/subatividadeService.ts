
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { SubAtividade, TipoServico, TipoAtividade } from '@/types/ordens';

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
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const tipoServico = data.tipoServico as TipoServico | TipoAtividade;
      const subatividade: SubAtividade = {
        id: data.id,
        nome: data.nome,
        selecionada: false,
        precoHora: data.precoHora || 0,
        tempoEstimado: data.tempoEstimado || 0,
        servicoTipo: data.servicoTipo,
        descricao: data.descricao || '',
      };
      
      if (result[tipoServico]) {
        result[tipoServico].push(subatividade);
      }
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
    await setDoc(subatividadeRef, {
      ...subatividade,
      tipoServico,
    });
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
    
    // Inicialize um objeto com todas as chaves possíveis como arrays vazios
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
    
    // Combine o mapa parcial com o mapa completo
    Object.entries(subatividadesMap).forEach(([key, value]) => {
      if (key in completeMap && value) {
        completeMap[key as TipoServico | TipoAtividade] = value;
      }
    });
    
    // Depois, adiciona as novas subatividades
    Object.entries(completeMap).forEach(([tipoServico, subatividades]) => {
      subatividades.forEach((subatividade) => {
        const subatividadeRef = doc(db, 'subatividades', subatividade.id);
        batch.set(subatividadeRef, {
          ...subatividade,
          tipoServico,
        });
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Erro ao salvar subatividades:', error);
    throw error;
  }
}

// Obter subatividades por tipo de serviço
export async function getSubatividadesByTipo(tipoServico: TipoServico | TipoAtividade): Promise<SubAtividade[]> {
  try {
    const subatividadesRef = collection(db, 'subatividades');
    const q = query(subatividadesRef, where('tipoServico', '==', tipoServico));
    const snapshot = await getDocs(q);
    
    const subatividades: SubAtividade[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      subatividades.push({
        id: data.id,
        nome: data.nome,
        selecionada: false,
        concluida: false,
        precoHora: data.precoHora || 0,
        tempoEstimado: data.tempoEstimado || 0,
        servicoTipo: data.servicoTipo,
        descricao: data.descricao || '',
      });
    });
    
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
