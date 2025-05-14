
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
  servicoTipo?: TipoServico;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void; // Added this prop to match what's being passed
  isAddingSubatividades?: boolean;
  novaSubatividade: string;
  setNovaSubatividade?: (value: string) => void;
  onNovaSubatividadeChange?: (value: string) => void; // Added this prop to match what's being passed
  tempoEstimado: number;
  setTempoEstimado?: (value: number) => void;
  onTempoEstimadoChange?: (value: number) => void; // Added this prop to match what's being passed
  handleAddCustomSubatividade?: () => void;
  onAddSubatividade?: () => Promise<void>; // Added this prop to match what's being passed
}

export function AddSubatividadeDialog({
  servicoTipo,
  isOpen,
  setIsOpen,
  onOpenChange,
  isAddingSubatividades,
  novaSubatividade,
  setNovaSubatividade,
  onNovaSubatividadeChange,
  tempoEstimado,
  setTempoEstimado,
  onTempoEstimadoChange,
  handleAddCustomSubatividade,
  onAddSubatividade
}: AddSubatividadeDialogProps) {
  // Handle both prop patterns for backward compatibility
  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else if (setIsOpen) {
      setIsOpen(open);
    }
  };

  const handleNovaSubatividadeChange = (value: string) => {
    if (onNovaSubatividadeChange) {
      onNovaSubatividadeChange(value);
    } else if (setNovaSubatividade) {
      setNovaSubatividade(value);
    }
  };

  const handleTempoEstimadoChange = (value: number) => {
    if (onTempoEstimadoChange) {
      onTempoEstimadoChange(value);
    } else if (setTempoEstimado) {
      setTempoEstimado(value);
    }
  };

  const handleAdd = () => {
    if (onAddSubatividade) {
      onAddSubatividade();
    } else if (handleAddCustomSubatividade) {
      handleAddCustomSubatividade();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
              onChange={(e) => handleNovaSubatividadeChange(e.target.value)}
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
              onChange={(e) => handleTempoEstimadoChange(parseFloat(e.target.value) || 1)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isAddingSubatividades}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleAdd}
            disabled={!novaSubatividade.trim() || isAddingSubatividades}
          >
            {isAddingSubatividades ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
