
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { TipoServico } from '@/types/ordens';

export interface AddSubatividadeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  novaSubatividade: string;
  setNovaSubatividade: React.Dispatch<React.SetStateAction<string>>;
  tempoEstimado: number;
  setTempoEstimado: React.Dispatch<React.SetStateAction<number>>;
  handleAddCustomSubatividade: () => Promise<void>;
  isAddingSubatividades: boolean;
  servicoTipo: TipoServico;
}

export const AddSubatividadeDialog: React.FC<AddSubatividadeDialogProps> = ({
  isOpen,
  setIsOpen,
  novaSubatividade,
  setNovaSubatividade,
  tempoEstimado,
  setTempoEstimado,
  handleAddCustomSubatividade,
  isAddingSubatividades,
  servicoTipo
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddCustomSubatividade();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Subatividade para {servicoTipo}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da subatividade</Label>
            <Input
              id="nome"
              value={novaSubatividade}
              onChange={(e) => setNovaSubatividade(e.target.value)}
              placeholder="Digite o nome da subatividade"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tempo">Tempo estimado (horas)</Label>
            <Input
              id="tempo"
              type="number"
              min="0.5"
              step="0.5"
              value={tempoEstimado}
              onChange={(e) => setTempoEstimado(Number(e.target.value))}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isAddingSubatividades}>
              Cancelar
            </Button>
            <Button type="submit" disabled={novaSubatividade.trim() === '' || isAddingSubatividades}>
              {isAddingSubatividades ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                'Adicionar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
