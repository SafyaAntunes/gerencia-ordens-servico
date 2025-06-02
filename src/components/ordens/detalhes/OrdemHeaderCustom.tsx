
import React from 'react';
import { OrdemServico } from '@/types/ordens';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import OrdemActionButtons from './OrdemActionButtons';
import { formatDateSafely } from '@/utils/dateUtils';

interface OrdemHeaderCustomProps {
  id: string;
  nome: string;
  canEdit: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  ordem: OrdemServico;
}

export const OrdemHeaderCustom: React.FC<OrdemHeaderCustomProps> = ({ 
  id, 
  nome, 
  canEdit, 
  onEditClick, 
  onDeleteClick,
  ordem
}) => {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight">OS-{id.slice(-11)}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Criada em {formatDateSafely(ordem.dataAbertura)}
            {ordem.dataPrevistaEntrega && 
              ` • Previsão de entrega: ${formatDateSafely(ordem.dataPrevistaEntrega)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={onEditClick}
                size="sm"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="destructive"
                className="flex items-center gap-2"
                onClick={onDeleteClick}
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </>
          )}
          <div className="ml-2">
            <OrdemActionButtons ordem={ordem} />
          </div>
        </div>
      </div>
      <Separator className="my-4" />
    </div>
  );
};
