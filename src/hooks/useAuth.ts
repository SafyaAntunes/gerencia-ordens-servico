
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { Funcionario, NivelPermissao } from '@/types/funcionarios';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(false);

      // This would normally fetch the funcionario data from Firestore
      // based on the authenticated user. For now, we're setting a mock.
      if (authUser) {
        setFuncionario({
          id: authUser.uid,
          nome: authUser.displayName || 'Admin',
          email: authUser.email || 'admin@example.com',
          telefone: '',
          especialidades: [],
          ativo: true,
          nivelPermissao: 'admin' as NivelPermissao
        });
      } else {
        setFuncionario(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
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

  return {
    user,
    funcionario,
    loading,
    logout,
    hasPermission,
  };
};

export default useAuth;
