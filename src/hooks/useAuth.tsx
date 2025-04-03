
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { Funcionario, NivelPermissao } from '@/types/funcionarios';
import { loginUser, getUserData, registerUser } from '@/services/authService';

// Define the shape of our auth context
type AuthContextType = {
  user: User | null;
  funcionario: Funcionario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<boolean>;
  hasPermission: (minLevel: string) => boolean;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if there's a stored user session on mount
  useEffect(() => {
    console.log("AuthProvider initialized");
    
    const storedUser = localStorage.getItem('sgr_user');
    if (storedUser) {
      try {
        console.log("Found stored user, restoring session");
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser as User);
        
        // Set funcionario data
        setFuncionario({
          id: parsedUser.uid || parsedUser.email,
          nome: parsedUser.displayName || 'Usuário',
          email: parsedUser.email || '',
          telefone: '',
          especialidades: [],
          ativo: true,
          nivelPermissao: parsedUser.role === 'admin' ? 'admin' as NivelPermissao : 'visualizacao' as NivelPermissao
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('sgr_user');
      }
    }
    
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log("Firebase auth state changed:", authUser ? "Logged in" : "Logged out");
      
      if (authUser) {
        setUser(authUser);
        setFuncionario({
          id: authUser.uid,
          nome: authUser.displayName || 'Usuário',
          email: authUser.email || '',
          telefone: '',
          especialidades: [],
          ativo: true,
          nivelPermissao: 'visualizacao' as NivelPermissao
        });
      }
      
      setLoading(false);
    });

    // Set loading to false even if no auth state change occurs
    setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => unsubscribe();
  }, []);

  // Register a new user
  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const success = await registerUser(email, password);
      
      if (success) {
        // Auto-login after registration
        return login(email, password);
      }
      
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error('Erro ao registrar usuário.');
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Login attempt for:", email);
      
      const success = await loginUser(email, password);
      
      if (success) {
        let userData;
        
        // For admin user - use hardcoded data
        if (email === 'admin@sgr.com') {
          userData = {
            uid: 'admin-uid',
            email: 'admin@sgr.com',
            displayName: 'Administrador',
            role: 'admin'
          };
        } else {
          // For regular users - get data from Firestore
          userData = await getUserData(email);
          
          if (!userData) {
            toast.error('Erro ao buscar dados do usuário.');
            return false;
          }
          
          userData = {
            uid: email,
            email: email,
            displayName: userData.nome || 'Usuário',
            role: userData.role || 'user'
          };
        }
        
        // Set the user state
        setUser(userData as User);
        
        // Set the funcionario state
        setFuncionario({
          id: userData.uid,
          nome: userData.displayName || 'Usuário',
          email: userData.email,
          telefone: '',
          especialidades: [],
          ativo: true,
          nivelPermissao: userData.role === 'admin' ? 'admin' as NivelPermissao : 'visualizacao' as NivelPermissao
        });
        
        // Store in localStorage for persistence
        localStorage.setItem('sgr_user', JSON.stringify(userData));
        console.log("User stored in localStorage");
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // If we're using a user from Firestore or the mock admin user, just clear the state
      setUser(null);
      setFuncionario(null);
      localStorage.removeItem('sgr_user');
      
      // Also sign out from Firebase Auth if needed
      await signOut(auth);
      
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout.');
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
    register,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
