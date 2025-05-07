
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico, EtapaOS } from "@/types/ordens";
import { statusLabels, etapasNomes, formatarTempo } from "./helpers";
import { PDFProgressoData, PDFTempoData } from "./types";

// Adicionar seções de informações do cliente e datas
export const adicionarInfoClienteEDatas = (
  doc: jsPDF,
  ordem: OrdemServico
): void => {
  // Add title
  doc.setFontSize(18);
  doc.text(`Ordem de Serviço #${ordem.id.slice(-5)}`, 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 28);
  doc.text(`Status: ${statusLabels[ordem.status] || ordem.status}`, 14, 35);
  
  // Client info
  doc.setFontSize(14);
  doc.text("Informações do Cliente", 14, 45);
  doc.setFontSize(11);
  doc.text(`Cliente: ${ordem.cliente?.nome || 'Não informado'}`, 14, 53);
  if (ordem.motorId) {
    doc.text(`Motor: ${ordem.motorId || 'Não informado'}`, 14, 60);
  }
  
  // Dates section
  doc.text(`Data de Abertura: ${format(new Date(ordem.dataAbertura), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 67);
  if (ordem.dataPrevistaEntrega) {
    doc.text(`Previsão de Entrega: ${format(new Date(ordem.dataPrevistaEntrega), 'dd/MM/yyyy', { locale: ptBR })}`, 14, 74);
  }
  doc.text(`Prioridade: ${ordem.prioridade?.toUpperCase() || 'Não definida'}`, 14, 81);
};

// Adicionar seção de responsáveis e funcionários
export const adicionarSecaoResponsaveis = (
  doc: jsPDF,
  ordem: OrdemServico
): void => {
  // Se não houver informações de responsáveis para mostrar, pular esta seção
  const temResponsaveis = ordem.servicos.some(s => s.funcionarioNome);
  if (!temResponsaveis) return;
  
  const currentY = doc.previousAutoTable?.finalY || 130;
  
  doc.setFontSize(14);
  doc.text("Funcionários Responsáveis", 14, currentY + 10);
  
  const responsaveisData: string[][] = [];
  
  // Adicionar funcionários responsáveis pelos serviços
  ordem.servicos.forEach(servico => {
    if (servico.funcionarioNome) {
      responsaveisData.push([
        etapasNomes[servico.tipo] || servico.tipo,
        servico.funcionarioNome || "Não atribuído",
        servico.dataConclusao 
          ? format(new Date(servico.dataConclusao), 'dd/MM/yyyy', { locale: ptBR }) 
          : "Em andamento"
      ]);
    }
  });
  
  // Adicionar funcionários responsáveis pelas etapas
  Object.entries(ordem.etapasAndamento || {}).forEach(([etapa, dados]) => {
    if (dados.funcionarioNome) {
      responsaveisData.push([
        etapasNomes[etapa] || etapa,
        dados.funcionarioNome || "Não atribuído",
        dados.finalizado 
          ? format(new Date(dados.finalizado), 'dd/MM/yyyy', { locale: ptBR }) 
          : "Em andamento"
      ]);
    }
  });
  
  if (responsaveisData.length > 0) {
    doc.autoTable({
      startY: currentY + 15,
      head: [['Etapa/Serviço', 'Funcionário', 'Data de Conclusão']],
      body: responsaveisData,
    });
  }
};

// Adicionar seção de progresso
export const adicionarSecaoProgresso = (
  doc: jsPDF,
  { progressoTotal }: PDFProgressoData,
  { diasEmAndamento, tempoTotalRegistrado, tempoEstimado }: PDFTempoData
): void => {
  doc.setFontSize(14);
  doc.text("Progresso da Ordem", 14, 92);
  doc.setFontSize(11);
  doc.text(`Progresso Total: ${progressoTotal}%`, 14, 100);
  doc.text(`Dias em Andamento: ${diasEmAndamento}`, 14, 107);
  
  // Time section
  doc.text(`Tempo Total Registrado: ${formatarTempo(tempoTotalRegistrado)}`, 14, 114);
  doc.text(`Tempo Estimado: ${formatarTempo(tempoEstimado)}`, 14, 121);
};

// Adicionar tabela de serviços
export const adicionarTabelaServicos = (
  doc: jsPDF,
  ordem: OrdemServico,
  { progressoServicos }: PDFProgressoData
): void => {
  if (!ordem.servicos || ordem.servicos.length === 0) {
    return; // Skip if no services
  }
  
  doc.setFontSize(14);
  doc.text("Serviços", 14, 133);
  
  const servicosData = ordem.servicos.map(servico => [
    servico.tipo,
    progressoServicos[servico.tipo] ? `${progressoServicos[servico.tipo]}%` : '0%',
    servico.funcionarioNome || '-',
    servico.descricao || '-',
    servico.concluido ? 'Concluído' : 'Em andamento'
  ]);
  
  doc.autoTable({
    startY: 137,
    head: [['Tipo de Serviço', 'Progresso', 'Responsável', 'Descrição', 'Status']],
    body: servicosData,
  });
};

// Adicionar tabela de etapas
export const adicionarTabelaEtapas = (
  doc: jsPDF,
  { progressoEtapas }: PDFProgressoData,
  { temposPorEtapa }: PDFTempoData
): void => {
  if (Object.keys(progressoEtapas).length === 0) {
    return; // Skip if no etapas
  }
  
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
};

// Adicionar fotos ao PDF
export const adicionarFotosPDF = (
  doc: jsPDF,
  fotosEntrada: any[],
  fotosSaida: any[]
): void => {
  if (fotosEntrada.length === 0 && fotosSaida.length === 0) return;
  
  try {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Fotos da Ordem", 14, 20);
    
    let y = 30;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const imageWidth = (pageWidth - margin * 2) / 2; // 2 columns of images
    
    // Adicionar fotos de entrada
    if (fotosEntrada.length > 0) {
      doc.setFontSize(12);
      doc.text("Fotos de Entrada", 14, y);
      y += 8;
      
      // Only include the first 4 photos due to PDF size constraints
      const fotosToShow = fotosEntrada.slice(0, 4);
      for (let i = 0; i < fotosToShow.length; i++) {
        try {
          const url = typeof fotosToShow[i] === 'string' 
            ? fotosToShow[i] as string
            : (fotosToShow[i] as any)?.data || '';
          
          if (!url || url.includes('video') || url.match(/\.(mp4|webm|ogg|mov)$/i)) {
            continue; // Skip videos
          }
          
          // Define column position
          const isLeftColumn = i % 2 === 0;
          const currentPosX = isLeftColumn ? margin : margin + imageWidth;
          
          // Only get new line for even indices (start of a new row)
          if (i > 0 && i % 2 === 0) {
            y += 50; // Height of each image row
          }
          
          console.log(`Adicionando foto ${i+1} em posição (${currentPosX}, ${y})`);
          
          // Add image to PDF (with placeholder if needed)
          try {
            doc.addImage(url, 'JPEG', currentPosX, y, imageWidth - 5, 45);
          } catch (imgError) {
            console.error(`Erro ao adicionar imagem ${i}: ${imgError}`);
            
            // Desenhar um retângulo como placeholder
            doc.setDrawColor(200, 200, 200);
            doc.rect(currentPosX, y, imageWidth - 5, 45);
            doc.setFontSize(8);
            doc.text('Imagem não disponível', currentPosX + 15, y + 25);
          }
        } catch (error) {
          console.error('Error processing image for PDF:', error);
        }
      }
      
      y += 60;
    }
    
    // Adicionar fotos de saída
    if (fotosSaida.length > 0) {
      doc.setFontSize(12);
      doc.text("Fotos de Saída", 14, y);
      y += 8;
      
      // Only include the first 4 photos due to PDF size constraints
      const fotosToShow = fotosSaida.slice(0, 4);
      for (let i = 0; i < fotosToShow.length; i++) {
        try {
          const url = typeof fotosToShow[i] === 'string' 
            ? fotosToShow[i] as string
            : (fotosToShow[i] as any)?.data || '';
          
          if (!url || url.includes('video') || url.match(/\.(mp4|webm|ogg|mov)$/i)) {
            continue; // Skip videos
          }
          
          // Define column position
          const isLeftColumn = i % 2 === 0;
          const currentPosX = isLeftColumn ? margin : margin + imageWidth;
          
          // Only get new line for even indices (start of a new row)
          if (i > 0 && i % 2 === 0) {
            y += 50; // Height of each image row
          }
          
          console.log(`Adicionando foto de saída ${i+1} em posição (${currentPosX}, ${y})`);
          
          // Add image to PDF with better error handling
          try {
            doc.addImage(url, 'JPEG', currentPosX, y, imageWidth - 5, 45);
          } catch (imgError) {
            console.error(`Erro ao adicionar imagem de saída ${i}: ${imgError}`);
            
            // Desenhar um retângulo como placeholder
            doc.setDrawColor(200, 200, 200);
            doc.rect(currentPosX, y, imageWidth - 5, 45);
            doc.setFontSize(8);
            doc.text('Imagem não disponível', currentPosX + 15, y + 25);
          }
        } catch (error) {
          console.error('Error processing output image for PDF:', error);
        }
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar fotos ao PDF:", error);
    // Continue with PDF generation without images
  }
};
