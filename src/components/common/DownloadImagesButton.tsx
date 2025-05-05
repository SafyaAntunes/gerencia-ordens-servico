
import React from 'react';
import { Button } from '@/components/ui/button';
import { downloadImages } from '@/utils/exportImportUtils';
import { FileImage } from 'lucide-react';

interface DownloadImagesButtonProps {
  imageUrls: string[];
  zipName: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  buttonText?: string;
}

const DownloadImagesButton: React.FC<DownloadImagesButtonProps> = ({
  imageUrls,
  zipName,
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false,
  buttonText = 'Baixar Fotos'
}) => {
  const handleDownload = () => {
    downloadImages(imageUrls, zipName);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={disabled || !imageUrls?.length}
    >
      <FileImage className="mr-2" />
      {buttonText}
    </Button>
  );
};

export default DownloadImagesButton;
