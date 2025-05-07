
import { jsPDF } from "jspdf";
import "jspdf-autotable";
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
    
    console.log("Documento PDF criado, adicionando seções...");
    
    // Adicionar seções ao PDF
    adicionarInfoClienteEDatas(doc, ordem);
    adicionarSecaoProgresso(doc, progressosData, temposData);
    adicionarSecaoResponsaveis(doc, ordem);
    adicionarTabelaServicos(doc, ordem, progressosData);
    adicionarTabelaEtapas(doc, progressosData, temposData);
    
    // Adicionar fotos se existirem (filtrar fotos inválidas)
    const fotosEntrada = Array.isArray(ordem.fotosEntrada) 
      ? ordem.fotosEntrada.filter(foto => foto && (typeof foto === 'string' || foto.data))
      : [];
      
    const fotosSaida = Array.isArray(ordem.fotosSaida) 
      ? ordem.fotosSaida.filter(foto => foto && (typeof foto === 'string' || foto.data))
      : [];
    
    console.log(`Adicionando fotos: ${fotosEntrada.length} entrada, ${fotosSaida.length} saída`);
    
    if (fotosEntrada.length > 0 || fotosSaida.length > 0) {
      adicionarFotosPDF(doc, fotosEntrada, fotosSaida);
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
