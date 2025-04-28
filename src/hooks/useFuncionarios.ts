import { useState } from 'react';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { Funcionario } from '@/types/funcionarios';

export const useFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      const funcionariosRef = collection(db, 'funcionarios');
      const snapshot = await getDocs(funcionariosRef);
      const funcionariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Funcionario[];
      setFuncionarios(funcionariosData);
    } catch (error) {
      toast.error('Erro ao carregar funcionários.');
    } finally {
      setLoading(false);
    }
  };

  // Get a single employee
  const getFuncionario = async (id: string) => {
    try {
      const funcionarioRef = doc(db, 'funcionarios', id);
      const funcionarioDoc = await getDoc(funcionarioRef);
      
      if (!funcionarioDoc.exists()) {
        return null;
      }
      
      return {
        id: funcionarioDoc.id,
        ...funcionarioDoc.data()
      } as Funcionario;
    } catch (error) {
      toast.error('Erro ao carregar funcionário.');
      return null;
    }
  };

  // Save an employee
  const saveFuncionario = async (funcionario: Funcionario) => {
    try {
      const { id, senha, nomeUsuario, ...funcionarioData } = funcionario;
      
      let funcionarioRef;
      if (id) {
        funcionarioRef = doc(db, 'funcionarios', id);
        await updateDoc(funcionarioRef, funcionarioData);
      } else {
        funcionarioRef = doc(collection(db, 'funcionarios'));
        await setDoc(funcionarioRef, {
          ...funcionarioData,
          id: funcionarioRef.id,
          dataCriacao: Timestamp.now()
        });
      }
      
      // Se for um novo funcionário e tiver credenciais, criar no authentication
      if (!id && senha && (nomeUsuario || funcionario.email)) {
        try {
          // Criar usuário no Firebase Authentication
          // Normalmente seria feito via Cloud Functions para segurança
          // Aqui simulamos apenas o salvamento dos dados no Firestore
          console.log(`Credenciais para criar no Authentication: ${nomeUsuario || funcionario.email}`);
          
          // Em uma implementação real, as credenciais seriam salvas em uma collection separada
          // ou processadas por uma Cloud Function
          const credenciaisRef = doc(collection(db, 'credenciais_funcionarios'));
          await setDoc(credenciaisRef, {
            funcionarioId: funcionarioRef.id,
            nomeUsuario: nomeUsuario || funcionario.email,
            senha: senha, // Em produção, NUNCA armazene senhas em texto puro
            dataCriacao: Timestamp.now()
          });
        } catch (authError) {
          console.error("Erro ao criar usuário de acesso:", authError);
          toast.error("Erro ao criar credenciais de acesso");
          // Continuar salvando os dados do funcionário mesmo se a autenticação falhar
        }
      }
      
      await fetchFuncionarios(); // Refresh the funcionarios list
      return true;
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      toast.error('Erro ao salvar funcionário.');
      return false;
    }
  };
  
  // Delete an employee
  const deleteFuncionario = async (id: string) => {
    try {
      const funcionarioRef = doc(db, 'funcionarios', id);
      await deleteDoc(funcionarioRef);
      
      // Verificar e excluir credenciais do funcionário, se existirem
      const credenciaisRef = collection(db, 'credenciais_funcionarios');
      const q = query(credenciaisRef, where('funcionarioId', '==', id));
      const credenciaisSnapshot = await getDocs(q);
      
      const deletePromises = credenciaisSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      await fetchFuncionarios(); // Refresh the funcionarios list
      return true;
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      toast.error('Erro ao excluir funcionário.');
      return false;
    }
  };

  return {
    funcionarios,
    loading,
    fetchFuncionarios,
    getFuncionario,
    saveFuncionario,
    deleteFuncionario
  };
};
