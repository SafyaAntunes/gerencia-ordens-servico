
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface FormButtonsProps {
  isLoading: boolean;
  onCancel?: () => void;
}

export const FormButtons = ({ isLoading, onCancel }: FormButtonsProps) => {
  return (
    <div className="flex justify-end gap-3">
      <Button 
        type="button" 
        variant="outline"
        onClick={onCancel}
      >
        <X className="mr-2 h-4 w-4" />
        Cancelar
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-1">
            Salvando...
          </span>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Salvar
          </>
        )}
      </Button>
    </div>
  );
};
