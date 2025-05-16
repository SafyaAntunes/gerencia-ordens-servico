import { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Funcionario, NivelPermissao } from '@/types/funcionarios';
import { toast } from 'sonner';

interface AuthContextProps {
  funcionario: Funcionario | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<boolean>;
  signUp: (email: string, password?: string) => Promise<boolean>;
  signOutFunc: () => Promise<void>;
  canEditOrder: (ordemId: string) => boolean;
  checkPermission: (requiredPermission: string, userPermission: NivelPermissao) => boolean;
}

const AuthContext = createContext<AuthContextProps>({
  funcionario: null,
  loading: true,
  signIn: async () => false,
  signUp: async () => false,
  signOutFunc: async () => {},
  canEditOrder: () => false,
  checkPermission: () => false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = doc(db, 'users', user.email || '');
        const docSnap = await getDoc(userDoc);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          
          if (userData && userData.funcionarioId) {
            const funcionarioDoc = doc(db, 'funcionarios', userData.funcionarioId);
            const funcionarioSnap = await getDoc(funcionarioDoc);
            
            if (funcionarioSnap.exists()) {
              const funcionarioData = funcionarioSnap.data() as Funcionario;
              
              setFuncionario({
                id: funcionarioSnap.id,
                ...funcionarioData,
                nivelPermissao: userData.role || 'visualizacao',
                nomeUsuario: userData.nomeUsuario || '',
              });
            } else {
              setFuncionario(null);
            }
          } else {
            setFuncionario(null);
          }
        } else {
          setFuncionario(null);
        }
      } else {
        setFuncionario(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [navigate]);
  
  const signIn = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (!password) {
        toast.error('Por favor, insira a senha.');
        return false;
      }
      
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      
      let errorMessage = 'Erro ao fazer login.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado. Verifique o email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta. Verifique sua senha.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Acesso bloqueado devido a muitas tentativas. Tente novamente mais tarde.';
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (!password) {
        toast.error('Por favor, insira a senha.');
        return false;
      }
      
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Conta criada com sucesso!');
      return true;
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      
      let errorMessage = 'Erro ao criar conta.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const signOutFunc = async (): Promise<void> => {
    try {
      await signOut(auth);
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      toast.error('Erro ao fazer logout.');
    }
  };
  
  const canEditOrder = (ordemId: string): boolean => {
    if (!funcionario) return false;
    
    // Admin and Gerente can edit any order
    if (funcionario.nivelPermissao === 'admin' || funcionario.nivelPermissao === 'gerente') {
      return true;
    }
    
    // Tecnico can edit if they are assigned to the order
    // This requires fetching the order and checking assignments
    // For simplicity, we'll skip this check for now
    return funcionario.nivelPermissao === 'tecnico';
  };

  // Or more generally, update the checkPermission function to handle both values
  const checkPermission = (requiredPermission: string, userPermission: NivelPermissao): boolean => {
    const permissionLevels = {
      admin: 4,
      gerente: 3,
      tecnico: 2,
      visualizacao: 1,
      visualizador: 1 // Treat 'visualizador' the same as 'visualizacao'
    };
    
    return (permissionLevels[userPermission as keyof typeof permissionLevels] || 0) >= 
           (permissionLevels[requiredPermission as keyof typeof permissionLevels] || 0);
  };
  
  const value = {
    funcionario,
    loading,
    signIn,
    signUp,
    signOutFunc,
    canEditOrder,
    checkPermission
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
