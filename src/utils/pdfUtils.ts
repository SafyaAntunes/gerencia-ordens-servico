
import { OrdemServico, StatusOS, EtapaOS } from "@/types/ordens";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Add type extension to make TypeScript happy with jsPDF-autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    previousAutoTable?: {
      finalY: number;
    };
  }
}

// Status labels for PDF
const statusLabels: Record<StatusOS, string> = {
  orcamento: "Orçamento",
  aguardando_aprovacao: "Aguardando Aprovação",
  fabricacao: "Fabricação",
  aguardando_peca_cliente: "Aguardando Peça (Cliente)",
  aguardando_peca_interno: "Aguardando Peça (Interno)",
  finalizado: "Finalizado",
  entregue: "Entregue"
};

// Etapa labels for PDF
const etapasNomes: Record<string, string> = {
  lavagem: "Lavagem",
  inspecao_inicial: "Inspeção Inicial",
  retifica: "Retífica",
  montagem: "Montagem",
  dinamometro: "Dinamômetro",
  inspecao_final: "Inspeção Final"
};

// Format time for PDF
const formatarTempo = (ms: number) => {
  if (!ms) return "0h";
  const horas = Math.floor(ms / (1000 * 60 * 60));
  const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${horas}h${minutos > 0 ? ` ${minutos}m` : ''}`;
};

// Calculate progress percentages for PDF
const calcularProgressos = (ordem: OrdemServico) => {
  // Progresso por etapa
  const progressoEtapas: Record<string, number> = {};
  let totalEtapas = 0;
  let completedEtapas = 0;
  
  Object.entries(ordem.etapasAndamento || {}).forEach(([etapa, dados]) => {
    const etapaBase = etapa.split('_')[0] as EtapaOS;
    const progresso = dados.concluido ? 100 : 0; // Corrigido: concluido em vez de concluida e removido progresso
    progressoEtapas[etapaBase] = progresso;
    
    totalEtapas++;
    if (dados.concluido) completedEtapas++; // Corrigido: concluido em vez de concluida
  });
  
  // Progresso por serviço
  const progressoServicos: Record<string, number> = {};
  ordem.servicos.forEach(servico => {
    let progresso = 0;
    if (servico.subatividades && servico.subatividades.length > 0) {
      const total = servico.subatividades.length;
      const concluidas = servico.subatividades.filter(sub => sub.concluida).length;
      progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    }
    progressoServicos[servico.tipo] = progresso;
  });
  
  // Progresso total
  const progressoTotal = totalEtapas > 0 
    ? Math.round((completedEtapas / totalEtapas) * 100)
    : 0;
    
  return { progressoEtapas, progressoServicos, progressoTotal };
};

// Calculate time data for PDF
const calcularTempos = (ordem: OrdemServico) => {
  const temposPorEtapa: Record<string, number> = {};
  let tempoTotalRegistrado = 0;
  
  // Calcular tempo por etapa - usando tempo estimado já que tempoTotal não existe
  Object.entries(ordem.etapasAndamento || {}).forEach(([etapa, dadosEtapa]) => {
    const etapaBase = etapa.split('_')[0] as EtapaOS;
    // Use tempoEstimado em vez de tempoTotal que não existe
    const tempoEtapa = dadosEtapa.tempoEstimado ? dadosEtapa.tempoEstimado * 60 * 60 * 1000 : 0; // Convertendo horas para ms
    
    temposPorEtapa[etapaBase] = (temposPorEtapa[etapaBase] || 0) + tempoEtapa;
    tempoTotalRegistrado += tempoEtapa;
  });
  
  // Calcular tempo estimado total
  let tempoEstimado = ordem.tempoTotalEstimado || 0;
  if (tempoEstimado === 0) {
    // Somar tempos estimados de etapas
    Object.entries(ordem.etapasAndamento || {}).forEach(([, dadosEtapa]) => {
      tempoEstimado += dadosEtapa.tempoEstimado || 0;
    });
    
    // Converter para milissegundos
    tempoEstimado *= 60 * 60 * 1000; // horas para ms
  }
  
  // Calcular dias em andamento
  const inicioDate = ordem.dataAbertura ? new Date(ordem.dataAbertura) : new Date();
  const agora = new Date();
  const diff = agora.getTime() - inicioDate.getTime();
  const diasEmAndamento = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return { temposPorEtapa, tempoTotalRegistrado, tempoEstimado, diasEmAndamento };
};

export const generateOrderPDF = async (ordem: OrdemServico): Promise<void> => {
  try {
    toast.info("Gerando PDF da ordem...");
    
    const { progressoEtapas, progressoServicos, progressoTotal } = calcularProgressos(ordem);
    const { temposPorEtapa, tempoTotalRegistrado, tempoEstimado, diasEmAndamento } = calcularTempos(ordem);
    
    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Ordem de Serviço #${ordem.id.slice(-5)}`, 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 28);
    doc.text(`Status: ${statusLabels[ordem.status as StatusOS] || ordem.status}`, 14, 35);
    
    // Client info
    doc.setFontSize(14);
    doc.text("Informações do Cliente", 14, 45);
    doc.setFontSize(11);
    doc.text(`Cliente: ${ordem.cliente?.nome || 'Não informado'}`, 14, 53);
    doc.text(`Motor: ${ordem.motorId || 'Não informado'}`, 14, 60);
    
    // Dates section
    doc.text(`Data de Abertura: ${format(new Date(ordem.dataAbertura), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 67);
    doc.text(`Previsão de Entrega: ${format(new Date(ordem.dataPrevistaEntrega), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 74);
    doc.text(`Prioridade: ${ordem.prioridade?.toUpperCase() || 'Não definida'}`, 14, 81);
    
    // Progress section
    doc.setFontSize(14);
    doc.text("Progresso da Ordem", 14, 92);
    doc.setFontSize(11);
    doc.text(`Progresso Total: ${progressoTotal}%`, 14, 100);
    doc.text(`Dias em Andamento: ${diasEmAndamento}`, 14, 107);
    
    // Time section
    doc.text(`Tempo Total Registrado: ${formatarTempo(tempoTotalRegistrado)}`, 14, 114);
    doc.text(`Tempo Estimado: ${formatarTempo(tempoEstimado)}`, 14, 121);
    
    // Services table
    doc.setFontSize(14);
    doc.text("Serviços", 14, 133);
    
    const servicosData = ordem.servicos.map(servico => [
      servico.tipo,
      progressoServicos[servico.tipo] ? `${progressoServicos[servico.tipo]}%` : '0%',
      servico.descricao || '-'
    ]);
    
    doc.autoTable({
      startY: 137,
      head: [['Tipo de Serviço', 'Progresso', 'Descrição']],
      body: servicosData,
    });
    
    // Stages table
    const currentY = doc.previousAutoTable?.finalY || 150;
    doc.setFontSize(14);
    doc.text("Etapas", 14, currentY + 10);
    
    const etapasData = Object.entries(progressoEtapas).map(([etapa, progresso]) => [
      etapasNomes[etapa] || etapa,
      `${progresso}%`,
      formatarTempo(temposPorEtapa[etapa] || 0)
    ]);
    
    doc.autoTable({
      startY: currentY + 15,
      head: [['Etapa', 'Progresso', 'Tempo Registrado']],
      body: etapasData,
    });
    
    // Add photos to new page if they exist
    const fotosEntrada = ordem.fotosEntrada || [];
    const fotosSaida = ordem.fotosSaida || [];
    
    if (fotosEntrada.length > 0 || fotosSaida.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Fotos da Ordem", 14, 20);
      
      let y = 30;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 14;
      const imageWidth = (pageWidth - margin * 2) / 2; // 2 columns of images
      
      if (fotosEntrada.length > 0) {
        doc.setFontSize(12);
        doc.text("Fotos de Entrada", 14, y);
        y += 8;
        
        // Only include the first 4 photos due to PDF size constraints
        const fotosToShow = fotosEntrada.slice(0, 4);
        for (let i = 0; i < fotosToShow.length; i++) {
          const url = typeof fotosToShow[i] === 'string' 
            ? fotosToShow[i] as string
            : (fotosToShow[i] as any)?.data || '';
          
          if (!url || url.includes('video') || url.match(/\.(mp4|webm|ogg|mov)$/i)) {
            continue; // Skip videos
          }
          
          try {
            const isLeftColumn = i % 2 === 0;
            const currentPosX = isLeftColumn ? margin : margin + imageWidth;
            
            // Only get new line for right columns
            if (i > 0 && isLeftColumn) {
              y += 50; // Height of each image row
            }
            
            // Add image to PDF (with placeholder if needed)
            doc.addImage(url, 'JPEG', currentPosX, y, imageWidth - 5, 45);
          } catch (error) {
            console.error('Error adding image to PDF:', error);
            // Add placeholder for failed image
            doc.setDrawColor(200, 200, 200);
            doc.rect(currentPosX, y, imageWidth - 5, 45);
            doc.text('Imagem não disponível', currentPosX + 15, y + 25);
          }
        }
        
        y += 60;
      }
      
      if (fotosSaida.length > 0) {
        doc.setFontSize(12);
        doc.text("Fotos de Saída", 14, y);
        y += 8;
        
        // Only include the first 4 photos due to PDF size constraints
        const fotosToShow = fotosSaida.slice(0, 4);
        for (let i = 0; i < fotosToShow.length; i++) {
          const url = typeof fotosToShow[i] === 'string' 
            ? fotosToShow[i] as string
            : (fotosToShow[i] as any)?.data || '';
          
          if (!url || url.includes('video') || url.match(/\.(mp4|webm|ogg|mov)$/i)) {
            continue; // Skip videos
          }
          
          try {
            const isLeftColumn = i % 2 === 0;
            const currentPosX = isLeftColumn ? margin : margin + imageWidth;
            
            // Only get new line for right columns
            if (i > 0 && isLeftColumn) {
              y += 50; // Height of each image row
            }
            
            // Add image to PDF
            doc.addImage(url, 'JPEG', currentPosX, y, imageWidth - 5, 45);
          } catch (error) {
            console.error('Error adding image to PDF:', error);
            // Add placeholder for failed image
            doc.setDrawColor(200, 200, 200);
            doc.rect(currentPosX, y, imageWidth - 5, 45);
            doc.text('Imagem não disponível', currentPosX + 15, y + 25);
          }
        }
      }
    }
    
    // Save PDF
    const fileName = `ordem_${ordem.id.slice(-5)}_${format(new Date(), 'dd-MM-yyyy', { locale: ptBR })}.pdf`;
    doc.save(fileName);
    
    toast.success("PDF gerado com sucesso!");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    toast.error("Erro ao gerar o PDF da ordem.");
  }
};
