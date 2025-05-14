
import React from 'react';
import { OrdemServico } from '@/types/ordens';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import OrdemActionButtons from './OrdemActionButtons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  // Add console log to debug when edit button is clicked
  const handleEditClick = () => {
    console.log("Edit button clicked");
    onEditClick();
  };
  
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight">{nome || `Ordem #${id.slice(-5)}`}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Criada em {format(new Date(ordem.dataAbertura), 'dd/MM/yyyy', { locale: ptBR })}
            {ordem.dataPrevistaEntrega && 
              ` • Previsão de entrega: ${format(new Date(ordem.dataPrevistaEntrega), 'dd/MM/yyyy', { locale: ptBR })}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleEditClick}
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
