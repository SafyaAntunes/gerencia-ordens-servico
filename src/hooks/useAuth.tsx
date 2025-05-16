import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Funcionario } from "@/types/funcionarios";

interface AuthContextProps {
  user: User | null;
  funcionario: Funcionario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (requiredPermission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  isAdmin: boolean;
  isGerente: boolean;
  isTecnico: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  funcionario: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  hasPermission: () => false,
  canAccessRoute: () => true,
  isAdmin: false,
  isGerente: false,
  isTecnico: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Fetch funcionario data based on user's email
        const funcionarioDoc = await getFuncionarioByEmail(user.email || '');
        setFuncionario(funcionarioDoc);
      } else {
        setUser(null);
        setFuncionario(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch funcionario data after login
      const funcionarioDoc = await getFuncionarioByEmail(email);
      setFuncionario(funcionarioDoc);
      
      navigate("/");
    } catch (error: any) {
      console.error("Login failed:", error.message);
      throw error;
    }
  };
  
  const logout = () => {
    signOut(auth).then(() => {
      setUser(null);
      setFuncionario(null);
      navigate("/login");
    });
  };
  
  const getFuncionarioByEmail = async (email: string): Promise<Funcionario | null> => {
    if (!email) return null;
    
    try {
      // Assuming you have a collection named 'funcionarios'
      const snapshot = await getDocs(query(collection(db, 'funcionarios'), where('email', '==', email)));
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Funcionario;
      } else {
        console.log("No matching documents.");
        return null;
      }
    } catch (e) {
      console.error("Error getting document:", e);
      return null;
    }
  };

// Fix the visualizador vs visualizacao issue in any permission check functions
const hasPermission = (requiredPermission: string): boolean => {
  if (!funcionario) return false;
  
  const userLevel = funcionario.nivelPermissao;
  
  if (userLevel === 'admin') return true;
  if (userLevel === 'gerente' && requiredPermission !== 'admin') return true;
  if (userLevel === 'tecnico' && (requiredPermission === 'tecnico' || requiredPermission === 'visualizacao' || requiredPermission === 'visualizador')) return true;
  if ((userLevel === 'visualizacao' || userLevel === 'visualizador') && (requiredPermission === 'visualizacao' || requiredPermission === 'visualizador')) return true;
  
  return false;
};
  
  const canAccessRoute = (route: string): boolean => {
    if (!funcionario) return false;
    
    // Define route-specific permission checks here
    if (route.startsWith('/funcionarios') && funcionario.nivelPermissao !== 'admin' && funcionario.nivelPermissao !== 'gerente') {
      return false;
    }
    
    return true;
  };
  
  const isAdmin = funcionario?.nivelPermissao === 'admin';
  const isGerente = funcionario?.nivelPermissao === 'gerente';
  const isTecnico = funcionario?.nivelPermissao === 'tecnico';
  
  const value: AuthContextProps = {
    user,
    funcionario,
    loading,
    login,
    logout,
    hasPermission,
    canAccessRoute,
    isAdmin,
    isGerente,
    isTecnico
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

import { collection, query, where, getDocs } from 'firebase/firestore';
