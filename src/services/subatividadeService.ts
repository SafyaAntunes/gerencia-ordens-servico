
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { SubAtividade, TipoServico } from '@/types/ordens';

// Obter todas as subatividades agrupadas por tipo de serviço
export async function getSubatividades(): Promise<Record<TipoServico, SubAtividade[]>> {
  try {
    const subatividadesRef = collection(db, 'subatividades');
    const snapshot = await getDocs(subatividadesRef);
    
    const result: Record<TipoServico, SubAtividade[]> = {
      bloco: [],
      biela: [],
      cabecote: [],
      virabrequim: [],
      eixo_comando: [],
      montagem: [],
      dinamometro: [],
      lavagem: [],
    };
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const tipoServico = data.tipoServico as TipoServico;
      const subatividade: SubAtividade = {
        id: data.id,
        nome: data.nome,
        selecionada: false,
        precoHora: data.precoHora || 0,
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
export async function saveSubatividade(subatividade: SubAtividade, tipoServico: TipoServico): Promise<void> {
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

// Excluir uma subatividade
export async function deleteSubatividade(id: string, tipoServico: TipoServico): Promise<void> {
  try {
    const subatividadeRef = doc(db, 'subatividades', id);
    await deleteDoc(subatividadeRef);
  } catch (error) {
    console.error('Erro ao excluir subatividade:', error);
    throw error;
  }
}

// Obter subatividades por tipo de serviço
export async function getSubatividadesByTipo(tipoServico: TipoServico): Promise<SubAtividade[]> {
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
      });
    });
    
    return subatividades;
  } catch (error) {
    console.error(`Erro ao buscar subatividades do tipo ${tipoServico}:`, error);
    throw error;
  }
}
