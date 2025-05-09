
import { memo, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CircleCheck, Clock, CircleX } from "lucide-react";

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
  // Log para verificar se o isChecked está sendo atualizado
  console.log(`Rendering FuncionarioCheckItem ${id} (${nome}): isChecked=${isChecked}`);

  // Memoize o handler de clique para evitar recriações
  const handleToggle = useCallback(() => {
    console.log(`Checkbox toggle clicked for ${id} (${nome})`);
    onToggle(id);
  }, [id, nome, onToggle]);

  // Memoize o handler do label para evitar recriações
  const handleLabelClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Evitar cliques duplos
    console.log(`Label clicked for ${id} (${nome})`);
    onToggle(id);
  }, [id, nome, onToggle]);

  return (
    <div className="flex items-center space-x-2 border p-3 rounded-lg">
      <Checkbox 
        id={`funcionario-${id}`}
        checked={isChecked}
        // Usar onCheckedChange em vez de onClick para lidar com o evento do Radix UI corretamente
        onCheckedChange={() => handleToggle()}
        className="cursor-pointer"
      />
      <div className="flex-1">
        <Label 
          htmlFor={`funcionario-${id}`}
          className="flex justify-between cursor-pointer"
          onClick={handleLabelClick}
        >
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
        </Label>
        {especialidades && especialidades.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {especialidades.map(esp => (
              <Badge key={esp} variant="secondary" className="text-xs">
                {esp}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
