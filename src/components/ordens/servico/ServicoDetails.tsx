
import { SubAtividade } from "@/types/ordens";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  onSubatividadeToggle,
}: ServicoDetailsProps) {
  // Verificação de segurança para garantir que subatividades é um array
  const subatividadesSeguras = Array.isArray(subatividades) ? subatividades : [];
  
  // Função para manipular o clique de forma segura
  const handleSubatividadeClick = (subatividade: SubAtividade) => {
    // Verificação apenas se tem permissão
    if (!temPermissao || !subatividade || !onSubatividadeToggle) return;
    
    // Verificar se o objeto é válido antes de chamar a função
    try {
      if (subatividade.id) {
        // Chamamos a função com ID e o estado inverso do atual
        onSubatividadeToggle(subatividade.id, !subatividade.concluida);
        console.log("Subatividade clicada:", subatividade.id, "novo estado:", !subatividade.concluida);
      } else {
        console.error("Subatividade inválida (sem ID):", subatividade);
      }
    } catch (error) {
      console.error("Erro ao alternar subatividade:", error, subatividade);
    }
  };

  return (
    <>
      {descricao && (
        <div className="pt-0 pb-3">
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
      )}
      
      {subatividadesSeguras.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-3">
            {subatividadesSeguras.map((subatividade) => {
              // Verificar se a subatividade é válida antes de renderizar
              if (!subatividade || !subatividade.id) {
                console.warn("Subatividade inválida detectada:", subatividade);
                return null;
              }
              
              return (
                <div 
                  key={subatividade.id}
                  className={cn(
                    "flex items-center justify-between",
                    temPermissao ? "cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors" : ""
                  )}
                  onClick={() => temPermissao && handleSubatividadeClick(subatividade)}
                  tabIndex={temPermissao ? 0 : undefined}
                  role={temPermissao ? "button" : undefined}
                  aria-pressed={subatividade.concluida}
                  onKeyDown={(e) => {
                    if (temPermissao && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleSubatividadeClick(subatividade);
                    }
                  }}
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
                      className={cn(
                        subatividade.concluida ? "text-green-600 border-green-600" : "text-muted-foreground",
                        "select-none" // Evita seleção de texto ao clicar
                      )}
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
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
