
import React from 'react';
import { Button } from '@/components/ui/button';
import { OrdemServico } from '@/types/ordens';
import { Download, FileImage, Export } from 'lucide-react';
import { downloadImages } from '@/utils/exportImportUtils';
import { exportToJson } from '@/utils/exportImportUtils';

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
      exportToJson(ordem, `ordem_${ordem.id}.json`);
    }
  };
  
  const handleDownloadFotos = () => {
    if (onDownloadFotos) {
      onDownloadFotos();
    } else {
      downloadImages(allFotos, `fotos_ordem_${ordem.id}.zip`);
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
        <Export className="mr-2 h-4 w-4" />
        Exportar Ordem
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
