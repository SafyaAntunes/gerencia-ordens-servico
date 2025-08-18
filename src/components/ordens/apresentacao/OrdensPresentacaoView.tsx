import React, { useEffect } from "react";
import ColunaPresentacao from "./ColunaPresentacao";
import { useOrdensPresentacao } from "@/hooks/useOrdensPresentacao";
import { OrdemServico } from "@/types/ordens";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, Monitor } from "lucide-react";

interface OrdensPresentacaoViewProps {
  ordens: OrdemServico[];
  onVerOrdem: (id: string) => void;
  onExitPresentation: () => void;
}

export default function OrdensPresentacaoView({ ordens, onVerOrdem, onExitPresentation }: OrdensPresentacaoViewProps) {
  const { leftOrdens, rightOrdens, handleReorder } = useOrdensPresentacao(ordens);

  // Listener para a tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onExitPresentation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onExitPresentation]);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Botão de sair - canto superior direito */}
      <div className="absolute top-4 right-4 z-60">
        <Button
          onClick={onExitPresentation}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm border-2 hover:bg-background"
        >
          <X className="h-4 w-4 mr-2" />
          Sair da Apresentação
        </Button>
      </div>

      <div className="w-full h-full p-4">
        <div className="flex h-full overflow-hidden">
          <div className="flex-1">
            <ColunaPresentacao
              title="Retífica"
              column="left"
              ordens={leftOrdens}
              onReorder={handleReorder}
              onVerOrdem={onVerOrdem}
            />
          </div>
          
          {/* Linha separadora vertical */}
          <div className="flex items-center justify-center px-4">
            <Separator orientation="vertical" className="h-full bg-border/50" />
          </div>
          
          <div className="flex-1">
            <ColunaPresentacao
              title="Montagem/Teste"
              column="right"
              ordens={rightOrdens}
              onReorder={handleReorder}
              onVerOrdem={onVerOrdem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
