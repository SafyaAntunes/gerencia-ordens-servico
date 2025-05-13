
import { useState, useEffect } from "react";
import { Servico, TipoServico, SubAtividade, EtapaOS, TipoAtividade } from "@/types/ordens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface EtapaTrackerInfoProps {
  etapa: TipoAtividade; // Usado para mostrar subatividades de um tipo específico (lavagem, inspeção, etc)
  servico: Servico; // O serviço atual (bloco, biela, etc)
  onSubatividadeToggle?: (subId: string, checked: boolean) => void;
}

export default function EtapaTrackerInfo({
  etapa,
  servico,
  onSubatividadeToggle
}: EtapaTrackerInfoProps) {
  const [subatividades, setSubatividades] = useState<SubAtividade[]>([]);
  const [localSubatividades, setLocalSubatividades] = useState<SubAtividade[]>([]);
  
  useEffect(() => {
    if (servico.atividadesRelacionadas?.[etapa]) {
      const subs = servico.atividadesRelacionadas[etapa] || [];
      setSubatividades(subs);
      setLocalSubatividades(subs);
    } else {
      setSubatividades([]);
      setLocalSubatividades([]);
    }
  }, [servico, etapa]);
  
  const handleToggle = (subId: string, checked: boolean) => {
    console.log("Toggle subatividade in EtapaTrackerInfo:", subId, checked);
    
    // Update local state first for immediate UI feedback
    setLocalSubatividades(prev => 
      prev.map(sub => 
        sub.id === subId ? { ...sub, concluida: checked } : sub
      )
    );
    
    // Then call the parent callback
    if (onSubatividadeToggle) {
      onSubatividadeToggle(subId, checked);
    }
  };
  
  const getEtapaNome = (etapa: TipoAtividade): string => {
    switch (etapa) {
      case 'lavagem': return 'Lavagem';
      case 'inspecao_inicial': return 'Inspeção Inicial';
      case 'inspecao_final': return 'Inspeção Final';
      default: return etapa;
    }
  };
  
  if (localSubatividades.length === 0) {
    return (
      <div className="p-4 border rounded-md mt-2 mb-4">
        <p className="text-sm text-muted-foreground text-center">
          Nenhuma atividade de {getEtapaNome(etapa).toLowerCase()} configurada para este serviço.
        </p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-md p-4 mt-2 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">{getEtapaNome(etapa)}</h4>
        <Badge variant="outline" className="text-xs">
          {localSubatividades.filter(s => s.concluida).length}/{localSubatividades.length}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {localSubatividades.map((sub) => (
          <div key={sub.id} className="flex items-center space-x-2">
            <Checkbox
              id={`check-etapa-${etapa}-${sub.id}`}
              checked={sub.concluida || false}
              onCheckedChange={(checked) => handleToggle(sub.id, checked === true)}
              disabled={servico.concluido}
              className="cursor-pointer"
            />
            <Label 
              htmlFor={`check-etapa-${etapa}-${sub.id}`} 
              className={`text-sm ${sub.concluida ? 'line-through text-muted-foreground' : ''} cursor-pointer`}
            >
              {sub.nome}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
