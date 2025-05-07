
import React from 'react';
import { Button } from '@/components/ui/button';
import { OrdemServico } from '@/types/ordens';
import { FileText } from 'lucide-react';
import { generateOrderPDF } from '@/utils/pdf';
import { toast } from 'sonner';

interface OrdemActionButtonsProps {
  ordem: OrdemServico;
  disabled?: boolean;
}

const OrdemActionButtons: React.FC<OrdemActionButtonsProps> = ({
  ordem,
  disabled = false,
}) => {
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
        onClick={handleGeneratePdf}
      >
        <FileText className="mr-2 h-4 w-4" />
        Exportar PDF
      </Button>
    </div>
  );
};

export default OrdemActionButtons;
