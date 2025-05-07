
import React from 'react';
import { OrdemServico } from '@/types/ordens';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import OrdemActionButtons from '@/components/ordens/detalhes/OrdemActionButtons';
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
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight">{nome || `Ordem #${id.slice(-5)}`}</h2>
            {canEdit && (
              <div className="ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEditClick}
                  title="Editar ordem"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDeleteClick}
                  title="Excluir ordem"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Criada em {format(new Date(ordem.dataAbertura), 'dd/MM/yyyy', { locale: ptBR })}
            {ordem.dataPrevistaEntrega && 
              ` • Previsão de entrega: ${format(new Date(ordem.dataPrevistaEntrega), 'dd/MM/yyyy', { locale: ptBR })}`}
          </p>
        </div>

        <div>
          <OrdemActionButtons ordem={ordem} />
        </div>
      </div>
      <Separator className="my-4" />
    </div>
  );
};
