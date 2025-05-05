
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { importFromJson } from '@/utils/exportImportUtils';
import { Import } from 'lucide-react';
import { toast } from 'sonner';

interface ImportButtonProps {
  onImport: (data: any) => void;
  acceptedFileTypes?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  buttonText?: string;
  validateData?: (data: any) => boolean;
}

const ImportButton: React.FC<ImportButtonProps> = ({
  onImport,
  acceptedFileTypes = '.json',
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false,
  buttonText = 'Importar',
  validateData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromJson(file);
      
      if (validateData && !validateData(data)) {
        toast.error('O arquivo não contém dados válidos.');
        return;
      }
      
      onImport(data);
      toast.success('Dados importados com sucesso!');
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      toast.error('Erro ao importar arquivo. Verifique se o formato é válido.');
    } finally {
      // Limpar o input para permitir importar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept={acceptedFileTypes}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleImportClick}
        disabled={disabled}
      >
        <Import className="mr-2" />
        {buttonText}
      </Button>
    </>
  );
};

export default ImportButton;
