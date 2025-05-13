import { SubAtividade } from "@/types/ordens";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ServicoDetailsProps {
  descricao?: string;
  subatividades: SubAtividade[];
  temPermissao: boolean;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
}

export default function ServicoDetails({
  descricao,
  subatividades,
  temPermissao,
  onSubatividadeToggle
}: ServicoDetailsProps) {
  const handleToggle = (subatividadeId: string, checked: boolean) => {
    console.log('ServicoDetails - Toggle:', { subatividadeId, checked });
    onSubatividadeToggle(subatividadeId, checked);
  };

  return (
    <>
      {descricao && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Descrição</h4>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
      )}

      {subatividades.length > 0 && (
        <div role="group" aria-labelledby="subatividades-heading">
          <h4 id="subatividades-heading" className="text-sm font-medium mb-2">
            Subatividades
          </h4>
          <div className="space-y-2">
            {subatividades.map((subatividade) => {
              const checkboxId = `subatividade-${subatividade.id}`;
              return (
                <div 
                  key={subatividade.id} 
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={checkboxId}
                      checked={subatividade.concluida}
                      onCheckedChange={(checked) => handleToggle(subatividade.id, checked === true)}
                      disabled={!temPermissao}
                      className="data-[state=checked]:bg-green-600"
                      aria-label={subatividade.nome}
                      aria-describedby={subatividade.tempoEstimado ? `tempo-${subatividade.id}` : undefined}
                    />
                    <Label
                      htmlFor={checkboxId}
                      className={cn(
                        "text-sm cursor-pointer select-none",
                        subatividade.concluida ? "text-muted-foreground line-through" : ""
                      )}
                    >
                      {subatividade.nome}
                    </Label>
                  </div>
                  {subatividade.tempoEstimado && (
                    <span 
                      id={`tempo-${subatividade.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      {subatividade.tempoEstimado} {subatividade.tempoEstimado === 1 ? 'hora' : 'horas'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
