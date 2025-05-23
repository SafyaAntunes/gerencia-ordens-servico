
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { Motor } from '@/types/motor';
import { v4 as uuidv4 } from 'uuid';

// Collection reference
const MOTORS_COLLECTION = 'motores';

// Get all motors
export const getMotores = async (): Promise<Motor[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, MOTORS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Motor));
  } catch (error) {
    console.error('Error fetching motors:', error);
    throw error;
  }
};

// Get motors by client ID
export const getMotoresByClienteId = async (clienteId: string): Promise<Motor[]> => {
  try {
    const q = query(collection(db, MOTORS_COLLECTION), where("clienteId", "==", clienteId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Motor));
  } catch (error) {
    console.error('Error fetching motors by client ID:', error);
    throw error;
  }
};

// Save motor (add new or update existing)
export const saveMotor = async (motor: Motor): Promise<Motor> => {
  try {
    if (!motor.id) {
      // It's a new motor
      const newMotor = {
        ...motor,
        id: uuidv4(),
      };
      
      await addDoc(collection(db, MOTORS_COLLECTION), newMotor);
      return newMotor;
    } else {
      // Update existing motor
      const motorRef = doc(db, MOTORS_COLLECTION, motor.id);
      await updateDoc(motorRef, { ...motor });
      return motor;
    }
  } catch (error) {
    console.error('Error saving motor:', error);
    throw error;
  }
};

// Delete motor
export const deleteMotor = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, MOTORS_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting motor:', error);
    throw error;
  }
};
