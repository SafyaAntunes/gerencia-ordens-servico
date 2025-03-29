
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { toast } from 'sonner';
import * as firebaseService from '@/services/firebaseService';
import { OrdemServico, Cliente, Motor } from '@/types/ordens';

// Authentication hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await firebaseService.signIn(email, password);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Falha ao entrar. Verifique suas credenciais.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseService.signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao sair.');
    }
  };

  return { user, loading, login, logout };
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

// Images hook for handling uploads
export const useImages = () => {
  // Upload image and get URL
  const uploadImage = async (file: File, path: string) => {
    try {
      return await firebaseService.uploadImage(file, path);
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem.');
      return null;
    }
  };

  // Delete image
  const deleteImage = async (path: string) => {
    try {
      await firebaseService.deleteImage(path);
      return true;
    } catch (error) {
      toast.error('Erro ao excluir imagem.');
      return false;
    }
  };

  // Upload base64 image
  const uploadBase64Image = async (base64: string, path: string, fileName: string) => {
    try {
      const file = firebaseService.base64ToFile(base64, fileName);
      return await firebaseService.uploadImage(file, path);
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem.');
      return null;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploadBase64Image
  };
};
