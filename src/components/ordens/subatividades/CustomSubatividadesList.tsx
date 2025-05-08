
import { SubAtividade } from "@/types/ordens";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

interface CustomSubatividadesListProps {
  subatividades: SubAtividade[];
  presetSubatividades: SubAtividade[];
  editable: boolean;
  onToggleSubatividade: (id: string, checked: boolean) => void;
  onTempoEstimadoChange: (id: string, horas: number) => void;
  onToggle: (id: string, checked: boolean) => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
}

export function CustomSubatividadesList({
  subatividades,
  presetSubatividades,
  editable,
  onToggleSubatividade,
  onTempoEstimadoChange,
}: CustomSubatividadesListProps) {
  const customSubatividades = subatividades.filter(
    sub => !presetSubatividades.some(p => p.id === sub.id) && sub.selecionada
  );

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
                onToggleSubatividade(sub.id, checked === true)
              }
              disabled={!editable}
              className="cursor-pointer"
            />
            <Label
              htmlFor={`sub-${sub.id}`}
              className="font-medium cursor-pointer"
            >
              {sub.nome}
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              min="0"
              step="0.5"
              className="w-16 h-8 text-sm"
              value={sub.tempoEstimado || 0}
              onChange={(e) => onTempoEstimadoChange(sub.id, parseFloat(e.target.value) || 0)}
              disabled={!editable}
              placeholder="0h"
            />
            <span className="text-xs text-muted-foreground">h</span>
          </div>
        </div>
      ))}
    </div>
  );
}
