
import { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onChange: (files: File[]) => void;
  value?: File[];
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

const ImageUpload = ({ 
  onChange, 
  value = [], 
  multiple = true, 
  maxFiles = 5, 
  disabled = false, 
  className
}: ImageUploadProps) => {
  const [files, setFiles] = useState<File[]>(value || []);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    // Check if adding these files would exceed the limit
    if (multiple && files.length + selectedFiles.length > maxFiles) {
      alert(`Você pode enviar no máximo ${maxFiles} arquivos.`);
      return;
    }
    
    // Create URL previews
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    
    // Update state
    const newFiles = multiple ? [...files, ...selectedFiles] : selectedFiles;
    setFiles(newFiles);
    setPreviews(prev => multiple ? [...prev, ...newPreviews] : newPreviews);
    
    // Call onChange function
    onChange(newFiles);
    
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  }, [files, multiple, maxFiles, onChange]);

  const removeFile = useCallback((index: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    
    // Call onChange function
    onChange(newFiles);
  }, [files, previews, onChange]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {previews.map((preview, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
            <img 
              src={preview} 
              alt={`Uploaded file ${index + 1}`}
              className="object-cover w-full h-full"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full"
              onClick={() => removeFile(index)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {files.length < maxFiles && (
          <div 
            className="border border-dashed rounded-lg aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => !disabled && document.getElementById('file-upload')?.click()}
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">
              Clique para adicionar
            </p>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              multiple={multiple}
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled}
            />
          </div>
        )}
      </div>
      {files.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {files.length} {files.length === 1 ? 'arquivo' : 'arquivos'} selecionados
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
