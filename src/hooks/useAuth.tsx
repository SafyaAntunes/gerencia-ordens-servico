import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'sonner';
import { Funcionario, NivelPermissao } from '@/types/funcionarios';

// Define the shape of our auth context
type AuthContextType = {
  user: User | null;
  funcionario: Funcionario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
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
          id: parsedUser.uid,
          nome: parsedUser.displayName || 'Administrador',
          email: parsedUser.email || 'admin@sgr.com',
          telefone: '',
          especialidades: [],
          ativo: true,
          nivelPermissao: 'admin' as NivelPermissao
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
          nome: authUser.displayName || 'Admin',
          email: authUser.email || 'admin@example.com',
          telefone: '',
          especialidades: [],
          ativo: true,
          nivelPermissao: 'admin' as NivelPermissao
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Login attempt for:", email);
      
      // For demo purposes - hardcoded admin credentials
      if (email === 'admin@sgr.com' && password === 'adm123') {
        console.log("Using mock admin authentication");
        
        // Create a mock user for the admin
        const adminUser = {
          uid: 'admin-uid',
          email: 'admin@sgr.com',
          displayName: 'Administrador',
        };
        
        // Set the user state directly
        setUser(adminUser as User);
        
        // Set the funcionario state
        setFuncionario({
          id: adminUser.uid,
          nome: adminUser.displayName || 'Administrador',
          email: adminUser.email || 'admin@sgr.com',
          telefone: '',
          especialidades: [],
          ativo: true,
          nivelPermissao: 'admin' as NivelPermissao
        });
        
        // Store in localStorage for persistence
        localStorage.setItem('sgr_user', JSON.stringify(adminUser));
        console.log("Admin user stored in localStorage");
        
        return true;
      } else {
        // If not using hardcoded admin, try Firebase authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('sgr_user', JSON.stringify(userCredential.user));
        return true;
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // If we're using the mock admin user, just clear the state
      if (user?.email === 'admin@sgr.com') {
        setUser(null);
        setFuncionario(null);
        localStorage.removeItem('sgr_user');
        toast.success('Logout realizado com sucesso!');
        return;
      }
      
      // Otherwise use Firebase signOut
      await signOut(auth);
      localStorage.removeItem('sgr_user');
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
