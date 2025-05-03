
import { SubAtividade } from "@/types/ordens";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

interface PresetSubatividadesProps {
  presetSubatividades: SubAtividade[];
  subatividades: SubAtividade[];
  editable: boolean;
  onToggleSubatividade: (id: string, checked: boolean) => void;
  onTempoEstimadoChange: (id: string, horas: number) => void;
}

export function PresetSubatividades({
  presetSubatividades,
  subatividades,
  editable,
  onToggleSubatividade,
  onTempoEstimadoChange
}: PresetSubatividadesProps) {
  if (presetSubatividades.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
      {presetSubatividades.map((sub) => {
        const selecionada = subatividades.some(s => s.id === sub.id && s.selecionada);
        const subAtual = subatividades.find(s => s.id === sub.id) || sub;
        
        return (
          <div key={sub.id} className="flex flex-col space-y-2 border p-3 rounded-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`sub-${sub.id}`}
                  checked={selecionada}
                  onCheckedChange={(checked) =>
                    onToggleSubatividade(sub.id, checked === true)
                  }
                  disabled={!editable}
                  className="cursor-pointer"
                />
                <Label
                  htmlFor={`sub-${sub.id}`}
                  className={`font-medium ${!selecionada && "text-muted-foreground"} cursor-pointer`}
                >
                  {sub.nome}
                </Label>
              </div>
              
              {selecionada && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-16 h-8 text-sm"
                    value={subAtual.tempoEstimado || 0}
                    onChange={(e) => onTempoEstimadoChange(sub.id, parseFloat(e.target.value) || 0)}
                    disabled={!editable}
                    placeholder="0h"
                  />
                  <span className="text-xs text-muted-foreground">h</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
