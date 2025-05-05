
import React from 'react';
import { Button } from '@/components/ui/button';
import { exportToCsv } from '@/utils/exportImportUtils';
import { FileDown } from 'lucide-react';

interface ExportButtonProps {
  data: any;
  fileName: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  buttonText?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  fileName,
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false,
  buttonText = 'Exportar'
}) => {
  const handleExport = () => {
    exportToCsv(data, fileName);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleExport}
      disabled={disabled || !data}
    >
      <FileDown className="mr-2" />
      {buttonText}
    </Button>
  );
};

export default ExportButton;
