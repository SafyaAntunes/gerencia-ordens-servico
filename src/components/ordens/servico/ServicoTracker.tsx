
import { useEffect } from 'react';
import { Servico } from '@/types/ordens';
import { useServicoTracker } from './hooks/useServicoTracker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, RotateCcw, User } from 'lucide-react';

interface ServicoTrackerProps {
  servico: Servico;
  onServicoUpdate?: (servico: Servico) => void;
}

export function ServicoTracker({ servico, onServicoUpdate }: ServicoTrackerProps) {
  const { status, responsavel, handleAtribuir, handleConcluir, handleReabrir } = useServicoTracker(servico);

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in-progress': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in-progress': return 'Em progresso';
      default: return 'Pendente';
    }
  };

  const handleServicoUpdate = (updatedServico: Servico) => {
    if (onServicoUpdate) {
      onServicoUpdate(updatedServico);
    }
  };

  const onConcluir = () => {
    const updated = handleConcluir();
    if (updated) handleServicoUpdate(updated);
  };

  const onReabrir = () => {
    const updated = handleReabrir();
    if (updated) handleServicoUpdate(updated);
  };

  // This would typically be connected to a dialog for selecting employees
  const onAtribuir = (funcionarioId: string, funcionarioNome: string) => {
    const updated = handleAtribuir(funcionarioId, funcionarioNome);
    if (updated) handleServicoUpdate(updated);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{servico.tipo}</CardTitle>
          <Badge className={`${getStatusColor()} text-white`}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Descrição</h3>
            <p className="text-sm text-gray-600">{servico.descricao || "Nenhuma descrição disponível."}</p>
          </div>
          
          {responsavel && (
            <div>
              <h3 className="text-sm font-medium mb-1">Responsável</h3>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <p className="text-sm">{responsavel}</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-2">
            {status === 'completed' ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReabrir}
                className="flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reabrir
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onConcluir}
                className="flex items-center"
              >
                <Check className="h-4 w-4 mr-1" />
                Concluir
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
