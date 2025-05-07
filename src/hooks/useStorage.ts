
import { useState, useEffect } from 'react';
import { storage, getStorageWithAuth } from '@/lib/firebase';
import { toast } from 'sonner';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata,
  getStorage,
  StorageReference
} from 'firebase/storage';

type StorageStats = {
  used: number; // em bytes
  total: number; // em bytes
  percentage: number; // percentual utilizado (0-100)
};

export const useStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  
  // Constante para o total de armazenamento disponível (5GB)
  const TOTAL_STORAGE = 5 * 1024 * 1024 * 1024; // 5GB em bytes
  
  // Calcula o espaço usado no storage
  const calculateStorageUsage = async () => {
    try {
      // Obtém o storage autenticado
      const storageInstance = getStorageWithAuth();
      const rootRef = ref(storageInstance, '');
      
      // Lista todos os arquivos e pastas no root
      const listResult = await listAll(rootRef);
      
      // Função recursiva para calcular tamanho
      const calculateSize = async (references: StorageReference[]): Promise<number> => {
        let totalSize = 0;
        
        for (const itemRef of references) {
          try {
            // Tenta obter metadados para calcular o tamanho
            const metadata = await getMetadata(itemRef);
            totalSize += metadata.size || 0;
          } catch (error) {
            // Se for uma pasta, lista todos os itens dentro
            try {
              const subList = await listAll(itemRef);
              const subFiles = [...subList.items];
              const subDirs = await Promise.all(
                subList.prefixes.map(async (prefix) => {
                  const subPrefixList = await listAll(prefix);
                  return subPrefixList.items;
                })
              );
              
              // Calcula recursivamente para os subitens
              const subSize = await calculateSize([
                ...subFiles,
                ...subDirs.flat()
              ]);
              totalSize += subSize;
            } catch (listError) {
              console.error('Erro ao listar subitens:', listError);
            }
          }
        }
        
        return totalSize;
      };
      
      // Calcula tamanho total de todos os arquivos no root
      const usedSize = await calculateSize([
        ...listResult.items,
        ...listResult.prefixes
      ]);
      
      // Atualiza os stats de armazenamento
      setStorageStats({
        used: usedSize,
        total: TOTAL_STORAGE,
        percentage: (usedSize / TOTAL_STORAGE) * 100
      });
      
      return usedSize;
    } catch (error) {
      console.error('Erro ao calcular uso do storage:', error);
      return 0;
    }
  };
  
  // Inicializa o cálculo de armazenamento ao carregar o componente
  useEffect(() => {
    calculateStorageUsage();
  }, []);
  
  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    if (!file) return null;
    
    setIsUploading(true);
    try {
      // Use authenticated storage instance
      const storageInstance = getStorageWithAuth();
      
      const fileType = file.type.startsWith('image/') ? 'images' : 
                     file.type.startsWith('video/') ? 'videos' : 'files';
                     
      const filePath = `${path}/${fileType}/${Date.now()}_${file.name}`;
      
      console.log(`Tentando fazer upload para: ${filePath}`);
      
      const storageRef = ref(storageInstance, filePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      console.log(`Upload bem-sucedido: ${url}`);
      
      // Recalcula o espaço usado após o upload
      calculateStorageUsage();
      
      return url;
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      toast.error('Erro ao fazer upload do arquivo. Verifique as permissões de armazenamento.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFiles = async (files: File[], path: string): Promise<string[]> => {
    if (!files || !files.length) return [];
    
    setIsUploading(true);
    const urls: string[] = [];
    
    try {
      // Upload em paralelo para melhorar performance
      const uploadPromises = files.map(file => uploadFile(file, path));
      const results = await Promise.all(uploadPromises);
      
      // Filtrar resultados nulos
      results.forEach(url => {
        if (url) urls.push(url);
      });
      
      return urls;
    } catch (error) {
      console.error('Erro ao fazer upload dos arquivos:', error);
      toast.error('Erro ao fazer upload dos arquivos.');
      return urls;
    } finally {
      setIsUploading(false);
      
      // Recalcula o espaço usado após todos os uploads
      calculateStorageUsage();
    }
  };

  const deleteFile = async (url: string): Promise<boolean> => {
    if (!url) return false;
    
    try {
      const decodedUrl = decodeURIComponent(url);
      const startPath = decodedUrl.indexOf('/o/') + 3;
      const endPath = decodedUrl.indexOf('?');
      const path = decodedUrl.substring(startPath, endPath !== -1 ? endPath : undefined);
      
      if (path) {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        
        // Recalcula o espaço usado após exclusão
        calculateStorageUsage();
        
        return true;
      }
      console.warn('Caminho do arquivo não encontrado na URL:', url);
      return false;
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error('Erro ao excluir arquivo.');
      return false;
    }
  };

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

  // Função para formatar tamanho em bytes para um formato legível
  const formatStorageSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  };

  return {
    uploadFile,
    uploadFiles,
    deleteFile,
    uploadBase64Image,
    base64ToFile,
    isUploading,
    storageStats,
    calculateStorageUsage,
    formatStorageSize
  };
};
