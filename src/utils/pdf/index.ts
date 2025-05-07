
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { OrdemServico } from "@/types/ordens";
import { calcularProgressos, calcularTempos } from "./calculators";
import { adicionarInfoClienteEDatas, adicionarSecaoProgresso, adicionarTabelaServicos, adicionarTabelaEtapas, adicionarFotosPDF, adicionarSecaoResponsaveis } from "./sections";

export * from "./helpers";
export * from "./calculators";
export * from "./types";

// Função para pré-carregar imagens
const preloadImages = async (urls: string[]): Promise<{url: string, imgData: string}[]> => {
  const loadedImages: {url: string, imgData: string}[] = [];
  
  const loadImage = (url: string) => {
    return new Promise<{url: string, imgData: string} | null>((resolve) => {
      // Timeout para evitar travamentos
      const timeout = setTimeout(() => {
        console.warn(`Timeout ao carregar imagem: ${url}`);
        resolve(null);
      }, 5000);
      
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
          clearTimeout(timeout);
          
          // Criar canvas para converter a imagem para data URL
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg");
            resolve({url, imgData: dataUrl});
          } else {
            resolve(null);
          }
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          console.error(`Erro ao carregar imagem: ${url}`);
          resolve(null);
        };
        
        img.src = url;
      } catch (error) {
        clearTimeout(timeout);
        console.error(`Erro ao processar imagem: ${url}`, error);
        resolve(null);
      }
    });
  };
  
  // Processar até 3 imagens de cada vez para evitar sobrecarga
  const batchSize = 3;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(url => loadImage(url)));
    
    // Filtrar resultados nulos
    batchResults.forEach(result => {
      if (result) {
        loadedImages.push(result);
      }
    });
  }
  
  return loadedImages;
};

// Validar se a URL é válida
const isValidImageUrl = (url: any): url is string => {
  if (!url) return false;
  
  // Se for um objeto, verificar se tem propriedade data ou url
  if (typeof url === 'object') {
    return !!(url.data || url.url);
  }
  
  // Se for string, verificar se é uma URL ou base64
  if (typeof url === 'string') {
    return url.startsWith('http') || url.startsWith('data:image');
  }
  
  return false;
};

// Extrair URL da imagem independente do formato
const extractImageUrl = (img: any): string => {
  if (typeof img === 'string') {
    return img;
  }
  
  if (typeof img === 'object') {
    if (img.url) return img.url;
    if (img.data) return img.data;
  }
  
  return '';
};

export const generateOrderPDF = async (ordem: OrdemServico): Promise<void> => {
  try {
    console.log("Iniciando geração do PDF para ordem:", ordem.id);
    toast.info("Gerando PDF da ordem...");
    
    // Calcular dados necessários para o PDF
    const progressosData = calcularProgressos(ordem);
    const temposData = calcularTempos(ordem);
    
    // Criar documento PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Adicionar autoTable ao doc corretamente
    autoTable(doc, {});  // Inicializa com opções vazias
    
    console.log("Documento PDF criado, adicionando seções...");
    
    // Adicionar seções ao PDF
    adicionarInfoClienteEDatas(doc, ordem);
    adicionarSecaoProgresso(doc, progressosData, temposData);
    adicionarSecaoResponsaveis(doc, ordem);
    adicionarTabelaServicos(doc, ordem, progressosData);
    adicionarTabelaEtapas(doc, progressosData, temposData);
    
    // CORREÇÃO: Melhorar preparação e processamento das fotos
    console.log("Preparando fotos para o PDF");
    
    // Processamento e validação das fotos de entrada
    let fotosEntradaUrls: string[] = [];
    if (Array.isArray(ordem.fotosEntrada)) {
      fotosEntradaUrls = ordem.fotosEntrada
        .filter(foto => isValidImageUrl(foto))
        .map(foto => extractImageUrl(foto));
    }
      
    // Processamento e validação das fotos de saída
    let fotosSaidaUrls: string[] = [];
    if (Array.isArray(ordem.fotosSaida)) {
      fotosSaidaUrls = ordem.fotosSaida
        .filter(foto => isValidImageUrl(foto))
        .map(foto => extractImageUrl(foto));
    }
    
    console.log(`Total de fotos encontradas: ${fotosEntradaUrls.length} entrada, ${fotosSaidaUrls.length} saída`);
    
    // Pré-carregar as imagens para garantir que sejam adicionadas ao PDF
    if (fotosEntradaUrls.length > 0 || fotosSaidaUrls.length > 0) {
      toast.info("Processando imagens para o PDF...");
      
      // Pré-carregar imagens para obter data URLs
      const fotosEntradaPreloaded = await preloadImages(fotosEntradaUrls);
      const fotosSaidaPreloaded = await preloadImages(fotosSaidaUrls);
      
      console.log(`Imagens pré-carregadas: ${fotosEntradaPreloaded.length} entrada, ${fotosSaidaPreloaded.length} saída`);
      
      // Adicionar as fotos pré-carregadas ao PDF
      if (fotosEntradaPreloaded.length > 0 || fotosSaidaPreloaded.length > 0) {
        await adicionarFotosPDF(
          doc, 
          fotosEntradaPreloaded.map(img => img.imgData), 
          fotosSaidaPreloaded.map(img => img.imgData)
        );
        console.log("Fotos adicionadas ao PDF com sucesso");
      } else {
        console.log("Nenhuma foto foi pré-carregada com sucesso");
      }
    } else {
      console.log("Nenhuma foto válida encontrada para adicionar ao PDF");
    }
    
    // Salvar PDF
    const fileName = `ordem_${ordem.id.slice(-5)}_${format(new Date(), 'dd-MM-yyyy', { locale: ptBR })}.pdf`;
    console.log("Salvando PDF com nome:", fileName);
    doc.save(fileName);
    
    console.log("PDF gerado com sucesso!");
    toast.success("PDF gerado com sucesso!");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    toast.error(`Erro ao gerar o PDF da ordem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};
