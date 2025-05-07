
import React from 'react';
import { Button } from '@/components/ui/button';
import { OrdemServico } from '@/types/ordens';
import { FileDown, FileImage, FileText } from 'lucide-react';
import { downloadImages, exportToCsv } from '@/utils/exportImportUtils';
import { generateOrderPDF } from '@/utils/pdf';
import { toast } from 'sonner';

interface OrdemActionButtonsProps {
  ordem: OrdemServico;
  disabled?: boolean;
  onExport?: () => void;
  onDownloadFotos?: () => void;
}

const OrdemActionButtons: React.FC<OrdemActionButtonsProps> = ({
  ordem,
  disabled = false,
  onExport,
  onDownloadFotos
}) => {
  const allFotos = [
    ...(ordem.fotosEntrada || []),
    ...(ordem.fotosSaida || [])
  ];
  
  const hasPhotos = allFotos.length > 0;
  
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      exportToCsv([ordem], `ordem_${ordem.id}.csv`);
    }
  };
  
  const handleDownloadFotos = () => {
    if (onDownloadFotos) {
      onDownloadFotos();
    } else {
      downloadImages(allFotos, `fotos_ordem_${ordem.id}.zip`);
    }
  };
  
  const handleGeneratePdf = async () => {
    try {
      console.log("Chamando função generateOrderPDF para a ordem:", ordem.id);
      await generateOrderPDF(ordem);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF da ordem");
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant="outline" 
        size="sm"
        disabled={disabled} 
        onClick={handleExport}
      >
        <FileDown className="mr-2 h-4 w-4" />
        Exportar CSV
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={handleGeneratePdf}
      >
        <FileText className="mr-2 h-4 w-4" />
        Exportar PDF
      </Button>
      
      {hasPhotos && (
        <Button 
          variant="outline" 
          size="sm"
          disabled={disabled} 
          onClick={handleDownloadFotos}
        >
          <FileImage className="mr-2 h-4 w-4" />
          Baixar Fotos
        </Button>
      )}
    </div>
  );
};

export default OrdemActionButtons;
