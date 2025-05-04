
import React from "react";
import { OrdemServico } from "@/types/ordens";
import OrdemListRowHeader from "./OrdemListRowHeader";
import OrdemListRowDetails from "./OrdemListRowDetails";
import OrdemListRowProgress from "./OrdemListRowProgress";

interface OrdemListRowProps {
  ordem: OrdemServico;
  index: number;
  onReorder: (dragIndex: number, dropIndex: number) => void;
  onClick: () => void;
}

export default function OrdemListRow({ 
  ordem, 
  index, 
  onReorder, 
  onClick 
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

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onClick}
      className="group hover:shadow-md border rounded-lg mb-3 shadow-sm transition-all duration-200 cursor-pointer overflow-hidden bg-white"
    >
      <OrdemListRowHeader 
        ordem={ordem} 
        index={index} 
      />
      
      <OrdemListRowDetails 
        ordem={ordem} 
      />
      
      <OrdemListRowProgress 
        progresso={ordem.progressoEtapas !== undefined ? Math.round(ordem.progressoEtapas * 100) : 0}
      />
    </div>
  );
}
