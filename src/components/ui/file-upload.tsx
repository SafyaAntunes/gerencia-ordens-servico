
import { ChangeEvent, forwardRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value?: File | string;
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  accept?: string;
  className?: string;
  maxSize?: number;
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ value, onChange, onRemove, accept = "image/*", className, maxSize = 5 }, ref) => {
    const [preview, setPreview] = useState<string | null>(
      typeof value === "string" ? value : null
    );
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];

      if (!file) return;
      
      // Validar tamanho do arquivo (em MB)
      if (file.size > maxSize * 1024 * 1024) {
        setError(`O arquivo excede o tamanho máximo de ${maxSize}MB`);
        return;
      }

      // Criar preview
      const fileUrl = URL.createObjectURL(file);
      setPreview(fileUrl);
      
      if (onChange) {
        onChange(file);
      }
    };

    const handleRemove = () => {
      setPreview(null);
      setError(null);
      if (onRemove) {
        onRemove();
      }
    };

    return (
      <div className={cn("space-y-2", className)}>
        <input
          type="file"
          id="file-upload"
          className="sr-only"
          onChange={handleFileChange}
          accept={accept}
          ref={ref}
        />
        
        {preview ? (
          <div className="relative rounded-md overflow-hidden border border-border h-48 group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="file-upload"
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
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">
                    Clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SVG, PNG, JPG ou GIF (max. {maxSize}MB)
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
