
// Este arquivo é somente leitura, então precisamos criar uma versão personalizada

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OrdemActionButtons from './OrdemActionButtons';
import { OrdemServico } from '@/types/ordens';

interface OrdemHeaderProps {
  id: string;
  nome: string;
  canEdit: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  ordem?: OrdemServico;
}

export const OrdemHeaderCustom = ({ 
  id, 
  nome, 
  canEdit, 
  onEditClick, 
  onDeleteClick,
  ordem
}: OrdemHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{nome || 'Ordem sem título'}</h1>
          <div className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-600">
            #{id.slice(0, 6)}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Detalhes da ordem de serviço e status de progresso
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ordem && <OrdemActionButtons ordem={ordem} />}
        
        <div className="flex gap-2">
          {canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={onEditClick}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={onDeleteClick}
              >
                <Trash className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/ordens')}>
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};
