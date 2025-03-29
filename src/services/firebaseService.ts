
import { db, storage, auth } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { OrdemServico, Cliente, Motor } from "@/types/ordens";
import { Funcionario, NivelPermissao } from "@/types/funcionarios";

// Authentication services
export const signUp = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signIn = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOut = async () => {
  return firebaseSignOut(auth);
};

export const resetPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

// Funcionario services
export const saveFuncionario = async (funcionario: Funcionario): Promise<boolean> => {
  try {
    const { senha, ...funcionarioData } = funcionario;
    
    // Se tem senha, é um novo usuário - criar autenticação
    if (senha && funcionario.email) {
      try {
        // Criar o usuário de autenticação
        const userCredential = await createUserWithEmailAndPassword(auth, funcionario.email, senha);
        
        // Atualizar o nome do perfil
        await updateProfile(userCredential.user, {
          displayName: funcionario.nome
        });
        
        // Adicionar UID do usuário ao funcionário
        funcionarioData.id = userCredential.user.uid;
      } catch (error: any) {
        console.error("Erro ao criar usuário de autenticação:", error);
        
        // Se o erro for de usuário existente, continuamos, pois pode ser uma edição
        if (error.code !== "auth/email-already-in-use") {
          throw error;
        }
      }
    }
    
    // Salvar os dados do funcionário (sem a senha) no Firestore
    await setDoc(doc(db, "funcionarios", funcionarioData.id), {
      ...funcionarioData,
      ultimaAtualizacao: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar funcionário:", error);
    throw error;
  }
};

export const getFuncionario = async (id: string): Promise<Funcionario | null> => {
  try {
    const docRef = doc(db, "funcionarios", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Funcionario;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar funcionário:", error);
    throw error;
  }
};

export const getAllFuncionarios = async (): Promise<Funcionario[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "funcionarios"));
    return querySnapshot.docs.map(doc => doc.data() as Funcionario);
  } catch (error) {
    console.error("Erro ao buscar funcionários:", error);
    throw error;
  }
};

export const updateFuncionario = async (funcionario: Funcionario): Promise<boolean> => {
  try {
    const { senha, ...funcionarioData } = funcionario;
    
    // Atualizar os dados do funcionário (sem a senha) no Firestore
    await updateDoc(doc(db, "funcionarios", funcionarioData.id), {
      ...funcionarioData,
      ultimaAtualizacao: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar funcionário:", error);
    throw error;
  }
};

export const deleteFuncionario = async (id: string): Promise<boolean> => {
  try {
    // Apenas marca como inativo em vez de excluir
    await updateDoc(doc(db, "funcionarios", id), {
      ativo: false,
      ultimaAtualizacao: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao excluir funcionário:", error);
    throw error;
  }
};

// Orders services
export const saveOrdemServico = async (ordem: OrdemServico) => {
  try {
    // Convert Date objects to Firestore Timestamps
    const ordemForFirestore = {
      ...ordem,
      dataAbertura: Timestamp.fromDate(new Date(ordem.dataAbertura)),
      dataPrevistaEntrega: Timestamp.fromDate(new Date(ordem.dataPrevistaEntrega)),
    };
    
    await setDoc(doc(db, "ordens", ordem.id), ordemForFirestore);
    return true;
  } catch (error) {
    console.error("Error saving order:", error);
    throw error;
  }
};

export const getOrdemServico = async (id: string): Promise<OrdemServico | null> => {
  try {
    const docRef = doc(db, "ordens", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Convert Firestore Timestamps back to Date objects
      return {
        ...data,
        dataAbertura: data.dataAbertura.toDate(),
        dataPrevistaEntrega: data.dataPrevistaEntrega.toDate(),
      } as OrdemServico;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting order:", error);
    throw error;
  }
};

export const getAllOrdensServico = async (): Promise<OrdemServico[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "ordens"));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        dataAbertura: data.dataAbertura.toDate(),
        dataPrevistaEntrega: data.dataPrevistaEntrega.toDate(),
      } as OrdemServico;
    });
  } catch (error) {
    console.error("Error getting orders:", error);
    throw error;
  }
};

export const updateOrdemServico = async (ordem: OrdemServico) => {
  try {
    const ordemForFirestore = {
      ...ordem,
      dataAbertura: Timestamp.fromDate(new Date(ordem.dataAbertura)),
      dataPrevistaEntrega: Timestamp.fromDate(new Date(ordem.dataPrevistaEntrega)),
    };
    
    await updateDoc(doc(db, "ordens", ordem.id), ordemForFirestore);
    return true;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

export const deleteOrdemServico = async (id: string) => {
  try {
    await deleteDoc(doc(db, "ordens", id));
    return true;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

// Client services
export const saveCliente = async (cliente: Cliente) => {
  try {
    await setDoc(doc(db, "clientes", cliente.id), cliente);
    return true;
  } catch (error) {
    console.error("Error saving client:", error);
    throw error;
  }
};

export const getCliente = async (id: string): Promise<Cliente | null> => {
  try {
    const docRef = doc(db, "clientes", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Cliente;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting client:", error);
    throw error;
  }
};

export const getAllClientes = async (): Promise<Cliente[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "clientes"));
    return querySnapshot.docs.map(doc => doc.data() as Cliente);
  } catch (error) {
    console.error("Error getting clients:", error);
    throw error;
  }
};

// Motor services
export const saveMotor = async (motor: Motor, clienteId: string) => {
  try {
    // Create motor reference in the motors collection
    await setDoc(doc(db, "motores", motor.id), { ...motor, clienteId });
    
    // Update the client's motors array
    const clienteRef = doc(db, "clientes", clienteId);
    const clienteDoc = await getDoc(clienteRef);
    
    if (clienteDoc.exists()) {
      const cliente = clienteDoc.data() as Cliente;
      const motores = cliente.motores || [];
      
      // Check if motor already exists in the array
      const motorIndex = motores.findIndex(m => m.id === motor.id);
      
      if (motorIndex >= 0) {
        // Update existing motor
        motores[motorIndex] = motor;
      } else {
        // Add new motor
        motores.push(motor);
      }
      
      // Update client with new motors array
      await updateDoc(clienteRef, { motores });
    }
    
    return true;
  } catch (error) {
    console.error("Error saving motor:", error);
    throw error;
  }
};

export const getClienteMotores = async (clienteId: string): Promise<Motor[]> => {
  try {
    const motoresQuery = query(collection(db, "motores"), where("clienteId", "==", clienteId));
    const querySnapshot = await getDocs(motoresQuery);
    return querySnapshot.docs.map(doc => doc.data() as Motor);
  } catch (error) {
    console.error("Error getting client motors:", error);
    throw error;
  }
};

// Storage services for image uploads
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const deleteImage = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

// Convert base64 to file for upload
export const base64ToFile = (base64: string, fileName: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], fileName, { type: mime });
};
