
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { importFromCSV } from '@/utils/exportImportUtils';
import { toast } from 'sonner';
import { FileUp } from 'lucide-react';

interface ImportButtonProps {
  onImport: (data: any[]) => void;
  validateData?: (data: any[]) => boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  buttonText?: string;
}

const ImportButton: React.FC<ImportButtonProps> = ({
  onImport,
  validateData,
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false,
  buttonText = 'Importar'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Verifica a extensão do arquivo
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Por favor, selecione um arquivo CSV.');
        return;
      }

      const importedData = await importFromCSV(file);
      
      // Validação opcional dos dados
      if (validateData && !validateData(importedData)) {
        toast.error('Os dados importados são inválidos ou incompatíveis.');
        return;
      }

      onImport(importedData);
      toast.success('Importação concluída com sucesso!');
      
      // Limpa o input para permitir importar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Falha ao importar dados. Verifique o formato do arquivo.');
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={disabled}
      >
        <FileUp className="mr-2" />
        {buttonText}
      </Button>
    </>
  );
};

export default ImportButton;
