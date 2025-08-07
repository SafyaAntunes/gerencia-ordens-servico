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
      <h2 className="text-lg font-semibold mb-3 px-1">{title}</h2>
      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex-1 overflow-hidden">
            <div className="flex flex-col gap-4 pr-2 overflow-hidden">
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
