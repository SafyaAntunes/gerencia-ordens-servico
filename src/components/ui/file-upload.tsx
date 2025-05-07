import { ChangeEvent, forwardRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, FileVideo, Images, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value?: File | string | any; // Pode ser File, string URL ou objeto com data: base64
  onChange?: (file: File | null | File[]) => void; // Updated to accept File[] for multiple files
  onRemove?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  accept?: string;
  className?: string;
  maxSize?: number; // Em MB
  multiple?: boolean; // Suporte para upload múltiplo
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ value, onChange, onRemove, onSelect, isSelected = false, accept = "image/*,video/*", className, maxSize = 50, multiple = false }, ref) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fileType, setFileType] = useState<"image" | "video" | "other">("other");

    // Processar o valor para extrair a URL de visualização
    useEffect(() => {
      if (!value) {
        setPreview(null);
        return;
      }

      const determineFileType = (url: string) => {
        if (url.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) || url.includes("image")) return "image";
        if (url.match(/\.(mp4|webm|ogg|mov|avi)$/i) || url.includes("video")) return "video";
        
        // Check MIME type if available
        if (typeof value === 'object' && value.type) {
          if (value.type.startsWith('image/')) return "image";
          if (value.type.startsWith('video/')) return "video";
        }
        
        return "other";
      };

      if (typeof value === 'string') {
        // Se for uma string URL ou base64
        setPreview(value);
        setFileType(determineFileType(value));
      } else if (value instanceof File) {
        // Se for um arquivo, criar URL de objeto
        const fileUrl = URL.createObjectURL(value);
        setPreview(fileUrl);
        setFileType(value.type.startsWith('image/') ? "image" : 
                   value.type.startsWith('video/') ? "video" : "other");
        
        // Limpar URL do objeto quando o componente for desmontado
        return () => URL.revokeObjectURL(fileUrl);
      } else if (value && typeof value === 'object' && 'data' in value) {
        // Se for um objeto com propriedade data (formato { nome, tipo, tamanho, data })
        setPreview(value.data);
        setFileType(value.tipo?.startsWith('image/') ? "image" : 
                   value.tipo?.startsWith('video/') ? "video" : "other");
      }
    }, [value]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const files = e.target.files;

      if (!files || files.length === 0) return;
      
      if (multiple) {
        // Processar múltiplos arquivos
        const fileArray = Array.from(files);
        
        // Validar tamanho dos arquivos
        const oversizedFiles = fileArray.filter(file => file.size > maxSize * 1024 * 1024);
        if (oversizedFiles.length > 0) {
          setError(`${oversizedFiles.length} arquivo(s) excedem o tamanho máximo de ${maxSize}MB`);
          return;
        }
        
        if (onChange) {
          onChange(fileArray);
        }
      } else {
        // Processar um único arquivo
        const file = files[0];
        
        // Validar tamanho do arquivo (em MB)
        if (file.size > maxSize * 1024 * 1024) {
          setError(`O arquivo excede o tamanho máximo de ${maxSize}MB`);
          return;
        }

        // Criar preview
        const fileUrl = URL.createObjectURL(file);
        setPreview(fileUrl);
        setFileType(file.type.startsWith('image/') ? "image" : 
                  file.type.startsWith('video/') ? "video" : "other");
        
        if (onChange) {
          onChange(file);
        }
      }
    };

    const handleRemove = () => {
      setPreview(null);
      setError(null);
      if (onRemove) {
        onRemove();
      }
    };

    const handleSelect = () => {
      if (onSelect) {
        onSelect();
      }
    };

    const inputId = `file-upload-${Math.random().toString(36).substring(7)}`;

    // Se não houver valor e não for um componente para upload, não renderizar
    if (!value && !onChange) return null;

    return (
      <div className={cn("space-y-2", className)}>
        <input
          type="file"
          id={inputId}
          className="sr-only"
          onChange={handleFileChange}
          accept={accept}
          ref={ref}
          multiple={multiple}
        />
        
        {preview ? (
          <div className={cn(
            "relative rounded-md overflow-hidden border border-border h-48 group",
            isSelected ? "ring-2 ring-primary" : ""
          )}>
            {fileType === "image" ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : fileType === "video" ? (
              <video
                src={preview}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <p className="text-sm text-muted-foreground">Arquivo não suportado para preview</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="flex gap-2">
                {onSelect && (
                  <Button
                    type="button"
                    variant={isSelected ? "default" : "secondary"}
                    size="icon"
                    onClick={handleSelect}
                    className="h-8 w-8"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                {onRemove && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={handleRemove}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary/50 transition-colors"
          >
            {error ? (
              <div className="text-center p-4">
                <span className="text-destructive text-sm font-medium block">
                  {error}
                </span>
                <span className="text-muted-foreground text-xs mt-1 block">
                  Selecione outro arquivo
                </span>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {multiple ? (
                    <Images className="h-10 w-10 text-muted-foreground mb-2" />
                  ) : (
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  )}
                  <p className="text-sm font-medium mb-1">
                    Clique para selecionar {multiple ? "arquivos" : "um arquivo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Imagens e Vídeos (max. {maxSize}MB {multiple ? "cada" : ""})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    SVG, PNG, JPG, GIF, MP4, WEBM
                  </p>
                </div>
              </>
            )}
          </label>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
