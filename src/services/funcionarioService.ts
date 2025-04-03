
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
  Timestamp,
  serverTimestamp,
  DocumentReference,
  DocumentData
} from 'firebase/firestore';
import { toast } from 'sonner';
import { registerUser } from './authService';

const COLLECTION = 'funcionarios';

export const getFuncionarios = async (): Promise<Funcionario[]> => {
  try {
    const funcionariosRef = collection(db, COLLECTION);
    const snapshot = await getDocs(funcionariosRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Provide default values for required fields
      return {
        id: doc.id,
        ...data,
        nome: data.nome || '',
        especialidades: data.especialidades || [],
        nivelPermissao: data.nivelPermissao || 'visualizacao',
        dataCriacao: data.dataCriacao ? data.dataCriacao.toDate() : null
      } as Funcionario;
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
    return {
      id: funcionarioDoc.id,
      ...data,
      nome: data.nome || '',
      especialidades: data.especialidades || [],
      nivelPermissao: data.nivelPermissao || 'visualizacao',
      dataCriacao: data.dataCriacao ? data.dataCriacao.toDate() : null
    } as Funcionario;
  } catch (error) {
    console.error('Error fetching funcionario:', error);
    toast.error('Erro ao carregar funcionário');
    return null;
  }
};

export const saveFuncionario = async (funcionario: Funcionario): Promise<boolean> => {
  try {
    let docRef: DocumentReference<DocumentData>;
    
    const { senha, nomeUsuario, ...funcionarioData } = funcionario;
    
    if (funcionario.id) {
      // Update
      docRef = doc(db, COLLECTION, funcionario.id);
      await updateDoc(docRef, {
        ...funcionarioData,
        updatedAt: serverTimestamp()
      });
      
      // If there's a credentials update for an existing funcionario, we update the user
      if (senha && funcionario.email) {
        // Check if the user already exists, otherwise create it
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("funcionarioId", "==", funcionario.id));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty && senha) {
          // Create new user
          await registerUser(funcionario.email, senha, funcionario.id, funcionario.nivelPermissao);
        } else if (!querySnapshot.empty && senha) {
          // Update existing user - in a real app, this would use Firebase Auth or a secure backend
          const userDoc = querySnapshot.docs[0].ref;
          await updateDoc(userDoc, {
            password: btoa(senha),
            role: funcionario.nivelPermissao,
            updatedAt: serverTimestamp()
          });
        }
      }
    } else {
      // Create new funcionario
      docRef = doc(collection(db, COLLECTION));
      await setDoc(docRef, {
        ...funcionarioData,
        id: docRef.id,
        dataCriacao: serverTimestamp()
      });
      
      // If credentials were provided, create user account
      if (senha && funcionario.email) {
        await registerUser(funcionario.email, senha, docRef.id, funcionario.nivelPermissao);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving funcionario:', error);
    toast.error('Erro ao salvar funcionário');
    return false;
  }
};

export const deleteFuncionario = async (id: string): Promise<boolean> => {
  try {
    const funcionarioRef = doc(db, COLLECTION, id);
    await deleteDoc(funcionarioRef);
    
    // Also delete associated credentials if they exist
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

// Get orders for a specific employee based on their specialties
export const getOrdensByFuncionarioEspecialidades = async (especialidades: string[]): Promise<any[]> => {
  try {
    if (!especialidades || especialidades.length === 0) {
      return [];
    }
    
    const ordensRef = collection(db, 'ordens');
    const snapshot = await getDocs(ordensRef);
    
    // Filter orders that match any of the employee's specialties
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        dataAbertura: doc.data().dataAbertura?.toDate() || new Date(),
        dataPrevistaEntrega: doc.data().dataPrevistaEntrega?.toDate() || new Date(),
      }))
      .filter(ordem => {
        // Check if any service in the order matches the employee's specialties
        if (!ordem.servicos) return false;
        return ordem.servicos.some((servico: any) => especialidades.includes(servico.tipo));
      });
  } catch (error) {
    console.error('Error fetching orders for funcionario:', error);
    toast.error('Erro ao carregar ordens de serviço');
    return [];
  }
};
