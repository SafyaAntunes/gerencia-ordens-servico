
import React from 'react';
import ExportButton from '@/components/common/ExportButton';
import ImportButton from '@/components/common/ImportButton';

interface ExportImportButtonsProps {
  data: any[];
  onImport: (data: any) => void;
  fileName: string;
  validateData?: (data: any) => boolean;
  disabled?: boolean;
  className?: string;
}

const ExportImportButtons: React.FC<ExportImportButtonsProps> = ({
  data,
  onImport,
  fileName,
  validateData,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      <ImportButton 
        onImport={onImport} 
        validateData={validateData}
        disabled={disabled}
      />
      <ExportButton 
        data={data}
        fileName={fileName}
        disabled={disabled || data.length === 0}
      />
    </div>
  );
};

export default ExportImportButtons;
