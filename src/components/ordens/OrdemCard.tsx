
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OrdemServico } from "@/types/ordens";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

interface OrdemCardProps {
  ordem: OrdemServico;
  index?: number;
  onReorder?: (dragIndex: number, dropIndex: number) => void;
  onClick?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (isSelected: boolean) => void;
}

export default function OrdemCard({ 
  ordem, 
  index, 
  onReorder, 
  onClick,
  isSelectable = false,
  isSelected = false,
  onSelect
}: OrdemCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (index !== undefined && onReorder) {
      e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (index !== undefined && onReorder) {
      const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
      onReorder(dragIndex, index);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(!isSelected);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // Calculate progress percentage
  const progressPercentage = ordem.progressoEtapas !== undefined 
    ? Math.round(ordem.progressoEtapas * 100) 
    : 0;

  // Calculate time until deadline
  const timeUntilDeadline = ordem.dataPrevistaEntrega 
    ? formatDistance(
        new Date(ordem.dataPrevistaEntrega), 
        new Date(),
        { addSuffix: true, locale: ptBR }
      )
    : 'Data não definida';

  // Check if the order is overdue
  const isOverdue = ordem.dataPrevistaEntrega < new Date() && 
                    !['finalizado', 'entregue'].includes(ordem.status);

  // Get status badge styling
  const getStatusBadgeVariant = () => {
    switch (ordem.status) {
      case 'aguardando_aprovacao': return 'warning';
      case 'fabricacao': return 'default';
      case 'finalizado': return 'success';
      case 'entregue': return 'success';
      case 'aguardando_peca_cliente':
      case 'aguardando_peca_interno': return 'warning';
      default: return 'secondary';
    }
  };
  
  // Get status text
  const getStatusText = () => {
    switch (ordem.status) {
      case 'orcamento': return 'Orçamento';
      case 'aguardando_aprovacao': return 'Aguardando Aprovação';
      case 'fabricacao': return 'Em Fabricação';
      case 'aguardando_peca_cliente': return 'Aguardando Peça (Cliente)';
      case 'aguardando_peca_interno': return 'Aguardando Peça (Interno)';
      case 'finalizado': return 'Finalizado';
      case 'entregue': return 'Entregue';
      default: return ordem.status;
    }
  };
  
  // Get priority badge styling
  const getPrioridadeBadgeVariant = () => {
    switch (ordem.prioridade) {
      case 'baixa': return 'outline';
      case 'media': return 'secondary';
      case 'alta': return 'warning';
      case 'urgente': return 'destructive';
      default: return 'outline';
    }
  };
  
  // Get priority text
  const getPrioridadeText = () => {
    switch (ordem.prioridade) {
      case 'baixa': return 'Baixa';
      case 'media': return 'Média';
      case 'alta': return 'Alta';
      case 'urgente': return 'Urgente';
      default: return ordem.prioridade;
    }
  };

  return (
    <Card 
      draggable={onReorder !== undefined}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCardClick}
      className={`group hover:shadow-md transition-all duration-200 cursor-pointer ${
        isSelected ? 'ring-2 ring-primary' : ''} ${
        isOverdue ? 'bg-red-50 border-red-300 shadow-red-100' : ''
      }`}
    >
      <CardHeader className="pb-2 relative">
        {isSelectable && (
          <div 
            className="absolute left-2 top-2 z-10"
            onClick={handleCheckboxClick}
          >
            <Checkbox checked={isSelected} />
          </div>
        )}
        <div className="flex justify-between items-start">
          <div className={`font-semibold text-lg ${isSelectable ? 'ml-8' : ''}`}>
            {ordem.nome}
          </div>
          <Badge variant={getStatusBadgeVariant()}>{getStatusText()}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">{ordem.cliente?.nome}</div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className={`text-sm mb-2 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
          <span className="font-medium">Entrega:</span> {timeUntilDeadline}
        </div>

        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium">Progresso</span>
          <span className="text-xs">{progressPercentage}%</span>
        </div>
        
        <Progress value={progressPercentage} className={`h-2 ${isOverdue ? 'bg-red-200' : ''}`} />
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between">
        <Badge variant={getPrioridadeBadgeVariant()} className="capitalize">
          {getPrioridadeText()}
        </Badge>
        
        <div className="text-xs text-muted-foreground">
          ID: {ordem.id.substring(0, 8)}
        </div>
      </CardFooter>
    </Card>
  );
}
