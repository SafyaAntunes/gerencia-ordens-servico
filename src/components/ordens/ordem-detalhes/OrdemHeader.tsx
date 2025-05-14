
import React from 'react';
import { OrdemServico } from '@/types/ordens';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface OrdemHeaderProps {
  ordem: OrdemServico;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}

export function OrdemHeader({ ordem, onEdit, onDelete, canEdit }: OrdemHeaderProps) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight">{ordem.nome || `Ordem #${ordem.id.slice(-5)}`}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Criada em {format(new Date(ordem.dataAbertura), 'dd/MM/yyyy', { locale: ptBR })}
            {ordem.dataPrevistaEntrega && 
              ` • Previsão de entrega: ${format(new Date(ordem.dataPrevistaEntrega), 'dd/MM/yyyy', { locale: ptBR })}`}
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={onEdit}
              size="sm"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              onClick={onDelete}
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        )}
      </div>
      <Separator className="my-4" />
    </div>
  );
}
