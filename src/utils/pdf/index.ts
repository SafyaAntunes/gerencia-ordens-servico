
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { OrdemServico } from "@/types/ordens";
import { calcularProgressos, calcularTempos } from "./calculators";
import { adicionarInfoClienteEDatas, adicionarSecaoProgresso, adicionarTabelaServicos, adicionarTabelaEtapas, adicionarFotosPDF } from "./sections";

export * from "./helpers";
export * from "./calculators";
export * from "./types";

export const generateOrderPDF = async (ordem: OrdemServico): Promise<void> => {
  try {
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
    
    // Adicionar seções ao PDF
    adicionarInfoClienteEDatas(doc, ordem);
    adicionarSecaoProgresso(doc, progressosData, temposData);
    adicionarTabelaServicos(doc, ordem, progressosData);
    adicionarTabelaEtapas(doc, progressosData, temposData);
    
    // Adicionar fotos se existirem
    const fotosEntrada = ordem.fotosEntrada || [];
    const fotosSaida = ordem.fotosSaida || [];
    adicionarFotosPDF(doc, fotosEntrada, fotosSaida);
    
    // Salvar PDF
    const fileName = `ordem_${ordem.id.slice(-5)}_${format(new Date(), 'dd-MM-yyyy', { locale: ptBR })}.pdf`;
    doc.save(fileName);
    
    toast.success("PDF gerado com sucesso!");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    toast.error("Erro ao gerar o PDF da ordem.");
  }
};
