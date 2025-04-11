import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { Funcionario, NivelPermissao } from '@/types/funcionarios';
import { loginUser, getUserData, registerUser, getFuncionarioByIdentifier } from '@/services/authService';

type AuthContextType = {
  user: User | null;
  funcionario: Funcionario | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<boolean>;
  hasPermission: (minLevel: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  canViewOrderDetails: (ordenId: string) => boolean;
  canEditOrder: (ordenId: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider initialized");
    
    const storedUser = localStorage.getItem('sgr_user');
    if (storedUser) {
      try {
        console.log("Found stored user, restoring session");
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser as User);
        
        const loadStoredFuncionario = async () => {
          if (parsedUser.funcionarioId) {
            const funcionarioData = await getFuncionarioByIdentifier(parsedUser.email || parsedUser.nomeUsuario);
            if (funcionarioData) {
              setFuncionario(funcionarioData);
            } else {
              setFuncionario({
                id: parsedUser.funcionarioId,
                nome: parsedUser.displayName || 'Usuário',
                email: parsedUser.email || '',
                telefone: '',
                especializacoes: parsedUser.especialidades || [],
                ativo: true,
                nivelPermissao: parsedUser.role as NivelPermissao,
                tipo: 'visualizador' // Default value
              });
            }
          } else if (parsedUser.role === 'admin') {
            setFuncionario({
              id: 'admin',
              nome: 'Administrador',
              email: parsedUser.email || '',
              telefone: '',
              especializacoes: [],
              ativo: true,
              nivelPermissao: 'admin' as NivelPermissao,
              tipo: 'admin' // Default value
            });
          }
        };
        
        loadStoredFuncionario();
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
          especializacoes: [],
          ativo: true,
          nivelPermissao: 'visualizacao' as NivelPermissao,
          tipo: 'visualizador' // Default value
        });
      }
      
      setLoading(false);
    });

    setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const success = await registerUser(email, password);
      
      if (success) {
        return login(email, password);
      }
      
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error('Erro ao registrar usuário.');
      return false;
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      console.log("Login attempt for:", identifier);
      
      const success = await loginUser(identifier, password);
      
      if (success) {
        let userData;
        
        if (identifier === 'admin@sgr.com') {
          userData = {
            uid: 'admin-uid',
            email: 'admin@sgr.com',
            displayName: 'Administrador',
            role: 'admin'
          };
          
          setFuncionario({
            id: 'admin',
            nome: 'Administrador',
            email: 'admin@sgr.com',
            telefone: '',
            especializacoes: [],
            ativo: true,
            nivelPermissao: 'admin' as NivelPermissao,
            tipo: 'admin' // Default value
          });
        } else {
          userData = await getUserData(identifier);
          
          if (!userData) {
            toast.error('Erro ao buscar dados do usuário.');
            return false;
          }
          
          const funcionarioData = await getFuncionarioByIdentifier(identifier);
          
          if (funcionarioData) {
            setFuncionario(funcionarioData);
            
            userData = {
              uid: userData.funcionarioId || identifier,
              email: userData.email,
              nomeUsuario: userData.nomeUsuario,
              displayName: funcionarioData.nome,
              role: funcionarioData.nivelPermissao,
              funcionarioId: funcionarioData.id,
              especialidades: funcionarioData.especializacoes || funcionarioData.especialidades || []
            };
          } else {
            userData = {
              uid: userData.email || identifier,
              email: userData.email,
              nomeUsuario: userData.nomeUsuario,
              displayName: userData.displayName || 'Usuário',
              role: userData.role || 'user'
            };
            
            setFuncionario({
              id: userData.email || identifier,
              nome: userData.displayName || 'Usuário',
              email: userData.email || '',
              telefone: '',
              especializacoes: [],
              ativo: true,
              nivelPermissao: userData.role as NivelPermissao || 'visualizacao',
              tipo: 'visualizador' // Default value
            });
          }
        }
        
        setUser(userData as User);
        
        localStorage.setItem('sgr_user', JSON.stringify(userData));
        console.log("User stored in localStorage:", userData);
        
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
      setUser(null);
      setFuncionario(null);
      localStorage.removeItem('sgr_user');
      
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

  const canAccessRoute = (route: string) => {
    if (!user || !funcionario) return false;
    
    if (funcionario.nivelPermissao === 'admin') {
      return true;
    }
    
    if (funcionario.nivelPermissao === 'gerente') {
      if (route.startsWith('/configuracoes') || route.startsWith('/relatorios/financeiro')) {
        return false;
      }
      
      return true;
    }
    
    if (funcionario.nivelPermissao === 'tecnico') {
      const allowedRoutes = [
        '/',
        '/ordens',
        '/ordens/'
      ];
      
      return allowedRoutes.some(allowedRoute => 
        route === allowedRoute || 
        (allowedRoute.endsWith('/') && route.startsWith(allowedRoute))
      );
    }
    
    if (funcionario.nivelPermissao === 'visualizacao') {
      const allowedRoutes = [
        '/'
      ];
      
      return allowedRoutes.some(allowedRoute => route === allowedRoute);
    }
    
    return false;
  };

  const canViewOrderDetails = (ordenId: string) => {
    if (!funcionario) return false;
    
    if (['admin', 'gerente'].includes(funcionario.nivelPermissao)) {
      return true;
    }
    
    if (funcionario.nivelPermissao === 'tecnico') {
      return true;
    }
    
    return false;
  };

  const canEditOrder = (ordenId: string) => {
    if (!funcionario) return false;
    
    return ['admin', 'gerente'].includes(funcionario.nivelPermissao);
  };

  const value = {
    user,
    funcionario,
    loading,
    login,
    logout,
    register,
    hasPermission,
    canAccessRoute,
    canViewOrderDetails,
    canEditOrder
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
