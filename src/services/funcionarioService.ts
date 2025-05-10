import { db } from '@/lib/firebase';
import { Funcionario } from '@/types/funcionarios';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  serverTimestamp,
  DocumentReference,
  DocumentData,
  enableIndexedDbPersistence,
  disableNetwork
} from 'firebase/firestore';
import { toast } from 'sonner';
import { registerUser } from './authService';
import { OrdemServico } from '@/types/ordens';

const COLLECTION = 'funcionarios';

export const getFuncionarios = async (): Promise<Funcionario[]> => {
  try {
    const funcionariosRef = collection(db, COLLECTION);
    const snapshot = await getDocs(funcionariosRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return formatFuncionarioData(doc.id, data);
    });
  } catch (error) {
    console.error('Error fetching funcionarios:', error);
    toast.error('Erro ao carregar funcionários');
    return [];
  }
};

export const getFuncionario = async (id: string): Promise<Funcionario | null> => {
  try {
    const funcionarioRef = doc(db, COLLECTION, id);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      return null;
    }
    
    const data = funcionarioDoc.data();
    return formatFuncionarioData(funcionarioDoc.id, data);
  } catch (error) {
    console.error('Error fetching funcionario:', error);
    toast.error('Erro ao carregar funcionário');
    return null;
  }
};

// Helper function to format funcionario data
const formatFuncionarioData = (id: string, data: DocumentData): Funcionario => {
  return {
    id: id,
    ...data,
    nome: data.nome || '',
    especialidades: data.especialidades || [],
    nivelPermissao: data.nivelPermissao || 'visualizacao',
    dataCriacao: data.dataCriacao ? data.dataCriacao.toDate() : null,
    nomeUsuario: data.nomeUsuario || ''
  } as Funcionario;
};

// Helper to update user credentials
const updateUserCredentials = async (
  funcionarioId: string, 
  email: string, 
  senha?: string, 
  nomeUsuario?: string, 
  nivelPermissao?: string
) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("funcionarioId", "==", funcionarioId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Se não existir usuário para este funcionário, cria um novo
      if (senha) {
        const registeredSuccess = await registerUser(
          email, 
          senha, 
          funcionarioId, 
          nivelPermissao || 'visualizacao'
        );
        console.log('Criando novo usuário para funcionário existente:', registeredSuccess);
        
        if (registeredSuccess && nomeUsuario) {
          const userDoc = doc(usersRef, email);
          await updateDoc(userDoc, {
            nomeUsuario: nomeUsuario
          });
          console.log('Nome de usuário atualizado:', nomeUsuario);
        }
      }
    } else {
      // Se já existir usuário, só atualiza se tiver senha ou nome de usuário
      if (senha || nomeUsuario || nivelPermissao) {
        const userDoc = querySnapshot.docs[0].ref;
        const updateData: Record<string, any> = {
          updatedAt: serverTimestamp()
        };
        
        if (nivelPermissao) {
          updateData.role = nivelPermissao;
        }
        
        if (senha) {
          updateData.password = btoa(senha);
        }
        
        if (nomeUsuario) {
          updateData.nomeUsuario = nomeUsuario;
        }
        
        await updateDoc(userDoc, updateData);
        console.log('Credenciais atualizadas para usuário existente');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user credentials:', error);
    return false;
  }
};

export const saveFuncionario = async (funcionario: Funcionario): Promise<boolean> => {
  try {
    let docRef: DocumentReference<DocumentData>;
    
    // Extract credentials data
    const { senha, nomeUsuario, ...funcionarioData } = funcionario;
    
    // If updating an existing employee
    if (funcionario.id) {
      docRef = doc(db, COLLECTION, funcionario.id);
      
      // Update employee data (excluding credentials)
      await updateDoc(docRef, {
        ...funcionarioData,
        updatedAt: serverTimestamp()
      });
      
      console.log('Atualizando funcionário:', funcionario.id);
      
      // Update user credentials only if senha is provided
      if (funcionario.email && senha) {
        await updateUserCredentials(
          funcionario.id,
          funcionario.email,
          senha,
          nomeUsuario,
          funcionario.nivelPermissao
        );
      }
    } 
    // If creating a new employee
    else {
      // Create new employee
      docRef = doc(collection(db, COLLECTION));
      await setDoc(docRef, {
        ...funcionarioData,
        id: docRef.id,
        dataCriacao: serverTimestamp(),
        nomeUsuario: nomeUsuario || ''
      });
      
      // Create user credentials if email and password are provided
      if (funcionario.email && senha) {
        await updateUserCredentials(
          docRef.id,
          funcionario.email,
          senha,
          nomeUsuario,
          funcionario.nivelPermissao
        );
      }
    }

    // Desabilitar temporariamente a rede para forçar uma nova leitura
    await disableNetwork(db);
    // Reabilitar a rede
    await enableIndexedDbPersistence(db);
    
    return true;
  } catch (error) {
    console.error('Error saving funcionario:', error);
    toast.error('Erro ao salvar funcionário');
    return false;
  }
};

export const deleteFuncionario = async (id: string): Promise<boolean> => {
  try {
    // Delete employee record
    const funcionarioRef = doc(db, COLLECTION, id);
    await deleteDoc(funcionarioRef);
    
    // Delete associated user credentials
    const credentialsRef = collection(db, 'users');
    const q = query(credentialsRef, where('funcionarioId', '==', id));
    const credentialsSnapshot = await getDocs(q);
    
    const deletePromises = credentialsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    return true;
  } catch (error) {
    console.error('Error deleting funcionario:', error);
    toast.error('Erro ao excluir funcionário');
    return false;
  }
};

export const getOrdensByFuncionarioEspecialidades = async (especialidades: string[]): Promise<OrdemServico[]> => {
  try {
    if (!especialidades || especialidades.length === 0) {
      return [];
    }
    
    const ordensRef = collection(db, 'ordens');
    const snapshot = await getDocs(ordensRef);
    
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataAbertura: data.dataAbertura?.toDate() || new Date(),
          dataPrevistaEntrega: data.dataPrevistaEntrega?.toDate() || new Date(),
          servicos: data.servicos || [],
          nome: data.nome || '',
          cliente: data.cliente || {},
          status: data.status || 'orcamento',
          prioridade: data.prioridade || 'media',
          etapasAndamento: data.etapasAndamento || {},
          tempoRegistros: data.tempoRegistros || [],
        } as OrdemServico;
      })
      .filter(ordem => {
        if (!ordem.servicos || !Array.isArray(ordem.servicos)) return false;
        return ordem.servicos.some((servico: any) => especialidades.includes(servico.tipo));
      });
  } catch (error) {
    console.error('Error fetching orders for funcionario:', error);
    toast.error('Erro ao carregar ordens de serviço');
    return [];
  }
};
