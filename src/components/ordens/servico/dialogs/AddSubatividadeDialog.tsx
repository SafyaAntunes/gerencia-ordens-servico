
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddSubatividadeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  novaSubatividade: string;
  tempoEstimado: number;
  onNovaSubatividadeChange: (value: string) => void;
  onTempoEstimadoChange: (value: number) => void;
  onAddSubatividade: () => void;
}

export const AddSubatividadeDialog: React.FC<AddSubatividadeDialogProps> = ({
  isOpen,
  onOpenChange,
  novaSubatividade,
  tempoEstimado,
  onNovaSubatividadeChange,
  onTempoEstimadoChange,
  onAddSubatividade
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> 
          Nova Subatividade
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Subatividade</DialogTitle>
          <DialogDescription>
            Crie uma nova subatividade personalizada para este serviço.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome-subatividade">Nome da Subatividade</Label>
            <Input
              id="nome-subatividade"
              value={novaSubatividade}
              onChange={(e) => onNovaSubatividadeChange(e.target.value)}
              placeholder="Digite o nome da subatividade"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tempo-estimado">Tempo Estimado (horas)</Label>
            <Input
              id="tempo-estimado"
              type="number"
              min="0.5"
              step="0.5"
              value={tempoEstimado}
              onChange={(e) => onTempoEstimadoChange(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={onAddSubatividade}
            disabled={!novaSubatividade.trim()}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
