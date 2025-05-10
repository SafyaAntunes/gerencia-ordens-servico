import { memo, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CircleCheck, Clock, CircleX } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface FuncionarioCheckItemProps {
  id: string;
  nome: string;
  status: string;
  especialidades?: string[];
  isChecked: boolean;
  onToggle: (id: string) => void;
}

export const FuncionarioCheckItem = memo(function FuncionarioCheckItem({
  id,
  nome,
  status,
  especialidades,
  isChecked,
  onToggle
}: FuncionarioCheckItemProps) {
  // Memoize o handler de clique para evitar recriações
  const handleToggle = useCallback(() => {
    onToggle(id);
  }, [id, onToggle]);

  return (
    <div 
      className={`flex items-center space-x-2 border p-3 rounded-lg transition-colors ${
        isChecked ? "border-primary bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`funcionario-${id}`}
          checked={isChecked}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
        <Label 
          htmlFor={`funcionario-${id}`}
          className="flex-1 cursor-pointer"
        >
          <div className="flex justify-between">
            <span className="font-medium">{nome}</span>
            {status === 'disponivel' ? (
              <Badge variant="success" className="flex gap-1 items-center">
                <CircleCheck className="h-3.5 w-3.5" />
                Disponível
              </Badge>
            ) : status === 'ocupado' ? (
              <Badge variant="warning" className="flex gap-1 items-center">
                <Clock className="h-3.5 w-3.5" />
                Ocupado
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex gap-1 items-center">
                <CircleX className="h-3.5 w-3.5" />
                Inativo
              </Badge>
            )}
          </div>
          {especialidades && especialidades.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {especialidades.map(esp => (
                <Badge key={esp} variant="secondary" className="text-xs">
                  {esp}
                </Badge>
              ))}
            </div>
          )}
        </Label>
      </div>
    </div>
  );
});
