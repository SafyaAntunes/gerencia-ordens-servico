
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Servico, TipoServico } from "@/types/ordens";
import OrdemCronometro from "./OrdemCronometro";

// Mapear nomes de serviços para exibição
const SERVICO_NOMES: Record<TipoServico, string> = {
  bloco: "Bloco",
  biela: "Biela",
  cabecote: "Cabeçote",
  virabrequim: "Virabrequim",
  eixo_comando: "Eixo de Comando",
  montagem: "Montagem"
};

interface ServicoProgressoProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  servico: Servico;
  onSubatividadeChange: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (servicoTipo: TipoServico, concluido: boolean) => void;
}

export default function ServicoProgresso({
  ordemId,
  funcionarioId,
  funcionarioNome,
  servico,
  onSubatividadeChange,
  onServicoStatusChange
}: ServicoProgressoProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Calcular o progresso baseado nas subatividades
  const totalSubatividades = servico.subatividades?.length || 0;
  const concluidasCount = servico.subatividades?.filter(sub => sub.selecionada).length || 0;
  const progressoPercentual = totalSubatividades > 0 
    ? Math.round((concluidasCount / totalSubatividades) * 100)
    : 0;
    
  // Verificar se está 100% completo
  const isCompleted = totalSubatividades > 0 && concluidasCount === totalSubatividades;
  
  const handleSubatividadeChange = (subatividadeId: string, checked: boolean) => {
    onSubatividadeChange(servico.tipo, subatividadeId, checked);
    
    // Verificar se todas as subatividades estão concluídas após a mudança
    const novoTotal = servico.subatividades?.length || 0;
    const novoConcluidas = servico.subatividades?.filter(sub => {
      if (sub.id === subatividadeId) {
        return checked;
      }
      return sub.selecionada;
    }).length || 0;
    
    if (novoConcluidas === novoTotal && novoTotal > 0) {
      onServicoStatusChange(servico.tipo, true);
    } else if (servico.concluido) {
      onServicoStatusChange(servico.tipo, false);
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{SERVICO_NOMES[servico.tipo]}</CardTitle>
            <Badge variant={servico.concluido ? "success" : "outline"}>
              {servico.concluido ? "Concluído" : "Em andamento"}
            </Badge>
          </div>
          <Badge variant="outline" className="text-sm">
            {progressoPercentual}% completo
          </Badge>
        </div>
        {servico.descricao && (
          <p className="text-sm text-muted-foreground mt-1">{servico.descricao}</p>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Cronômetro do serviço */}
        <div className="mb-4">
          <OrdemCronometro
            ordemId={ordemId}
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome}
            etapa="retifica"
            tipoServico={servico.tipo}
            isEtapaConcluida={servico.concluido}
            onStart={() => setIsTimerRunning(true)}
            onFinish={() => {
              setIsTimerRunning(false);
              if (isCompleted) {
                onServicoStatusChange(servico.tipo, true);
              }
            }}
          />
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-3">Atividades a realizar:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {servico.subatividades?.map((subatividade) => (
              <div key={subatividade.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`subatividade-${subatividade.id}`}
                  checked={subatividade.selecionada}
                  disabled={isTimerRunning && !subatividade.selecionada}
                  onCheckedChange={(checked) => 
                    handleSubatividadeChange(subatividade.id, checked === true)
                  }
                />
                <FormLabel 
                  htmlFor={`subatividade-${subatividade.id}`}
                  className={`text-sm font-normal cursor-pointer ${subatividade.selecionada ? 'line-through text-muted-foreground' : ''}`}
                >
                  {subatividade.nome}
                </FormLabel>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
