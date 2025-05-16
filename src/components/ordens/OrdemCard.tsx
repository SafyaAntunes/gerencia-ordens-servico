import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Calendar, Clock, User } from 'lucide-react';
import { OrdemServico, StatusOS } from '@/types/ordens';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OrderProgress from './OrderProgress';
import { getStatusLabel } from '@/components/ordens/etapas-tracker/EtapasTracker';
import { getStatusPercent } from '@/components/ordens/etapas-tracker/useEtapasProgress';

interface OrdemCardProps {
  ordem: OrdemServico;
  onViewClick: (id: string) => void;
}

export const OrdemCard = ({ ordem, onViewClick }: OrdemCardProps) => {
  const statusColorMap: Record<StatusOS, string> = {
    orcamento: 'text-gray-500',
    aguardando_aprovacao: 'text-blue-500',
    autorizado: 'text-purple-500',
    executando_servico: 'text-yellow-500',
    aguardando_peca_cliente: 'text-orange-500',
    aguardando_peca_interno: 'text-orange-500',
    finalizado: 'text-green-500',
    entregue: 'text-green-600',
  };

  const statusColor = statusColorMap[ordem.status] || 'text-gray-500';
  const percentComplete = getStatusPercent(ordem.status);

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold line-clamp-1">{ordem.nome}</h4>
          <p className="text-xs text-muted-foreground">
            Cliente: {ordem.cliente?.nome || 'Não especificado'}
          </p>
        </div>
        <Badge variant="secondary">{getStatusLabel(ordem.status)}</Badge>
      </CardHeader>
      
      <CardContent className="grid gap-4 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 opacity-70" />
          Aberto há {formatDistanceToNow(new Date(ordem.dataAbertura), { addSuffix: true, locale: ptBR })}
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 opacity-70" />
          Entrega prevista para {formatDistanceToNow(new Date(ordem.dataPrevistaEntrega), { addSuffix: true, locale: ptBR })}
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 opacity-70" />
          Responsável: <span className="font-medium line-clamp-1">{ordem.etapasAndamento?.retifica?.funcionarioNome || 'Não atribuído'}</span>
        </div>

        <OrderProgress percentComplete={percentComplete} />
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <span className={`flex items-center gap-2 text-xs ${statusColor}`}>
          <AlertCircle className="h-4 w-4" />
          {getStatusLabel(ordem.status)}
        </span>
        <Button size="sm" onClick={() => onViewClick(ordem.id)}>
          Visualizar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// Add default export to fix the import issue
export default OrdemCard;
