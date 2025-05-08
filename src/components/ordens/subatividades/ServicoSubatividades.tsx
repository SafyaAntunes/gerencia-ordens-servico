
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { SubAtividade, TipoServico } from "@/types/ordens";

interface ServicoSubatividadesProps {
  tipoServico: TipoServico;
  subatividades: SubAtividade[];
  onChange: (subatividades: SubAtividade[]) => void;
  disabled?: boolean;
}

export const ServicoSubatividades = ({
  tipoServico,
  subatividades,
  onChange,
  disabled = false
}: ServicoSubatividadesProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleToggle = (id: string, checked: boolean) => {
    const updatedSubatividades = subatividades.map(sub => {
      if (sub.id === id) {
        return { ...sub, selecionada: checked };
      }
      return sub;
    });
    
    onChange(updatedSubatividades);
  };
  
  const completedCount = subatividades.filter(sub => sub.selecionada).length;
  const totalCount = subatividades.length;
  
  return (
    <div className="ml-6 mt-2 bg-slate-50 rounded-md p-3">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h4 className="text-sm font-medium">Subatividades</h4>
        <div className="text-xs text-muted-foreground">
          {completedCount} / {totalCount} selecionadas
        </div>
      </div>
      
      {expanded && (
        <div className="mt-2 space-y-2">
          {subatividades.map((sub) => (
            <div key={sub.id} className="flex items-center space-x-2">
              <Checkbox
                id={`subatividade-${sub.id}`}
                checked={sub.selecionada}
                onCheckedChange={(checked) => handleToggle(sub.id, !!checked)}
                disabled={disabled}
                className="data-[state=checked]:bg-green-600"
              />
              <label
                htmlFor={`subatividade-${sub.id}`}
                className="text-xs cursor-pointer select-none"
              >
                {sub.nome}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
