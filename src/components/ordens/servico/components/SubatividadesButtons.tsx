
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TipoServico } from "@/types/ordens";
import { SubatividadeSelector } from "./SubatividadeSelector";

interface SubatividadesButtonsProps {
  canAddSubatividades: boolean;
  temPermissao: boolean;
  servicoConcluido: boolean;
  servicoTipo: TipoServico;
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  isSelectDialogOpen: boolean;
  setIsSelectDialogOpen: (open: boolean) => void;
  novaSubatividade: string;
  setNovaSubatividade: (value: string) => void;
  tempoEstimado: number;
  setTempoEstimado: (value: number) => void;
  isAddingSubatividades: boolean;
  handleAddCustomSubatividade: () => void;
  handleAddSelectedSubatividades: (selecionadas: string[]) => void;
}

export function SubatividadesButtons({
  canAddSubatividades,
  temPermissao,
  servicoConcluido,
  servicoTipo,
  isAddDialogOpen,
  setIsAddDialogOpen,
  isSelectDialogOpen,
  setIsSelectDialogOpen,
  novaSubatividade,
  setNovaSubatividade,
  tempoEstimado,
  setTempoEstimado,
  isAddingSubatividades,
  handleAddCustomSubatividade,
  handleAddSelectedSubatividades
}: SubatividadesButtonsProps) {
  // Não mostrar botões se o serviço estiver concluído ou não tiver permissão
  if (servicoConcluido || !temPermissao || !canAddSubatividades) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={() => setIsAddDialogOpen(true)}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" /> Adicionar subatividade personalizada
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsSelectDialogOpen(true)}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" /> Selecionar de predefinidas
      </Button>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Subatividade</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                className="col-span-3"
                placeholder="Nome da subatividade"
                value={novaSubatividade}
                onChange={(e) => setNovaSubatividade(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tempo" className="text-right">
                Tempo (h)
              </Label>
              <Input
                id="tempo"
                className="col-span-3"
                type="number"
                min={0.5}
                step={0.5}
                placeholder="Tempo estimado em horas"
                value={tempoEstimado}
                onChange={(e) => setTempoEstimado(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setIsAddDialogOpen(false)}
              className="mr-2"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCustomSubatividade} 
              disabled={isAddingSubatividades || novaSubatividade.trim() === ''}
            >
              {isAddingSubatividades ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Subatividades Predefinidas</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <SubatividadeSelector
              tipoServico={servicoTipo}
              onConfirm={handleAddSelectedSubatividades}
              onCancel={() => setIsSelectDialogOpen(false)}
              isLoading={isAddingSubatividades}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
