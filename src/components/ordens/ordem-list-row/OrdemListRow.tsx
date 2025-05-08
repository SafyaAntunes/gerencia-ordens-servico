
import React from "react";
import { OrdemServico } from "@/types/ordens";
import OrdemListRowHeader from "./OrdemListRowHeader";
import OrdemListRowDetails from "./OrdemListRowDetails";
import OrdemListRowProgress from "./OrdemListRowProgress";
import { Checkbox } from "@/components/ui/checkbox";

interface OrdemListRowProps {
  ordem: OrdemServico;
  index: number;
  onReorder: (dragIndex: number, dropIndex: number) => void;
  onClick: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (isSelected: boolean) => void;
}

export default function OrdemListRow({ 
  ordem, 
  index, 
  onReorder, 
  onClick,
  isSelectable = false,
  isSelected = false,
  onSelect
}: OrdemListRowProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    onReorder(dragIndex, index);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(!isSelected);
    }
  };

  // Verificar se a ordem está atrasada
  const hoje = new Date();
  const isAtrasada = ordem.dataPrevistaEntrega < hoje && !['finalizado', 'entregue'].includes(ordem.status);

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onClick}
      className={`group hover:shadow-md border rounded-lg mb-3 shadow-sm transition-all duration-200 cursor-pointer overflow-hidden bg-white relative ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${
        isAtrasada ? 'bg-red-50 border-red-300' : ''
      }`}
    >
      {isSelectable && (
        <div 
          className="absolute left-2 top-2 z-10"
          onClick={handleCheckboxClick}
        >
          <Checkbox checked={isSelected} />
        </div>
      )}
      
      <div className={isSelectable ? 'pl-8' : ''}>
        <OrdemListRowHeader 
          ordem={ordem} 
          index={index} 
          isAtrasada={isAtrasada}
        />
        
        <OrdemListRowDetails 
          ordem={ordem} 
          isAtrasada={isAtrasada}
        />
        
        <OrdemListRowProgress 
          progresso={ordem.progressoEtapas !== undefined ? Math.round(ordem.progressoEtapas * 100) : 0}
          isAtrasada={isAtrasada}
        />
      </div>
    </div>
  );
}
