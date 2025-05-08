
import { useState, useEffect } from "react";
import { TipoServico, SubAtividade, TipoAtividade } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";

interface ServicoAtividadesConfigProps {
  servicoTipo: TipoServico;
  atividadeTipo: TipoAtividade;
  subatividades: SubAtividade[];
  onChange: (subatividades: SubAtividade[]) => void;
}

export default function ServicoAtividadesConfig({
  servicoTipo,
  atividadeTipo,
  subatividades,
  onChange
}: ServicoAtividadesConfigProps) {
  const [localSubatividades, setLocalSubatividades] = useState<SubAtividade[]>(subatividades || []);
  const [tempoEstimado, setTempoEstimado] = useState<Record<string, number>>({});
  const { defaultAtividadesEspecificas } = useServicoSubatividades();
  
  useEffect(() => {
    setLocalSubatividades(subatividades || []);
    
    // Inicializar tempos estimados
    const tempos: Record<string, number> = {};
    subatividades?.forEach(sub => {
      if (sub.tempoEstimado) {
        tempos[sub.id] = sub.tempoEstimado;
      }
    });
    setTempoEstimado(tempos);
  }, [subatividades]);
  
  const handleToggleSubatividade = (id: string, checked: boolean) => {
    const atualizarSubatividades = (subs: SubAtividade[]) => 
      subs.map(sub => {
        if (sub.id === id) {
          return { ...sub, selecionada: checked };
        }
        return sub;
      });
    
    const novasSubatividades = atualizarSubatividades(localSubatividades);
    setLocalSubatividades(novasSubatividades);
    onChange(novasSubatividades);
  };
  
  const handleTempoEstimadoChange = (id: string, value: number) => {
    // Atualizar o estado local de tempos estimados
    setTempoEstimado(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Atualizar as subatividades com o novo tempo estimado
    const atualizarSubatividades = (subs: SubAtividade[]) =>
      subs.map(sub => {
        if (sub.id === id) {
          return { ...sub, tempoEstimado: value };
        }
        return sub;
      });
    
    const novasSubatividades = atualizarSubatividades(localSubatividades);
    setLocalSubatividades(novasSubatividades);
    onChange(novasSubatividades);
  };
  
  const formatActivityType = (tipo: TipoAtividade): string => {
    switch(tipo) {
      case 'lavagem': return 'Lavagem';
      case 'inspecao_inicial': return 'Inspeção Inicial';
      case 'inspecao_final': return 'Inspeção Final';
      default: return tipo;
    }
  };
  
  const formatServiceType = (tipo: TipoServico): string => {
    switch(tipo) {
      case 'bloco': return 'Bloco';
      case 'biela': return 'Biela';
      case 'cabecote': return 'Cabeçote';
      case 'virabrequim': return 'Virabrequim';
      case 'eixo_comando': return 'Eixo de Comando';
      case 'montagem': return 'Montagem';
      case 'dinamometro': return 'Dinamômetro';
      default: return tipo;
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">
          {formatActivityType(atividadeTipo)} - {formatServiceType(servicoTipo)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {localSubatividades.map((sub) => (
            <div key={sub.id} className="flex flex-col">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`check-${sub.id}`}
                  checked={sub.selecionada}
                  onCheckedChange={(checked) => 
                    handleToggleSubatividade(sub.id, checked === true)
                  }
                />
                <Label htmlFor={`check-${sub.id}`} className="text-sm">
                  {sub.nome}
                </Label>
              </div>
              
              {sub.selecionada && (
                <div className="mt-2 ml-7">
                  <div>
                    <Label htmlFor={`tempo-${sub.id}`} className="text-xs">
                      Tempo estimado (horas)
                    </Label>
                    <Input
                      id={`tempo-${sub.id}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={tempoEstimado[sub.id] || 0}
                      onChange={(e) => 
                        handleTempoEstimadoChange(sub.id, parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-sm w-24"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
