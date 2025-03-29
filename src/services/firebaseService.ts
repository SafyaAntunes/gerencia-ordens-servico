
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { db, storage, auth } from '@/lib/firebase';
import { OrdemServico, Cliente, Motor } from '@/types/ordens';
import { Funcionario } from '@/types/funcionarios';

// Authentication methods
export const signIn = async (email: string, password: string): Promise<void> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
};

// Orders methods
export const getAllOrdensServico = async (): Promise<OrdemServico[]> => {
  try {
    const ordensRef = collection(db, 'ordens_servico');
    const snapshot = await getDocs(ordensRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OrdemServico[];
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço:', error);
    throw error;
  }
};

export const getOrdemServico = async (id: string): Promise<OrdemServico | null> => {
  try {
    const ordemRef = doc(db, 'ordens_servico', id);
    const ordemDoc = await getDoc(ordemRef);
    
    if (!ordemDoc.exists()) {
      return null;
    }
    
    return {
      id: ordemDoc.id,
      ...ordemDoc.data()
    } as OrdemServico;
  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error);
    throw error;
  }
};

export const saveOrdemServico = async (ordem: OrdemServico): Promise<void> => {
  try {
    const { id, ...ordemData } = ordem;
    const ordemRef = id ? doc(db, 'ordens_servico', id) : doc(collection(db, 'ordens_servico'));
    await setDoc(ordemRef, ordemData, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar ordem de serviço:', error);
    throw error;
  }
};

export const updateOrdemServico = async (ordem: OrdemServico): Promise<void> => {
    try {
        const ordemRef = doc(db, 'ordens_servico', ordem.id);
        await updateDoc(ordemRef, { ...ordem });
    } catch (error) {
        console.error("Erro ao atualizar ordem de serviço:", error);
        throw error;
    }
};

export const deleteOrdemServico = async (id: string): Promise<void> => {
  try {
    const ordemRef = doc(db, 'ordens_servico', id);
    await deleteDoc(ordemRef);
  } catch (error) {
    console.error('Erro ao excluir ordem de serviço:', error);
    throw error;
  }
};

// Client methods
export const getAllClientes = async (): Promise<Cliente[]> => {
  try {
    const clientesRef = collection(db, 'clientes');
    const snapshot = await getDocs(clientesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Cliente[];
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    throw error;
  }
};

export const getCliente = async (id: string): Promise<Cliente | null> => {
  try {
    const clienteRef = doc(db, 'clientes', id);
    const clienteDoc = await getDoc(clienteRef);
    
    if (!clienteDoc.exists()) {
      return null;
    }
    
    return {
      id: clienteDoc.id,
      ...clienteDoc.data()
    } as Cliente;
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    throw error;
  }
};

export const saveCliente = async (cliente: Cliente): Promise<void> => {
  try {
    const { id, ...clienteData } = cliente;
    const clienteRef = id ? doc(db, 'clientes', id) : doc(collection(db, 'clientes'));
    await setDoc(clienteRef, clienteData, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    throw error;
  }
};

// Motor methods
export const getClienteMotores = async (clienteId: string): Promise<Motor[]> => {
  try {
    const motoresRef = collection(db, `clientes/${clienteId}/motores`);
    const snapshot = await getDocs(motoresRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Motor[];
  } catch (error) {
    console.error('Erro ao buscar motores do cliente:', error);
    throw error;
  }
};

export const saveMotor = async (motor: Motor, clienteId: string): Promise<void> => {
  try {
    const { id, ...motorData } = motor;
    const motorRef = id ? doc(db, `clientes/${clienteId}/motores`, id) : doc(collection(db, `clientes/${clienteId}/motores`));
    await setDoc(motorRef, motorData, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar motor:', error);
    throw error;
  }
};

// File upload methods (for both images and videos)
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    // Determine file type for better organization
    const fileType = file.type.startsWith('image/') ? 'images' : 
                   file.type.startsWith('video/') ? 'videos' : 'files';
                   
    // Create a path that organizes by file type
    const filePath = `${path}/${fileType}/${Date.now()}_${file.name}`;
    
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    throw error;
  }
};

export const deleteFile = async (url: string): Promise<void> => {
  try {
    // Extract the path from the URL
    // URLs look like: https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?token=[token]
    const decodedUrl = decodeURIComponent(url);
    const startPath = decodedUrl.indexOf('/o/') + 3;
    const endPath = decodedUrl.indexOf('?');
    const path = decodedUrl.substring(startPath, endPath !== -1 ? endPath : undefined);
    
    if (path) {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } else {
      console.warn('Caminho do arquivo não encontrado na URL:', url);
    }
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    throw error;
  }
};

export const base64ToFile = (base64: string, fileName: string): File => {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Dados base64 inválidos');
  }
  
  try {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  } catch (error) {
    console.error('Erro ao converter base64 para arquivo:', error);
    throw new Error('Falha ao processar imagem');
  }
};

// Funcionario methods
export const getAllFuncionarios = async (): Promise<Funcionario[]> => {
  try {
    const funcionariosRef = collection(db, 'funcionarios');
    const snapshot = await getDocs(funcionariosRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Funcionario[];
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    throw error;
  }
};

export const getFuncionario = async (id: string): Promise<Funcionario | null> => {
  try {
    const funcionarioRef = doc(db, 'funcionarios', id);
    const funcionarioDoc = await getDoc(funcionarioRef);
    
    if (!funcionarioDoc.exists()) {
      return null;
    }
    
    return {
      id: funcionarioDoc.id,
      ...funcionarioDoc.data()
    } as Funcionario;
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);
    throw error;
  }
};

export const saveFuncionario = async (funcionario: Funcionario): Promise<void> => {
  try {
    const { id, ...funcionarioData } = funcionario;
    const funcionarioRef = id 
      ? doc(db, 'funcionarios', id) 
      : doc(collection(db, 'funcionarios'));
    
    // If there's a senha property and this is an update (id exists), register the user in Auth
    if (funcionarioData.senha && id) {
      try {
        await createUserWithEmailAndPassword(auth, funcionarioData.email, funcionarioData.senha);
        // Connect the auth user to the funcionario document
        const user = auth.currentUser;
        if (user) {
          await setDoc(doc(db, 'usuarios', user.uid), {
            funcionarioId: id,
            email: funcionarioData.email,
          });
        }
      } catch (authError: any) {
        // If user already exists, we don't need to create again
        if (authError.code !== 'auth/email-already-in-use') {
          throw authError;
        }
      }
    }
    
    // Remove the senha from the data to store (for security)
    const dataToStore = { ...funcionarioData };
    delete dataToStore.senha;
    
    // Save the document
    await setDoc(funcionarioRef, dataToStore, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar funcionário:', error);
    throw error;
  }
};
