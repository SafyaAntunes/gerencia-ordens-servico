
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { SubAtividade } from "@/types/ordens";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Clock, Plus } from "lucide-react";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { Skeleton } from "../ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface ServicoSubatividadesProps {
  tipoServico: string;
  subatividades: SubAtividade[];
  onChange: (subatividades: SubAtividade[]) => void;
  editable?: boolean;
}

export function ServicoSubatividades({
  tipoServico,
  subatividades = [],
  onChange,
  editable = true,
}: ServicoSubatividadesProps) {
  const [customSubatividade, setCustomSubatividade] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [presetSubatividades, setPresetSubatividades] = useState<SubAtividade[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (tipoServico) {
      carregarSubatividades();
    }
  }, [tipoServico]);

  const carregarSubatividades = async () => {
    try {
      setIsLoading(true);
      const tipoServicoFormatado = tipoServico.toLowerCase().replace(/\s+/g, '_');
      const resultado = await getSubatividadesByTipo(tipoServicoFormatado as any);
      
      // Combina subatividades já selecionadas com as pré-cadastradas
      const subsSelecionadas = new Set(subatividades.map(s => s.id));
      
      const combinadas = resultado.map(sub => {
        const existente = subatividades.find(s => s.id === sub.id);
        if (existente) {
          return {
            ...sub,
            selecionada: true,
            tempoEstimado: existente.tempoEstimado || 0
          };
        }
        return sub;
      });
      
      setPresetSubatividades(combinadas);
    } catch (error) {
      console.error("Erro ao carregar subatividades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as subatividades.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSubatividade = (id: string, checked: boolean) => {
    if (!editable) return;
    
    const updatedSubs = subatividades.map((sub) => {
      if (sub.id === id) {
        return { ...sub, selecionada: checked };
      }
      return sub;
    });

    // Se não existe na lista de subatividades, adiciona
    if (!updatedSubs.some((sub) => sub.id === id)) {
      const subToAdd = presetSubatividades.find((sub) => sub.id === id);
      if (subToAdd) {
        updatedSubs.push({
          ...subToAdd,
          selecionada: checked,
          tempoEstimado: 0
        });
      }
    }

    onChange(updatedSubs.filter((sub) => sub.selecionada));
  };

  const handleAddCustom = () => {
    if (!customSubatividade.trim() || !editable) return;

    const newSub: SubAtividade = {
      id: `custom-${Date.now()}`,
      nome: customSubatividade.trim(),
      selecionada: true,
      tempoEstimado: 0,
    };

    onChange([...subatividades, newSub]);
    setCustomSubatividade("");
    setIsAddingCustom(false);
  };

  const handleTempoEstimadoChange = (id: string, horas: number) => {
    if (!editable) return;
    
    const updatedSubs = subatividades.map((sub) => {
      if (sub.id === id) {
        return { ...sub, tempoEstimado: horas };
      }
      return sub;
    });
    
    onChange(updatedSubs);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                      handleToggleSubatividade(sub.id, checked === true)
                    }
                    disabled={!editable}
                  />
                  <div>
                    <Label
                      htmlFor={`sub-${sub.id}`}
                      className={`font-medium ${!selecionada && "text-muted-foreground"}`}
                    >
                      {sub.nome}
                    </Label>
                    {sub.precoHora > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(sub.precoHora)}/hora
                      </p>
                    )}
                  </div>
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
                      onChange={(e) => handleTempoEstimadoChange(sub.id, parseFloat(e.target.value) || 0)}
                      disabled={!editable}
                      placeholder="0h"
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                  </div>
                )}
              </div>
              
              {selecionada && sub.precoHora > 0 && subAtual.tempoEstimado > 0 && (
                <div className="text-right text-xs">
                  Valor estimado: <span className="font-medium">{formatCurrency(sub.precoHora * (subAtual.tempoEstimado || 0))}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editable && (
        <div>
          {isAddingCustom ? (
            <div className="flex items-center gap-2">
              <Input
                value={customSubatividade}
                onChange={(e) => setCustomSubatividade(e.target.value)}
                placeholder="Nome da subatividade"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCustom}
                disabled={!customSubatividade.trim()}
              >
                Adicionar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomSubatividade("");
                  setIsAddingCustom(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsAddingCustom(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Subatividade Personalizada
            </Button>
          )}
        </div>
      )}

      {/* Lista de subatividades personalizadas selecionadas */}
      {subatividades.filter(sub => !presetSubatividades.some(p => p.id === sub.id) && sub.selecionada).length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Subatividades Personalizadas</h4>
          {subatividades
            .filter(
              (sub) => !presetSubatividades.some((p) => p.id === sub.id) && sub.selecionada
            )
            .map((sub) => (
              <div key={sub.id} className="flex items-center justify-between border p-2 rounded-md">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`sub-${sub.id}`}
                    checked={sub.selecionada}
                    onCheckedChange={(checked) =>
                      handleToggleSubatividade(sub.id, checked === true)
                    }
                    disabled={!editable}
                  />
                  <Label
                    htmlFor={`sub-${sub.id}`}
                    className="font-medium"
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
                    onChange={(e) => handleTempoEstimadoChange(sub.id, parseFloat(e.target.value) || 0)}
                    disabled={!editable}
                    placeholder="0h"
                  />
                  <span className="text-xs text-muted-foreground">h</span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
