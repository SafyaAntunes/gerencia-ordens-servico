import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

// Create a reference to the users collection
const usersCollection = collection(db, 'users');

// Function to register a new user
export async function registerUser(email: string, password: string): Promise<boolean> {
  try {
    // For security reasons, we shouldn't store plain-text passwords
    // In a production app, you would use Firebase Auth directly or a server-side function with proper hashing
    // This is a simplified version for the demo
    const hashedPassword = btoa(password); // Basic encoding (NOT secure for production)
    
    const userDoc = doc(usersCollection, email);
    await setDoc(userDoc, { 
      email, 
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    });
    
    toast.success('Usuário registrado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    toast.error('Erro ao registrar usuário. Tente novamente.');
    return false;
  }
}

// Function to authenticate a user
export async function loginUser(email: string, password: string): Promise<boolean> {
  try {
    // Special case for admin user (keeping the hardcoded admin for demo purposes)
    if (email === 'admin@sgr.com' && password === 'adm123') {
      return true;
    }
    
    const userDoc = doc(usersCollection, email);
    const userSnap = await getDoc(userDoc);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const hashedPassword = btoa(password); // Basic encoding (NOT secure for production)
      
      if (userData.password === hashedPassword) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return false;
  }
}

// Function to get user data
export async function getUserData(email: string) {
  try {
    const userDoc = doc(usersCollection, email);
    const userSnap = await getDoc(userDoc);
    
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return null;
  }
}
