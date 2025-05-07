
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
    // O tipo do autoTable é próprio do plugin, então precisamos usá-lo corretamente
    autoTable(doc, {});  // Inicializa com opções vazias
    
    console.log("Documento PDF criado, adicionando seções...");
    
    // Adicionar seções ao PDF
    adicionarInfoClienteEDatas(doc, ordem);
    adicionarSecaoProgresso(doc, progressosData, temposData);
    adicionarSecaoResponsaveis(doc, ordem);
    adicionarTabelaServicos(doc, ordem, progressosData);
    adicionarTabelaEtapas(doc, progressosData, temposData);
    
    // CORREÇÃO: Melhorar preparação e processamento das fotos
    // Preparar e filtrar fotos para garantir que só fotos válidas sejam adicionadas
    console.log("Preparando fotos para o PDF");
    
    // Processamento melhorado das fotos de entrada
    const fotosEntrada = Array.isArray(ordem.fotosEntrada) 
      ? ordem.fotosEntrada.filter(foto => {
          if (!foto) return false;
          if (typeof foto === 'string' && foto.length > 0) return true;
          if (foto && typeof foto === 'object' && ((foto as any).data || (foto as any).url)) return true;
          return false;
        })
      : [];
      
    // Processamento melhorado das fotos de saída
    const fotosSaida = Array.isArray(ordem.fotosSaida) 
      ? ordem.fotosSaida.filter(foto => {
          if (!foto) return false;
          if (typeof foto === 'string' && foto.length > 0) return true;
          if (foto && typeof foto === 'object' && ((foto as any).data || (foto as any).url)) return true;
          return false;
        })
      : [];
    
    console.log(`Total de fotos encontradas: ${fotosEntrada.length} entrada, ${fotosSaida.length} saída`);
    
    // Garantir que as fotos sejam adicionadas mesmo se houver poucas
    if (fotosEntrada.length > 0 || fotosSaida.length > 0) {
      // Adicionar com await para garantir que todas as imagens sejam processadas
      console.log("Adicionando fotos ao PDF...");
      toast.info("Processando imagens para o PDF...");
      
      await adicionarFotosPDF(doc, fotosEntrada, fotosSaida);
      console.log("Fotos adicionadas ao PDF com sucesso");
    } else {
      console.log("Nenhuma foto encontrada para adicionar ao PDF");
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
