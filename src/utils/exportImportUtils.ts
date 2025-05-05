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

/**
 * Converte objeto para CSV
 */
export const convertToCSV = (objArray: any[]): string => {
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  
  // Se for um único objeto, converta-o em um array
  const dataArray = Array.isArray(array) ? array : [array];
  
  if (dataArray.length === 0) {
    return '';
  }
  
  // Obter as colunas do primeiro objeto
  const header = Object.keys(dataArray[0]).map(key => `"${key}"`).join(',');
  
  // Converter cada linha de dados
  const rows = dataArray.map(obj => {
    return Object.values(obj).map(value => {
      // Converter objetos em JSON strings
      if (value === null || value === undefined) {
        return '""';
      } else if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } else {
        return `"${String(value).replace(/"/g, '""')}"`;
      }
    }).join(',');
  });
  
  // Juntar cabeçalho e linhas
  return `${header}\n${rows.join('\n')}`;
};

/**
 * Exporta dados para arquivo CSV
 */
export const exportToCsv = (data: any, fileName: string) => {
  try {
    // Converte para array se não for
    const dataArray = Array.isArray(data) ? data : [data];
    
    // Converter para CSV
    const csvContent = convertToCSV(dataArray);
    
    // Criar blob e baixar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Arquivo exportado: ${fileName}`);
  } catch (error) {
    console.error('Erro ao exportar arquivo CSV:', error);
    throw error;
  }
};

/**
 * Parseia CSV e converte para objetos
 */
export const parseCSV = (csvString: string): any[] => {
  // Dividir em linhas
  const lines = csvString.split('\n');
  if (lines.length <= 1) return [];
  
  // Parsear cabeçalho
  const headers = parseCSVLine(lines[0]);
  
  // Parsear dados
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const obj: any = {};
    const currentLine = parseCSVLine(lines[i]);
    
    // Associar colunas aos valores
    for (let j = 0; j < headers.length; j++) {
      const value = currentLine[j];
      
      // Tentar converter objetos JSON
      try {
        if (value && (value.startsWith('{') || value.startsWith('['))) {
          obj[headers[j]] = JSON.parse(value);
        } else {
          obj[headers[j]] = value;
        }
      } catch (e) {
        obj[headers[j]] = value;
      }
    }
    
    result.push(obj);
  }
  
  return result;
};

/**
 * Parse individual CSV line considering quoted fields
 */
const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle double quotes
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  return result;
};

/**
 * Importa dados de arquivo CSV
 */
export const importFromCSV = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target || !event.target.result) {
          throw new Error('Falha ao ler arquivo');
        }
        
        const csvString = event.target.result as string;
        const data = parseCSV(csvString);
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo CSV'));
    };
    
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
