import React from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/ui/sortable-item";
import OrdemCardApresentacao from "./OrdemCardApresentacao";
import { OrdemServico } from "@/types/ordens";

interface ColunaPresentacaoProps {
  title: string;
  column: "left" | "right";
  ordens: OrdemServico[];
  onReorder: (column: "left" | "right", activeId: string, overId: string) => void;
  onVerOrdem: (id: string) => void;
}

export default function ColunaPresentacao({ title, column, ordens, onReorder, onVerOrdem }: ColunaPresentacaoProps) {
  const ids = ordens.map((o) => o.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(column, String(active.id), String(over.id));
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>
      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 h-full overflow-y-auto">
              {ordens.map((ordem, index) => (
                <SortableItem key={ordem.id} id={ordem.id}>
                  <OrdemCardApresentacao
                    ordem={ordem}
                    prioridadeNumero={index + 1}
                    onClick={() => onVerOrdem(ordem.id)}
                  />
                </SortableItem>
              ))}
            </div>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
