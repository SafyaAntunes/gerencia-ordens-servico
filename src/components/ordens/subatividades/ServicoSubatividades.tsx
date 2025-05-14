
import { memo, useEffect, useRef } from "react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTrackingSubatividades } from "@/hooks/ordens/useTrackingSubatividades";

interface ServicoSubatividadesProps {
  tipoServico: TipoServico | string;
  subatividades: SubAtividade[];
  onChange: (subatividades: SubAtividade[]) => void;
}

// Usar memo para evitar re-renderizações desnecessárias
export const ServicoSubatividades = memo(({
  tipoServico,
  subatividades,
  onChange,
}: ServicoSubatividadesProps) => {
  const { logSubatividadesState } = useTrackingSubatividades();
  const prevSubatividadesRef = useRef<SubAtividade[]>([]);

  useEffect(() => {
    // Verificar se as subatividades realmente mudaram antes de processar
    if (JSON.stringify(prevSubatividadesRef.current) === JSON.stringify(subatividades)) {
      console.log(`[ServicoSubatividades] Ignorando atualização redundante para ${tipoServico}`);
      return;
    }

    // Atualizar a referência com os novos valores
    prevSubatividadesRef.current = subatividades;
    
    // Log das subatividades recebidas
    console.log(`[ServicoSubatividades] Recebido para ${tipoServico}:`, 
      subatividades.map(s => ({ id: s.id, nome: s.nome, selecionada: s.selecionada })));
    
    logSubatividadesState("ServicoSubatividades-recebidas", tipoServico.toString());
    
    // Corrigir qualquer inconsistência no estado 'selecionada'
    // CORREÇÃO: NÃO definir selecionada como true por padrão, preservar o estado existente
    const processedSubs = subatividades.map(sub => ({
      ...sub,
      selecionada: sub.selecionada !== undefined ? sub.selecionada : false // Definir false por padrão
    }));
    
    // Se houver diferenças, atualizar
    if (JSON.stringify(processedSubs) !== JSON.stringify(subatividades)) {
      console.log(`[ServicoSubatividades] Corrigindo subatividades para ${tipoServico}:`, 
        processedSubs.map(s => ({ id: s.id, nome: s.nome, selecionada: s.selecionada })));
      
      onChange(processedSubs);
    }
  }, [tipoServico, subatividades, onChange, logSubatividadesState]);
  
  const handleToggleSubatividade = (id: string, checked: boolean) => {
    console.log(`[ServicoSubatividades] Toggle ${id} para ${checked}`);
    
    const updatedSubatividades = subatividades.map(sub => {
      if (sub.id === id) {
        return { ...sub, selecionada: checked };
      }
      return sub;
    });
    
    logSubatividadesState("ServicoSubatividades-toggle", tipoServico.toString());
    onChange(updatedSubatividades);
  };
  
  const handleTempoEstimadoChange = (id: string, value: number) => {
    const updatedSubatividades = subatividades.map(sub => {
      if (sub.id === id) {
        return { ...sub, tempoEstimado: value };
      }
      return sub;
    });
    
    onChange(updatedSubatividades);
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Subatividades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {subatividades.map((sub) => (
            <div key={sub.id} className="flex flex-col">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`subatividade-${sub.id}`}
                  checked={sub.selecionada}
                  onCheckedChange={(checked) => 
                    handleToggleSubatividade(sub.id, checked === true)
                  }
                />
                <Label htmlFor={`subatividade-${sub.id}`} className="text-sm">
                  {sub.nome}
                </Label>
              </div>
              
              {sub.selecionada && (
                <div className="mt-2 ml-7">
                  <Label htmlFor={`tempo-${sub.id}`} className="text-xs">
                    Tempo estimado (horas)
                  </Label>
                  <Input
                    id={`tempo-${sub.id}`}
                    type="number"
                    min="0"
                    step="0.5"
                    value={sub.tempoEstimado || 0}
                    onChange={(e) => 
                      handleTempoEstimadoChange(sub.id, parseFloat(e.target.value) || 0)
                    }
                    className="h-8 text-sm w-24"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

ServicoSubatividades.displayName = "ServicoSubatividades";

// Re-exportar para compatibilidade com importações anteriores
export { ServicoSubatividades as ServicoSubatividadesComponent };
