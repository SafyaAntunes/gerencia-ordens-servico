
import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { toast } from 'sonner';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { OrdemServico, Cliente, Motor } from '@/types/ordens';
import { Funcionario } from '@/types/funcionarios';

// Orders hook
export const useOrdens = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all orders
  const fetchOrdens = async () => {
    setLoading(true);
    try {
      const ordensRef = collection(db, 'ordens_servico');
      const snapshot = await getDocs(ordensRef);
      const ordensData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OrdemServico[];
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
      const ordemRef = doc(db, 'ordens_servico', id);
      const ordemDoc = await getDoc(ordemRef);
      
      if (!ordemDoc.exists()) {
        return null;
      }
      
      return {
        id: ordemDoc.id,
        ...ordemDoc.data()
      } as OrdemServico;
    } catch (error) {
      toast.error('Erro ao carregar ordem de serviço.');
      return null;
    }
  };

  // Save an order
  const saveOrdem = async (ordem: OrdemServico) => {
    try {
      const { id, ...ordemData } = ordem;
      const ordemRef = id ? doc(db, 'ordens_servico', id) : doc(collection(db, 'ordens_servico'));
      await setDoc(ordemRef, ordemData, { merge: true });
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
      const ordemRef = doc(db, 'ordens_servico', ordem.id);
      await updateDoc(ordemRef, { ...ordem });
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
      const ordemRef = doc(db, 'ordens_servico', id);
      await deleteDoc(ordemRef);
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
      const clientesRef = collection(db, 'clientes');
      const snapshot = await getDocs(clientesRef);
      const clientesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Cliente[];
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
      const clienteRef = doc(db, 'clientes', id);
      const clienteDoc = await getDoc(clienteRef);
      
      if (!clienteDoc.exists()) {
        return null;
      }
      
      return {
        id: clienteDoc.id,
        ...clienteDoc.data()
      } as Cliente;
    } catch (error) {
      toast.error('Erro ao carregar cliente.');
      return null;
    }
  };

  // Save a client
  const saveCliente = async (cliente: Cliente) => {
    try {
      const { id, ...clienteData } = cliente;
      const clienteRef = id ? doc(db, 'clientes', id) : doc(collection(db, 'clientes'));
      await setDoc(clienteRef, clienteData, { merge: true });
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
      const motoresRef = collection(db, `clientes/${clienteId}/motores`);
      const snapshot = await getDocs(motoresRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Motor[];
    } catch (error) {
      toast.error('Erro ao carregar motores do cliente.');
      return [];
    }
  };

  // Save a motor for a client
  const saveMotor = async (motor: Motor, clienteId: string) => {
    try {
      const { id, ...motorData } = motor;
      const motorRef = id ? doc(db, `clientes/${clienteId}/motores`, id) : doc(collection(db, `clientes/${clienteId}/motores`));
      await setDoc(motorRef, motorData, { merge: true });
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
      // Determine file type for better organization
      const fileType = file.type.startsWith('image/') ? 'images' : 
                     file.type.startsWith('video/') ? 'videos' : 'files';
                     
      // Create a path that organizes by file type
      const filePath = `${path}/${fileType}/${Date.now()}_${file.name}`;
      
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
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
    const urls: string[] = [];
    
    try {
      for (const file of files) {
        const url = await uploadFile(file, path);
        if (url) urls.push(url);
      }
      return urls;
    } catch (error) {
      console.error('Erro ao fazer upload dos arquivos:', error);
      toast.error('Erro ao fazer upload dos arquivos.');
      return urls;
    } finally {
      setIsUploading(false);
    }
  };

  // Delete file
  const deleteFile = async (url: string): Promise<boolean> => {
    if (!url) return false;
    
    try {
      // Extract the path from the URL
      const decodedUrl = decodeURIComponent(url);
      const startPath = decodedUrl.indexOf('/o/') + 3;
      const endPath = decodedUrl.indexOf('?');
      const path = decodedUrl.substring(startPath, endPath !== -1 ? endPath : undefined);
      
      if (path) {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        return true;
      } else {
        console.warn('Caminho do arquivo não encontrado na URL:', url);
        return false;
      }
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error('Erro ao excluir arquivo.');
      return false;
    }
  };

  // Convert base64 to File
  const base64ToFile = (base64: string, fileName: string): File => {
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Dados base64 inválidos');
    }
    
    try {
      const arr = base64.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], fileName, { type: mime });
    } catch (error) {
      console.error('Erro ao converter base64 para arquivo:', error);
      throw new Error('Falha ao processar imagem');
    }
  };

  // Upload base64 image
  const uploadBase64Image = async (base64: string, path: string, fileName: string): Promise<string | null> => {
    if (!base64) return null;
    
    setIsUploading(true);
    try {
      const file = base64ToFile(base64, fileName);
      const url = await uploadFile(file, path);
      return url;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
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
    base64ToFile,
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
      const funcionarioRef = id 
        ? doc(db, 'funcionarios', id) 
        : doc(collection(db, 'funcionarios'));
      
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
      
      // Save the document
      await setDoc(funcionarioRef, funcionarioData, { merge: true });
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
