import React from "react";
import ColunaPresentacao from "./ColunaPresentacao";
import { useOrdensPresentacao } from "@/hooks/useOrdensPresentacao";
import { OrdemServico } from "@/types/ordens";

interface OrdensPresentacaoViewProps {
  ordens: OrdemServico[];
  onVerOrdem: (id: string) => void;
}

export default function OrdensPresentacaoView({ ordens, onVerOrdem }: OrdensPresentacaoViewProps) {
  const { leftOrdens, rightOrdens, handleReorder } = useOrdensPresentacao(ordens);

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-12rem)] overflow-hidden">
        <ColunaPresentacao
          title="Retífica"
          column="left"
          ordens={leftOrdens}
          onReorder={handleReorder}
          onVerOrdem={onVerOrdem}
        />
        <ColunaPresentacao
          title="Montagem/Teste"
          column="right"
          ordens={rightOrdens}
          onReorder={handleReorder}
          onVerOrdem={onVerOrdem}
        />
      </div>
    </section>
  );
}
