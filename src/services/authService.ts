import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { Funcionario } from '@/types/funcionarios';

// Create a reference to the users collection
const usersCollection = collection(db, 'users');

// Function to register a new user
export async function registerUser(email: string, password: string, funcionarioId?: string, nivelPermissao?: string): Promise<boolean> {
  try {
    // For security reasons, we shouldn't store plain-text passwords
    // In a production app, you would use Firebase Auth directly or a server-side function with proper hashing
    // This is a simplified version for the demo
    const hashedPassword = btoa(password); // Basic encoding (NOT secure for production)
    
    const userDoc = doc(usersCollection, email);
    await setDoc(userDoc, { 
      email, 
      password: hashedPassword,
      role: nivelPermissao || 'user',
      funcionarioId,
      nomeUsuario: email.split('@')[0], // Default username based on email
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

// Function to authenticate a user by email or username
export async function loginUser(identifier: string, password: string): Promise<boolean> {
  try {
    console.log('Tentando login com:', identifier);
    
    // Special case for admin user (keeping the hardcoded admin for demo purposes)
    if (identifier === 'admin@sgr.com' && password === 'adm123') {
      return true;
    }
    
    // Check if the identifier contains @ (email) or not (username)
    let userQuery;
    if (identifier.includes('@')) {
      // Login with email
      const userDoc = doc(usersCollection, identifier);
      const userSnap = await getDoc(userDoc);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const hashedPassword = btoa(password);
        
        if (userData.password === hashedPassword) {
          return true;
        }
      }
    } else {
      // Login with username
      const q = query(usersCollection, where("nomeUsuario", "==", identifier));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const hashedPassword = btoa(password);
        
        if (userData.password === hashedPassword) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return false;
  }
}

// Function to get user data by email or username
export async function getUserData(identifier: string) {
  try {
    let userSnap;
    let userData;
    
    if (identifier.includes('@')) {
      // Get by email
      const userDoc = doc(usersCollection, identifier);
      userSnap = await getDoc(userDoc);
      if (userSnap.exists()) {
        userData = userSnap.data();
      }
    } else {
      // Get by username
      const q = query(usersCollection, where("nomeUsuario", "==", identifier));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        userData = querySnapshot.docs[0].data();
      }
    }
    
    if (userData) {
      // If this user is linked to a funcionario, fetch the funcionario data
      if (userData.funcionarioId) {
        const funcionarioDoc = doc(db, 'funcionarios', userData.funcionarioId);
        const funcionarioSnap = await getDoc(funcionarioDoc);
        
        if (funcionarioSnap.exists()) {
          userData.funcionarioData = funcionarioSnap.data();
        }
      }
      
      return userData;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return null;
  }
}

// Function to get a funcionario by email or username
export async function getFuncionarioByIdentifier(identifier: string): Promise<Funcionario | null> {
  try {
    let usersSnapshot;
    
    if (identifier.includes('@')) {
      // Check by email
      const userDoc = doc(usersCollection, identifier);
      const userSnap = await getDoc(userDoc);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.funcionarioId) {
          const funcionarioDoc = doc(db, 'funcionarios', userData.funcionarioId);
          const funcionarioSnap = await getDoc(funcionarioDoc);
          
          if (funcionarioSnap.exists()) {
            return {
              ...funcionarioSnap.data(),
              id: funcionarioSnap.id
            } as Funcionario;
          }
        }
      }
    } else {
      // Check by username
      const q = query(usersCollection, where("nomeUsuario", "==", identifier));
      usersSnapshot = await getDocs(q);
      
      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        
        // If this user is linked to a funcionario, fetch the funcionario data
        if (userData.funcionarioId) {
          const funcionarioDoc = doc(db, 'funcionarios', userData.funcionarioId);
          const funcionarioSnap = await getDoc(funcionarioDoc);
          
          if (funcionarioSnap.exists()) {
            return {
              ...funcionarioSnap.data(),
              id: funcionarioSnap.id
            } as Funcionario;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);
    return null;
  }
}
