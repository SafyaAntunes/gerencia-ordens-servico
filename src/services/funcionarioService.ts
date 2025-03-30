
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

const COLLECTION = 'funcionarios';

export const getFuncionarios = async (): Promise<Funcionario[]> => {
  try {
    const funcionariosRef = collection(db, COLLECTION);
    const snapshot = await getDocs(funcionariosRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
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
    } else {
      // Create
      docRef = doc(collection(db, COLLECTION));
      await setDoc(docRef, {
        ...funcionarioData,
        id: docRef.id,
        dataCriacao: serverTimestamp()
      });
      
      // Handle user credentials if provided
      if (senha && (nomeUsuario || funcionario.email)) {
        // In a real app, you'd use Firebase Auth or a backend function
        // Here we're just simulating by storing in a separate collection
        const credentialsRef = doc(collection(db, 'funcionario_credenciais'));
        await setDoc(credentialsRef, {
          funcionarioId: docRef.id,
          nomeUsuario: nomeUsuario || funcionario.email,
          email: funcionario.email,
          senha: senha, // In production, NEVER store plain text passwords
          createdAt: serverTimestamp()
        });
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
    const credentialsRef = collection(db, 'funcionario_credenciais');
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
