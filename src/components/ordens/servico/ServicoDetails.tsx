
import { SubAtividade } from "@/types/ordens";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ServicoDetailsProps {
  descricao?: string;
  subatividades: SubAtividade[];
  temPermissao: boolean;
  onSubatividadeToggle: (subatividade: SubAtividade) => void;
}

export default function ServicoDetails({
  descricao,
  subatividades,
  temPermissao,
  onSubatividadeToggle,
}: ServicoDetailsProps) {
  return (
    <>
      {descricao && (
        <div className="pt-0 pb-3">
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
      )}
      
      {subatividades.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-3">
            {subatividades.map((subatividade) => (
              <div 
                key={subatividade.id}
                className={cn(
                  "flex items-center justify-between",
                  temPermissao ? "cursor-pointer" : "cursor-default"
                )}
                onClick={() => temPermissao && onSubatividadeToggle(subatividade)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={cn(
                      "h-5 w-5 rounded-full border flex items-center justify-center",
                      subatividade.concluida 
                        ? "border-green-500 bg-green-500/10" 
                        : "border-muted"
                    )}
                  >
                    {subatividade.concluida && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Badge 
                    variant="outline"
                    className={subatividade.concluida ? "text-green-600 border-green-600" : "text-muted-foreground"}
                  >
                    {subatividade.nome}
                  </Badge>
                </div>
                {subatividade.tempoEstimado && (
                  <span className="text-xs text-muted-foreground">
                    {subatividade.tempoEstimado} {subatividade.tempoEstimado === 1 ? 'hora' : 'horas'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
