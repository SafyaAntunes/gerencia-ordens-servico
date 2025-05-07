
import { useState, useEffect } from 'react';
import { storage, getStorageWithAuth } from '@/lib/firebase';
import { toast } from 'sonner';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';

interface StorageInfo {
  bytesUsed: number;
  maxSize: number; // por padrão, 5GB para o plano Spark do Firebase
  fileCount: number;
}

export const useStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  
  // Carregar informações de armazenamento ao inicializar o hook
  useEffect(() => {
    fetchStorageInfo();
  }, []);

  // Busca informações sobre o uso do storage
  const fetchStorageInfo = async () => {
    try {
      const maxSize = 5 * 1024 * 1024 * 1024; // 5GB padrão do plano Spark
      let totalBytes = 0;
      let totalFiles = 0;
      
      // Listar todos os arquivos e somar o tamanho
      const storageRef = ref(storage);
      const result = await listAll(storageRef);
      
      // Função recursiva para listar todos os arquivos em todos os diretórios
      const processItems = async (items: any[], path: string) => {
        for (const item of items) {
          // Se for um diretório, listar seus itens recursivamente
          if (item.fullPath.endsWith('/')) { 
            const subResult = await listAll(ref(storage, item.fullPath));
            await processItems(subResult.items, item.fullPath);
            
            // Processar subdiretórios
            for (const prefixItem of subResult.prefixes) {
              const subPrefixResult = await listAll(prefixItem);
              await processItems(subPrefixResult.items, prefixItem.fullPath);
            }
          } 
          // Se for um arquivo, obter seu tamanho
          else {
            try {
              const metadata = await getMetadata(ref(storage, item.fullPath));
              totalBytes += metadata.size;
              totalFiles++;
            } catch (error) {
              console.error(`Erro ao obter metadados para ${item.fullPath}`, error);
            }
          }
        }
      };
      
      // Processar arquivos na raiz
      await processItems(result.items, '/');
      
      // Processar diretórios recursivamente
      for (const prefixItem of result.prefixes) {
        const prefixResult = await listAll(prefixItem);
        await processItems(prefixResult.items, prefixItem.fullPath);
      }
      
      setStorageInfo({
        bytesUsed: totalBytes,
        maxSize: maxSize,
        fileCount: totalFiles
      });
      
    } catch (error) {
      console.error('Erro ao obter informações do storage:', error);
    }
  };
  
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
      
      // Atualizar informações de armazenamento após o upload
      fetchStorageInfo();
      
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
      for (const file of files) {
        const url = await uploadFile(file, path);
        if (url) urls.push(url);
      }
      
      // Atualizar informações de armazenamento após o upload
      fetchStorageInfo();
      
      return urls;
    } catch (error) {
      console.error('Erro ao fazer upload dos arquivos:', error);
      toast.error('Erro ao fazer upload dos arquivos.');
      return urls;
    } finally {
      setIsUploading(false);
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
        
        // Atualizar informações de armazenamento após a exclusão
        fetchStorageInfo();
        
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

  return {
    uploadFile,
    uploadFiles,
    deleteFile,
    uploadBase64Image,
    base64ToFile,
    isUploading,
    storageInfo,
    fetchStorageInfo
  };
};
