
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { useStorage } from '@/hooks/useStorage';

// Função para exportar dados como arquivo JSON
export const exportToJson = (data: any, fileName: string) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, fileName);
    toast.success('Dados exportados com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    toast.error('Erro ao exportar dados.');
  }
};

// Função para importar dados de arquivo JSON
export const importFromJson = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const data = JSON.parse(event.target.result as string);
          resolve(data);
        } else {
          reject('Falha ao ler arquivo.');
        }
      } catch (error) {
        console.error('Erro ao importar arquivo:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Função para baixar imagens a partir de URLs
export const downloadImages = async (urls: string[], zipName: string = 'imagens.zip') => {
  if (!urls || urls.length === 0) {
    toast.error('Nenhuma imagem para baixar.');
    return;
  }

  try {
    const zip = new JSZip();
    const imgFolder = zip.folder('imagens');
    
    if (!imgFolder) {
      toast.error('Erro ao criar pasta de imagens.');
      return;
    }
    
    toast.info(`Preparando ${urls.length} imagens para download...`);
    
    const fetchPromises = urls.map(async (url, index) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Falha ao baixar imagem ${index + 1}`);
        
        const blob = await response.blob();
        const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `imagem_${index + 1}.${extension}`;
        
        imgFolder.file(fileName, blob);
        return true;
      } catch (error) {
        console.error(`Erro ao baixar imagem ${index + 1}:`, error);
        return false;
      }
    });
    
    const results = await Promise.all(fetchPromises);
    const successCount = results.filter(Boolean).length;
    
    if (successCount === 0) {
      toast.error('Não foi possível baixar nenhuma imagem.');
      return;
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, zipName);
    
    if (successCount < urls.length) {
      toast.warning(`Baixadas ${successCount} de ${urls.length} imagens.`);
    } else {
      toast.success(`${successCount} imagens baixadas com sucesso!`);
    }
  } catch (error) {
    console.error('Erro ao criar arquivo ZIP:', error);
    toast.error('Erro ao baixar imagens.');
  }
};
