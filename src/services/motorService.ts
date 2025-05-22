
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { Motor } from '@/types/motores';

// Get all motors
export const getMotores = async (): Promise<Motor[]> => {
  try {
    const motoresRef = collection(db, 'motores');
    const snapshot = await getDocs(motoresRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Motor[];
  } catch (error) {
    console.error('Erro ao carregar motores:', error);
    throw error;
  }
};

// Get a specific motor
export const getMotor = async (id: string): Promise<Motor | null> => {
  try {
    const motorRef = doc(db, 'motores', id);
    const motorDoc = await getDoc(motorRef);
    
    if (!motorDoc.exists()) {
      return null;
    }
    
    return {
      id: motorDoc.id,
      ...motorDoc.data()
    } as Motor;
  } catch (error) {
    console.error('Erro ao carregar motor:', error);
    throw error;
  }
};

// Save or update a motor
export const saveMotor = async (motor: Motor): Promise<string> => {
  try {
    const { id, ...motorData } = motor;
    
    let motorId = id;
    
    // If updating an existing motor
    if (id && id.trim() !== '') {
      const motorRef = doc(db, 'motores', id);
      await updateDoc(motorRef, motorData);
    } 
    // If creating a new motor
    else {
      const motoresRef = collection(db, 'motores');
      const novoMotorRef = doc(motoresRef);
      motorId = novoMotorRef.id;
      
      await setDoc(novoMotorRef, {
        ...motorData,
        dataCriacao: Timestamp.now()
      });
    }
    
    return motorId;
  } catch (error) {
    console.error('Erro ao salvar motor:', error);
    throw error;
  }
};

// Delete a motor
export const deleteMotor = async (id: string): Promise<boolean> => {
  try {
    const motorRef = doc(db, 'motores', id);
    await deleteDoc(motorRef);
    return true;
  } catch (error) {
    console.error('Erro ao excluir motor:', error);
    throw error;
  }
};

// Search motors by brand or model
export const searchMotores = async (searchTerm: string): Promise<Motor[]> => {
  try {
    const motoresRef = collection(db, 'motores');
    const snapshot = await getDocs(motoresRef);
    
    const motores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Motor[];
    
    // Filter locally for more flexible search
    return motores.filter(motor => 
      motor.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motor.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (motor.familia && motor.familia.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  } catch (error) {
    console.error('Erro ao buscar motores:', error);
    throw error;
  }
};
