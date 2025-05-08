
import { useState, useEffect } from "react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { v4 as uuidv4 } from "uuid";

interface ServicoSubatividadesProps {
  tipoServico: string | TipoServico;
  subatividades: SubAtividade[];
  onChange: (subatividades: SubAtividade[]) => void;
  isEditable?: boolean;
  onSubatividadeToggle?: (tipoServico: string, subatividadeId: string, checked: boolean) => void;
  isSubatividadeEditingEnabled?: boolean;
}

export function ServicoSubatividades({ 
  tipoServico,
  subatividades, 
  onChange,
  isEditable = true,
  onSubatividadeToggle,
  isSubatividadeEditingEnabled = false
}: ServicoSubatividadesProps) {
  const [novaSubatividade, setNovaSubatividade] = useState("");
  const [novaSubatividadeTempo, setNovaSubatividadeTempo] = useState(1);
  const [customSubatividades, setCustomSubatividades] = useState<SubAtividade[]>([]);
  
  useEffect(() => {
    // Filtrar apenas subatividades customizadas (que não estão na lista padrão)
    const customOnly = subatividades.filter(sub => sub.custom);
    setCustomSubatividades(customOnly);
  }, [subatividades]);
  
  const handleNovaSubatividade = () => {
    if (!novaSubatividade.trim()) return;
    
    const novaLista = [
      ...subatividades,
      {
        id: uuidv4(),
        nome: novaSubatividade,
        selecionada: true,
        tempoEstimado: novaSubatividadeTempo,
        custom: true,
        servicoTipo: tipoServico as TipoServico,
      }
    ];
    
    onChange(novaLista);
    setNovaSubatividade("");
    setNovaSubatividadeTempo(1);
  };
  
  const handleRemoveCustom = (id: string) => {
    const novaLista = subatividades.filter(sub => sub.id !== id);
    onChange(novaLista);
  };
  
  const handleSelectSubatividadeToggle = (id: string, isChecked: boolean) => {
    const novaLista = subatividades.map(sub => {
      if (sub.id === id) {
        return { ...sub, selecionada: isChecked };
      }
      return sub;
    });
    
    onChange(novaLista);
  };
  
  const handleSubatividadeConclusionToggle = (id: string, isChecked: boolean) => {
    // Esta função lida com o toggle de conclusão de subatividade durante a edição
    if (isSubatividadeEditingEnabled && onSubatividadeToggle) {
      onSubatividadeToggle(tipoServico, id, isChecked);
    }
  };
  
  // Agora separamos as subatividades em duas listas: padrão e customizadas
  const subatividadesPadrao = subatividades.filter(sub => !sub.custom);
  
  return (
    <div className="space-y-4">
      <div className="border rounded-md p-4 space-y-3">
        <h4 className="text-sm font-medium mb-3">Selecione as subatividades padrão:</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {subatividadesPadrao.map((subatividade) => (
            <div key={subatividade.id} className="flex items-center space-x-3 p-2 border border-gray-100 rounded-md hover:bg-gray-50">
              <Checkbox 
                id={`subatividade-${subatividade.id}`}
                checked={subatividade.selecionada}
                onCheckedChange={(checked) => handleSelectSubatividadeToggle(subatividade.id, Boolean(checked))}
                disabled={!isEditable}
              />
              <div className="grid gap-1.5 leading-none w-full">
                <div className="flex items-center justify-between w-full">
                  <Label 
                    htmlFor={`subatividade-${subatividade.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {subatividade.nome}
                  </Label>
                  
                  {subatividade.tempoEstimado && (
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {subatividade.tempoEstimado}h
                    </span>
                  )}
                </div>
              </div>
              
              {/* Aqui adicionamos o checkbox de conclusão que só aparece no modo de edição */}
              {isSubatividadeEditingEnabled && subatividade.selecionada && (
                <div className="ml-auto flex items-center">
                  <Checkbox 
                    id={`subatividade-concluida-${subatividade.id}`}
                    checked={subatividade.concluida || false}
                    onCheckedChange={(checked) => handleSubatividadeConclusionToggle(subatividade.id, Boolean(checked))}
                    className="border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
                  />
                  <Label 
                    htmlFor={`subatividade-concluida-${subatividade.id}`}
                    className="ml-1 text-xs text-muted-foreground"
                  >
                    Concluída
                  </Label>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Seção de subatividades customizadas */}
      {isEditable && (
        <div className="border rounded-md p-4">
          <h4 className="text-sm font-medium mb-3">Subatividades personalizadas:</h4>
          
          <div className="space-y-3">
            {customSubatividades.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {customSubatividades.map((subatividade) => (
                  <div key={subatividade.id} className="flex items-center space-x-3 p-2 border border-gray-100 rounded-md hover:bg-gray-50">
                    <Checkbox 
                      id={`custom-sub-${subatividade.id}`}
                      checked={subatividade.selecionada}
                      onCheckedChange={(checked) => handleSelectSubatividadeToggle(subatividade.id, Boolean(checked))}
                    />
                    <div className="grid gap-1.5 leading-none w-full">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Label 
                            htmlFor={`custom-sub-${subatividade.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {subatividade.nome}
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            Personalizada
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {subatividade.tempoEstimado && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {subatividade.tempoEstimado}h
                            </span>
                          )}
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveCustom(subatividade.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Aqui também adicionamos o checkbox de conclusão para subatividades customizadas */}
                    {isSubatividadeEditingEnabled && subatividade.selecionada && (
                      <div className="ml-auto flex items-center">
                        <Checkbox 
                          id={`subatividade-concluida-${subatividade.id}`}
                          checked={subatividade.concluida || false}
                          onCheckedChange={(checked) => handleSubatividadeConclusionToggle(subatividade.id, Boolean(checked))}
                          className="border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
                        />
                        <Label 
                          htmlFor={`subatividade-concluida-${subatividade.id}`}
                          className="ml-1 text-xs text-muted-foreground"
                        >
                          Concluída
                        </Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhuma subatividade personalizada adicionada.
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <div className="flex-1">
                <Input 
                  placeholder="Adicionar nova subatividade..."
                  value={novaSubatividade}
                  onChange={(e) => setNovaSubatividade(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-20">
                <Input 
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Horas"
                  value={novaSubatividadeTempo}
                  onChange={(e) => setNovaSubatividadeTempo(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <Button 
                type="button"
                onClick={handleNovaSubatividade}
                size="sm"
                disabled={!novaSubatividade.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
