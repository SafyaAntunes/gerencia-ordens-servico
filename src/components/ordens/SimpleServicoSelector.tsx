
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TipoServico } from '@/types/ordens';

interface SimpleServicoSelectorProps {
  tipo: string;
  isSelected: boolean;
  descricao: string;
  onToggle: (tipo: string, checked: boolean) => void;
  onDescricaoChange: (tipo: string, descricao: string) => void;
}

const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function SimpleServicoSelector({
  tipo,
  isSelected,
  descricao,
  onToggle,
  onDescricaoChange
}: SimpleServicoSelectorProps) {
  return (
    <Card className={`transition-all ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Checkbox
            id={`servico-${tipo}`}
            checked={isSelected}
            onCheckedChange={(checked) => onToggle(tipo, !!checked)}
          />
          <CardTitle className="text-base">
            {toTitleCase(tipo.replace('_', ' '))}
          </CardTitle>
        </div>
      </CardHeader>
      
      {isSelected && (
        <CardContent className="pt-0">
          <div>
            <Label htmlFor={`${tipo}-descricao`} className="text-sm">
              Descrição (opcional)
            </Label>
            <Textarea
              id={`${tipo}-descricao`}
              placeholder="Detalhes específicos sobre este serviço..."
              value={descricao}
              onChange={(e) => onDescricaoChange(tipo, e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
