
import React from "react";
import { OrdemServico } from "@/types/ordens";
import OrdemListRowHeader from "./OrdemListRowHeader";
import OrdemListRowDetails from "./OrdemListRowDetails";
import OrdemListRowProgress from "./OrdemListRowProgress";
import { Checkbox } from "@/components/ui/checkbox";
import { isValid } from "date-fns";

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

  // Verificar se a ordem está atrasada - com validação de datas
  const hoje = new Date();
  let isAtrasada = false;
  
  try {
    let dataPrevista = ordem.dataPrevistaEntrega;
    
    // Ensure dataPrevistaEntrega is a valid Date object
    if (dataPrevista) {
      // Convert string to Date if needed
      if (typeof dataPrevista === 'string') {
        dataPrevista = new Date(dataPrevista);
      }
      
      // Only check if it's atrasada if the date is valid
      if (isValid(dataPrevista)) {
        isAtrasada = dataPrevista < hoje && !['finalizado', 'entregue'].includes(ordem.status);
      }
    }
  } catch (error) {
    console.error("Error checking if ordem is atrasada:", error);
    isAtrasada = false;
  }

  // Calculate progress with validation
  let progresso = 0;
  if (typeof ordem.progressoEtapas === 'number') {
    progresso = Math.round(ordem.progressoEtapas * 100);
  } else if (ordem.progressoEtapas !== undefined) {
    try {
      progresso = Math.round(Number(ordem.progressoEtapas) * 100);
    } catch (err) {
      console.error("Invalid progress:", ordem.progressoEtapas);
    }
  }

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
          progresso={progresso}
          isAtrasada={isAtrasada}
        />
      </div>
    </div>
  );
}
