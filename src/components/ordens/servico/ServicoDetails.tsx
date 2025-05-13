
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Check, RotateCcw } from "lucide-react";
import { Servico, SubAtividade } from "@/types/ordens";

interface ServicoDetailsProps {
  servico: Servico;
  onSubatividadeToggle: (subatividadeId: string, checked: boolean) => void;
  onServicoConcluidoToggle: (checked: boolean) => void;
  onSubatividadeSelecionadaToggle?: (subatividadeId: string, checked: boolean) => void;
  temPermissao: boolean;
}

export default function ServicoDetails({
  servico,
  onSubatividadeToggle,
  onServicoConcluidoToggle,
  onSubatividadeSelecionadaToggle,
  temPermissao
}: ServicoDetailsProps) {
  // Renderiza as subatividades se existirem
  return (
<<<<<<< HEAD
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
=======
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">Descrição</h3>
        <p className="text-sm text-gray-600">{servico.descricao || "Nenhuma descrição disponível."}</p>
      </div>
      
      {servico.subatividades && servico.subatividades.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Subatividades</h3>
          <div className="space-y-2">
            {servico.subatividades.map(sub => (
              <div key={sub.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`sub-${sub.id}`}
                  checked={sub.concluida || false}
                  onCheckedChange={(checked) => {
                    onSubatividadeToggle(sub.id, !!checked);
                  }}
                  disabled={!temPermissao || servico.concluido}
                />
                <label 
                  htmlFor={`sub-${sub.id}`}
                  className={`text-sm ${sub.concluida ? 'line-through text-gray-500' : ''}`}
                >
                  {sub.nome}
                </label>
              </div>
            ))}
>>>>>>> a1f68bc14c670b1a31786cb6cff3b3ccd738ca92
          </div>
        </div>
      )}
      
      {!servico.concluido ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onServicoConcluidoToggle(true)}
          className="flex items-center"
          disabled={!temPermissao}
        >
          <Check className="h-4 w-4 mr-1" />
          Concluir
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onServicoConcluidoToggle(false)}
          className="flex items-center"
          disabled={!temPermissao}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reabrir
        </Button>
      )}
    </div>
  );
}
