
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { SubAtividade, TipoServico } from '@/types/ordens';
import { toast } from 'sonner';

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
        concluida: false,
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
    toast.success("Subatividade salva com sucesso!");
  } catch (error) {
    console.error('Erro ao salvar subatividade:', error);
    toast.error("Erro ao salvar subatividade");
    throw error;
  }
}

// Verificar se uma subatividade está em uso em alguma ordem de serviço
async function verificarSubatividadeEmUso(id: string): Promise<boolean> {
  try {
    const ordensRef = collection(db, 'ordens');
    const snapshot = await getDocs(ordensRef);
    
    for (const doc of snapshot.docs) {
      const ordem = doc.data();
      
      // Verifica se algum serviço da ordem contém a subatividade
      for (const servico of ordem.servicos || []) {
        const subatividades = servico.subatividades || [];
        if (subatividades.some(sub => sub.id === id)) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar uso da subatividade:', error);
    throw error;
  }
}

// Excluir uma subatividade
export async function deleteSubatividade(id: string, tipoServico: TipoServico): Promise<boolean> {
  try {
    // Verificar se está em uso
    const emUso = await verificarSubatividadeEmUso(id);
    
    if (emUso) {
      toast.error("Não é possível excluir esta subatividade pois ela está em uso em ordens de serviço");
      return false;
    }
    
    const subatividadeRef = doc(db, 'subatividades', id);
    await deleteDoc(subatividadeRef);
    toast.success("Subatividade excluída com sucesso!");
    return true;
  } catch (error) {
    console.error('Erro ao excluir subatividade:', error);
    toast.error("Erro ao excluir subatividade");
    return false;
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

// Atualizar o status de uma subatividade (concluída ou não)
export async function updateSubatividadeStatus(
  ordemId: string,
  servicoTipo: TipoServico,
  subatividadeId: string,
  concluida: boolean
): Promise<boolean> {
  try {
    const ordemRef = doc(db, 'ordens', ordemId);
    const ordemDoc = await getDocs(query(collection(db, 'ordens'), where('id', '==', ordemId)));
    
    if (ordemDoc.empty) {
      toast.error("Ordem de serviço não encontrada");
      return false;
    }
    
    const ordemData = ordemDoc.docs[0].data();
    const servicos = ordemData.servicos.map((servico: any) => {
      if (servico.tipo === servicoTipo && servico.subatividades) {
        const updatedSubatividades = servico.subatividades.map((sub: SubAtividade) => {
          if (sub.id === subatividadeId) {
            return { ...sub, concluida };
          }
          return sub;
        });
        
        return { ...servico, subatividades: updatedSubatividades };
      }
      return servico;
    });
    
    await setDoc(ordemRef, { ...ordemData, servicos }, { merge: true });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status da subatividade:', error);
    return false;
  }
}
