
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  User, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Funcionario, NivelPermissao } from '@/types/funcionarios';

type AuthContextType = {
  user: User | null;
  funcionario: Funcionario | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  registerFuncionario: (funcionario: Funcionario, senha: string) => Promise<boolean>;
  hasPermission: (minLevel: string) => boolean;
};

// Create the authentication context
const AuthContext = createContext<AuthContextType | null>(null);

// Create the AuthProvider component that will wrap our app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFuncionarioData = async (uid: string) => {
    try {
      const funcionarioDoc = await getDoc(doc(db, 'funcionarios', uid));
      
      if (funcionarioDoc.exists()) {
        const funcionarioData = funcionarioDoc.data() as Omit<Funcionario, 'id'>;
        setFuncionario({
          id: uid,
          ...funcionarioData
        });
        return true;
      } else {
        console.log('No funcionario data found for this user');
        return false;
      }
    } catch (error) {
      console.error('Error fetching funcionario data:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log('Auth state changed:', authUser ? 'logged in' : 'logged out');
      setUser(authUser);
      
      if (authUser) {
        await fetchFuncionarioData(authUser.uid);
      } else {
        setFuncionario(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      console.log('Attempting login with:', emailOrUsername);
      // First try direct login with email
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailOrUsername, password);
        toast.success('Login realizado com sucesso!');
        await fetchFuncionarioData(userCredential.user.uid);
        return true;
      } catch (error) {
        // If failed, try to find user by username
        // This is a simplification - in a real app, you would query Firestore to find the user by username
        if (emailOrUsername === 'admin' && password === 'admin123') {
          // Special handling for default admin account
          const userCredential = await signInWithEmailAndPassword(auth, 'admin@omerel.com', password);
          toast.success('Login realizado com sucesso!');
          await fetchFuncionarioData(userCredential.user.uid);
          return true;
        }
        
        // Handle the error from the first attempt
        throw error;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      const errorMessage = error.code === 'auth/invalid-credential' 
        ? 'Credenciais inválidas. Verifique seu email/usuário e senha.'
        : 'Erro ao fazer login. Por favor, tente novamente.';
      
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setFuncionario(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout.');
    }
  };

  const registerFuncionario = async (funcionario: Funcionario, senha: string) => {
    try {
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, funcionario.email, senha);
      const user = userCredential.user;
      
      // Update the user profile
      await updateProfile(user, {
        displayName: funcionario.nome
      });
      
      // Store the funcionario data in Firestore
      await setDoc(doc(db, 'funcionarios', user.uid), {
        ...funcionario,
        id: user.uid
      });
      
      toast.success('Funcionário cadastrado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error registering user:', error);
      
      const errorMessage = error.code === 'auth/email-already-in-use' 
        ? 'Este email já está em uso.'
        : 'Erro ao cadastrar funcionário. Por favor, tente novamente.';
      
      toast.error(errorMessage);
      return false;
    }
  };

  const hasPermission = (minLevel: string) => {
    if (!funcionario) return false;
    
    const levels = {
      'admin': 4,
      'gerente': 3,
      'tecnico': 2,
      'visualizacao': 1
    };
    
    const userLevel = levels[funcionario.nivelPermissao as keyof typeof levels] || 0;
    const requiredLevel = levels[minLevel as keyof typeof levels] || 0;
    
    return userLevel >= requiredLevel;
  };

  const value = {
    user,
    funcionario,
    loading,
    login,
    logout,
    registerFuncionario,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create and export the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the hook as default for backward compatibility
export default useAuth;
