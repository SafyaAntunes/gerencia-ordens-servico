
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
    // Corrigimos a forma de chamar autoTable
    autoTable(doc, {
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
  
  // Corrigimos a forma de chamar autoTable
  autoTable(doc, {
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
  
  // Corrigimos a forma de chamar autoTable
  autoTable(doc, {
    startY: currentY + 15,
    head: [['Etapa', 'Progresso', 'Tempo Registrado']],
    body: etapasData,
  });
};

// Adicionar fotos ao PDF
export const adicionarFotosPDF = async (
  doc: jsPDF,
  fotosEntrada: any[],
  fotosSaida: any[]
): Promise<void> => {
  if (fotosEntrada.length === 0 && fotosSaida.length === 0) return;
  
  try {
    // Garantir que estamos em uma nova página para as fotos
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Fotos da Ordem", 14, 20);
    
    let y = 30;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const imageWidth = (pageWidth - margin * 2) / 2; // 2 columns of images
    
    // Adicionar fotos de entrada com melhor tratamento de erros
    if (fotosEntrada.length > 0) {
      doc.setFontSize(12);
      doc.text("Fotos de Entrada", 14, y);
      y += 10;
      
      // Limitar a 4 fotos por seção
      const fotosToShow = fotosEntrada.slice(0, 4);
      
      for (let i = 0; i < fotosToShow.length; i++) {
        try {
          const url = typeof fotosToShow[i] === 'string' 
            ? fotosToShow[i] as string
            : (fotosToShow[i] as any)?.data || '';
          
          if (!url || url.includes('video') || url.match(/\.(mp4|webm|ogg|mov)$/i)) {
            console.log("Ignorando vídeo ou arquivo inválido");
            continue; // Skip videos or invalid files
          }
          
          // Define column position
          const isLeftColumn = i % 2 === 0;
          const currentPosX = isLeftColumn ? margin : margin + imageWidth;
          
          // Avança para nova linha a cada 2 imagens
          if (i > 0 && i % 2 === 0) {
            y += 60; // Height of each image row
          }
          
          console.log(`Adicionando foto de entrada ${i+1} em posição (${currentPosX}, ${y})`);
          
          // Add image to PDF with better error handling
          try {
            // Verifica se a URL é válida para uma imagem
            if (url && url.length > 0) {
              doc.addImage(url, 'JPEG', currentPosX, y, imageWidth - 5, 45);
            } else {
              throw new Error("URL de imagem vazia");
            }
          } catch (imgError) {
            console.error(`Erro ao adicionar imagem ${i}: ${imgError}`);
            
            // Desenhar um retângulo como placeholder
            doc.setDrawColor(200, 200, 200);
            doc.rect(currentPosX, y, imageWidth - 5, 45);
            doc.setFontSize(8);
            doc.text('Imagem não disponível', currentPosX + 15, y + 25);
          }
        } catch (error) {
          console.error('Erro ao processar imagem para PDF:', error);
        }
      }
      
      y += 70; // Espaço adicional após a seção
    }
    
    // Adicionar fotos de saída com melhor tratamento de erros
    if (fotosSaida.length > 0) {
      doc.setFontSize(12);
      doc.text("Fotos de Saída", 14, y);
      y += 10;
      
      // Limitar a 4 fotos por seção
      const fotosToShow = fotosSaida.slice(0, 4);
      
      for (let i = 0; i < fotosToShow.length; i++) {
        try {
          const url = typeof fotosToShow[i] === 'string' 
            ? fotosToShow[i] as string
            : (fotosToShow[i] as any)?.data || '';
          
          if (!url || url.includes('video') || url.match(/\.(mp4|webm|ogg|mov)$/i)) {
            console.log("Ignorando vídeo ou arquivo inválido");
            continue; // Skip videos or invalid files
          }
          
          // Define column position
          const isLeftColumn = i % 2 === 0;
          const currentPosX = isLeftColumn ? margin : margin + imageWidth;
          
          // Avança para nova linha a cada 2 imagens
          if (i > 0 && i % 2 === 0) {
            y += 60; // Height of each image row
          }
          
          console.log(`Adicionando foto de saída ${i+1} em posição (${currentPosX}, ${y})`);
          
          // Add image to PDF with better error handling
          try {
            // Verifica se a URL é válida para uma imagem
            if (url && url.length > 0) {
              doc.addImage(url, 'JPEG', currentPosX, y, imageWidth - 5, 45);
            } else {
              throw new Error("URL de imagem vazia");
            }
          } catch (imgError) {
            console.error(`Erro ao adicionar imagem de saída ${i}: ${imgError}`);
            
            // Desenhar um retângulo como placeholder
            doc.setDrawColor(200, 200, 200);
            doc.rect(currentPosX, y, imageWidth - 5, 45);
            doc.setFontSize(8);
            doc.text('Imagem não disponível', currentPosX + 15, y + 25);
          }
        } catch (error) {
          console.error('Erro ao processar imagem de saída para PDF:', error);
        }
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar fotos ao PDF:", error);
    // Continue with PDF generation without images
  }
};
