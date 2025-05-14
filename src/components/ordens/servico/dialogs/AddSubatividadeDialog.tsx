
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { TipoServico } from "@/types/ordens";

interface AddSubatividadeDialogProps {
  servicoTipo: TipoServico;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isAddingSubatividades: boolean;
  novaSubatividade: string;
  setNovaSubatividade: (value: string) => void;
  tempoEstimado: number;
  setTempoEstimado: (value: number) => void;
  handleAddCustomSubatividade: () => void;
}

export function AddSubatividadeDialog({
  servicoTipo,
  isOpen,
  setIsOpen,
  isAddingSubatividades,
  novaSubatividade,
  setNovaSubatividade,
  tempoEstimado,
  setTempoEstimado,
  handleAddCustomSubatividade
}: AddSubatividadeDialogProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddCustomSubatividade();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar nova subatividade</DialogTitle>
          <DialogDescription>
            Adicione uma subatividade personalizada para o serviço
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome" className="text-right">
              Nome
            </Label>
            <Input
              id="nome"
              value={novaSubatividade}
              onChange={(e) => setNovaSubatividade(e.target.value)}
              onKeyDown={handleKeyDown}
              className="col-span-3"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tempo" className="text-right">
              Tempo (horas)
            </Label>
            <Input
              id="tempo"
              type="number"
              min="0.5"
              step="0.5"
              value={tempoEstimado}
              onChange={(e) => setTempoEstimado(parseFloat(e.target.value) || 1)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isAddingSubatividades}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleAddCustomSubatividade}
            disabled={!novaSubatividade.trim() || isAddingSubatividades}
          >
            {isAddingSubatividades ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
