
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { toast } from 'sonner';
import * as firebaseService from '@/services/firebaseService';
import { OrdemServico, Cliente, Motor } from '@/types/ordens';
import { Funcionario, NivelPermissao } from '@/types/funcionarios';

// Authentication hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Se o usuário estiver logado, buscar seus dados de funcionário
      if (currentUser) {
        try {
          const funcionarioData = await firebaseService.getFuncionario(currentUser.uid);
          setFuncionario(funcionarioData);
        } catch (error) {
          console.error("Erro ao buscar dados do funcionário:", error);
        }
      } else {
        setFuncionario(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await firebaseService.signIn(email, password);
      return true;
    } catch (error: any) {
      let message = 'Falha ao entrar. Verifique suas credenciais.';
      
      if (error.code === 'auth/invalid-credential') {
        message = 'Email ou senha inválidos.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Senha incorreta.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas de login. Tente novamente mais tarde.';
      }
      
      toast.error(message);
      return false;
    }
  };

  const logout = async (callback?: () => void) => {
    try {
      await firebaseService.signOut();
      if (callback) {
        callback();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao sair.');
    }
  };
  
  const hasPermission = (requiredLevel: NivelPermissao): boolean => {
    if (!funcionario) return false;
    
    const permissionLevels: { [key in NivelPermissao]: number } = {
      visualizacao: 1,
      tecnico: 2,
      gerente: 3,
      admin: 4
    };
    
    const userLevel = permissionLevels[funcionario.nivelPermissao || 'visualizacao'];
    const required = permissionLevels[requiredLevel];
    
    return userLevel >= required;
  };

  return { user, funcionario, loading, login, logout, hasPermission };
};

// Orders hook
export const useOrdens = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all orders
  const fetchOrdens = async () => {
    setLoading(true);
    try {
      const ordensData = await firebaseService.getAllOrdensServico();
      setOrdens(ordensData);
    } catch (error) {
      toast.error('Erro ao carregar ordens de serviço.');
    } finally {
      setLoading(false);
    }
  };

  // Get a single order
  const getOrdem = async (id: string) => {
    try {
      return await firebaseService.getOrdemServico(id);
    } catch (error) {
      toast.error('Erro ao carregar ordem de serviço.');
      return null;
    }
  };

  // Save an order
  const saveOrdem = async (ordem: OrdemServico) => {
    try {
      await firebaseService.saveOrdemServico(ordem);
      toast.success('Ordem salva com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao salvar ordem de serviço.');
      return false;
    }
  };

  // Update an order
  const updateOrdem = async (ordem: OrdemServico) => {
    try {
      await firebaseService.updateOrdemServico(ordem);
      toast.success('Ordem atualizada com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao atualizar ordem de serviço.');
      return false;
    }
  };

  // Delete an order
  const deleteOrdem = async (id: string) => {
    try {
      await firebaseService.deleteOrdemServico(id);
      toast.success('Ordem excluída com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao excluir ordem de serviço.');
      return false;
    }
  };

  return {
    ordens,
    loading,
    fetchOrdens,
    getOrdem,
    saveOrdem,
    updateOrdem,
    deleteOrdem
  };
};

// Clients hook
export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all clients
  const fetchClientes = async () => {
    setLoading(true);
    try {
      const clientesData = await firebaseService.getAllClientes();
      setClientes(clientesData);
    } catch (error) {
      toast.error('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  // Get a single client
  const getCliente = async (id: string) => {
    try {
      return await firebaseService.getCliente(id);
    } catch (error) {
      toast.error('Erro ao carregar cliente.');
      return null;
    }
  };

  // Save a client
  const saveCliente = async (cliente: Cliente) => {
    try {
      await firebaseService.saveCliente(cliente);
      toast.success('Cliente salvo com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao salvar cliente.');
      return false;
    }
  };

  // Get motors for a client
  const getClienteMotores = async (clienteId: string) => {
    try {
      return await firebaseService.getClienteMotores(clienteId);
    } catch (error) {
      toast.error('Erro ao carregar motores do cliente.');
      return [];
    }
  };

  // Save a motor for a client
  const saveMotor = async (motor: Motor, clienteId: string) => {
    try {
      await firebaseService.saveMotor(motor, clienteId);
      toast.success('Motor salvo com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao salvar motor.');
      return false;
    }
  };

  return {
    clientes,
    loading,
    fetchClientes,
    getCliente,
    saveCliente,
    getClienteMotores,
    saveMotor
  };
};

// Enhanced Images and Videos hook for handling uploads
export const useImages = () => {
  const [isUploading, setIsUploading] = useState(false);
  
  // Upload file and get URL
  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    if (!file) return null;
    
    setIsUploading(true);
    try {
      const url = await firebaseService.uploadFile(file, path);
      return url;
    } catch (error) {
      toast.error('Erro ao fazer upload do arquivo.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Upload multiple files
  const uploadFiles = async (files: File[], path: string): Promise<string[]> => {
    if (!files || !files.length) return [];
    
    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => firebaseService.uploadFile(file, path));
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      toast.error('Erro ao fazer upload dos arquivos.');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  // Delete file
  const deleteFile = async (url: string): Promise<boolean> => {
    if (!url) return false;
    
    try {
      await firebaseService.deleteFile(url);
      return true;
    } catch (error) {
      toast.error('Erro ao excluir arquivo.');
      return false;
    }
  };

  // Upload base64 image
  const uploadBase64Image = async (base64: string, path: string, fileName: string): Promise<string | null> => {
    if (!base64) return null;
    
    setIsUploading(true);
    try {
      const file = firebaseService.base64ToFile(base64, fileName);
      const url = await firebaseService.uploadFile(file, path);
      return url;
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    uploadFiles,
    deleteFile,
    uploadBase64Image,
    isUploading
  };
};

// Funcionarios hook
export const useFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all employees
  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      const funcionariosData = await firebaseService.getAllFuncionarios();
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
      return await firebaseService.getFuncionario(id);
    } catch (error) {
      toast.error('Erro ao carregar funcionário.');
      return null;
    }
  };

  // Save an employee
  const saveFuncionario = async (funcionario: Funcionario) => {
    try {
      await firebaseService.saveFuncionario(funcionario);
      toast.success('Funcionário salvo com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao salvar funcionário.');
      return false;
    }
  };

  return {
    funcionarios,
    loading,
    fetchFuncionarios,
    getFuncionario,
    saveFuncionario
  };
};
