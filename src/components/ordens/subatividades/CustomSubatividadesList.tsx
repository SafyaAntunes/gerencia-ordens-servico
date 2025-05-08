
import { SubAtividade } from "@/types/ordens";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomSubatividadesListProps {
  subatividades: SubAtividade[];
  onRemove: (id: string) => void;
  onToggle: (id: any, checked: any) => void;
  disabled: boolean;
}

export function CustomSubatividadesList({
  subatividades,
  onRemove,
  onToggle,
  disabled
}: CustomSubatividadesListProps) {
  const customSubatividades = subatividades.filter(sub => sub.id.startsWith('custom-'));

  if (customSubatividades.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium">Subatividades Personalizadas</h4>
      {customSubatividades.map((sub) => (
        <div key={sub.id} className="flex items-center justify-between border p-2 rounded-md">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`sub-${sub.id}`}
              checked={sub.selecionada}
              onCheckedChange={(checked) =>
                onToggle(sub.id, checked === true)
              }
              disabled={disabled}
              className="cursor-pointer"
            />
            <Label
              htmlFor={`sub-${sub.id}`}
              className="font-medium cursor-pointer"
            >
              {sub.nome}
            </Label>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(sub.id)}
            disabled={disabled}
          >
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
