
import { useState } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Motor } from '@/types/motores';
import { toast } from 'sonner';

export const useMotores = () => {
  const [motores, setMotores] = useState<Motor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMotores = async () => {
    setLoading(true);
    try {
      const motoresRef = collection(db, 'motores');
      const snapshot = await getDocs(motoresRef);
      const motoresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Motor[];
      setMotores(motoresData);
    } catch (error) {
      console.error('Erro ao carregar motores:', error);
      toast.error('Erro ao carregar motores.');
    } finally {
      setLoading(false);
    }
  };

  const getMotor = async (id: string): Promise<Motor | null> => {
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
      toast.error('Erro ao carregar dados do motor.');
      return null;
    }
  };

  const saveMotor = async (motor: Motor): Promise<boolean> => {
    try {
      let motorId = motor.id;
      const { id, ...motorData } = motor;
      
      if (id && id !== '') {
        // Update existing motor
        const motorRef = doc(db, 'motores', id);
        await updateDoc(motorRef, motorData);
      } else {
        // Create new motor
        const motoresRef = collection(db, 'motores');
        const newMotorRef = doc(motoresRef);
        motorId = newMotorRef.id;
        
        await setDoc(newMotorRef, {
          ...motorData,
          dataCriacao: Timestamp.now()
        });
      }
      
      await fetchMotores();
      return true;
    } catch (error) {
      console.error('Erro ao salvar motor:', error);
      throw error;
    }
  };

  const deleteMotor = async (id: string): Promise<boolean> => {
    try {
      const motorRef = doc(db, 'motores', id);
      await deleteDoc(motorRef);
      await fetchMotores();
      return true;
    } catch (error) {
      console.error('Erro ao excluir motor:', error);
      throw error;
    }
  };
  
  const searchMotoresByMarca = async (marca: string): Promise<Motor[]> => {
    try {
      const motoresRef = collection(db, 'motores');
      const q = query(motoresRef, where("marca", ">=", marca), where("marca", "<=", marca + "\uf8ff"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Motor[];
    } catch (error) {
      console.error('Erro ao buscar motores por marca:', error);
      return [];
    }
  };

  return {
    motores,
    loading,
    fetchMotores,
    getMotor,
    saveMotor,
    deleteMotor,
    searchMotoresByMarca
  };
};
