
import { useState, memo, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { cn } from "@/lib/utils";

interface ServicoSubatividadesProps {
  tipoServico: TipoServico;
  subatividades: SubAtividade[];
  onChange: (subatividades: SubAtividade[]) => void;
}

// Component is now memoized to prevent unnecessary re-renders
export const ServicoSubatividades = memo(({ 
  tipoServico, 
  subatividades, 
  onChange 
}: ServicoSubatividadesProps) => {
  const [isPartiallyChecked, setIsPartiallyChecked] = useState(false);
  
  // Use useCallback to memoize functions
  const toggleAll = useCallback((check: boolean) => {
    const updated = subatividades.map(sub => ({
      ...sub,
      selecionada: check
    }));
    onChange(updated);
  }, [subatividades, onChange]);

  const handleChange = useCallback((id: string, checked: boolean) => {
    const updated = subatividades.map(sub => {
      if (sub.id === id) {
        return {
          ...sub,
          selecionada: checked
        };
      }
      return sub;
    });
    onChange(updated);
  }, [subatividades, onChange]);

  const totalCount = subatividades.length;
  const completedCount = subatividades.filter(sub => sub.selecionada).length;
  
  return (
    <div className="border rounded-md p-3 bg-muted/20">
      <div 
        className="flex justify-between items-center mb-2"
      >
        <h4 className="text-sm font-medium">Subatividades</h4>
        <div className="text-xs text-muted-foreground">
          {completedCount} / {totalCount} disponíveis
        </div>
      </div>
      
      <div className="space-y-1">
        {subatividades.map((subatividade) => (
          <div key={subatividade.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${tipoServico}-${subatividade.id}`}
              checked={subatividade.selecionada}
              onCheckedChange={(checked) => handleChange(subatividade.id, !!checked)}
            />
            <label
              htmlFor={`${tipoServico}-${subatividade.id}`}
              className={cn(
                "text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                subatividade.selecionada && subatividade.concluida && "line-through text-muted-foreground"
              )}
            >
              {subatividade.nome}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
});

// Add display name for better debugging
ServicoSubatividades.displayName = "ServicoSubatividades";
