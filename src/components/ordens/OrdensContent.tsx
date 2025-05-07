
import { OrdemServico } from "@/types/ordens";
import OrdemCard from "@/components/ordens/OrdemCard";
import OrdemListRow from "@/components/ordens/ordem-list-row";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface OrdensContentProps {
  loading: boolean;
  filteredOrdens: OrdemServico[];
  isTecnico: boolean;
  viewType: "grid" | "list";
  onReorder: (dragIndex: number, dropIndex: number) => void;
  onVerOrdem: (id: string) => void;
  onDeleteOrdens?: (ids: string[]) => Promise<void>;
}

export default function OrdensContent({
  loading,
  filteredOrdens,
  isTecnico,
  viewType,
  onReorder,
  onVerOrdem,
  onDeleteOrdens
}: OrdensContentProps) {
  const [selectedOrdens, setSelectedOrdens] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (loading) {
    return <div className="text-center py-8">Carregando ordens...</div>;
  }
  
  if (filteredOrdens.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isTecnico 
          ? "Nenhuma ordem encontrada para suas especialidades."
          : "Nenhuma ordem encontrada com os filtros selecionados."}
      </div>
    );
  }

  const handleSelectOrdem = (id: string, isSelected: boolean) => {
    const newSelectedOrdens = new Set(selectedOrdens);
    
    if (isSelected) {
      newSelectedOrdens.add(id);
    } else {
      newSelectedOrdens.delete(id);
    }
    
    setSelectedOrdens(newSelectedOrdens);
  };

  const handleSelectAll = () => {
    if (selectedOrdens.size === filteredOrdens.length) {
      // If all are selected, deselect all
      setSelectedOrdens(new Set());
    } else {
      // Select all
      const allIds = filteredOrdens.map(ordem => ordem.id);
      setSelectedOrdens(new Set(allIds));
    }
  };

  const handleDeleteSelected = async () => {
    if (!onDeleteOrdens || selectedOrdens.size === 0) return;
    
    setIsDeleting(true);
    try {
      await onDeleteOrdens(Array.from(selectedOrdens));
      setSelectedOrdens(new Set());
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir ordens:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const selectionControls = selectedOrdens.size > 0 && (
    <div className="flex items-center mb-4 gap-2 bg-gray-50 p-2 rounded-md">
      <span className="text-sm font-medium">
        {selectedOrdens.size} {selectedOrdens.size === 1 ? 'ordem selecionada' : 'ordens selecionadas'}
      </span>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsDeleteDialogOpen(true)}
        className="ml-auto"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Excluir selecionadas
      </Button>
    </div>
  );
  
  if (viewType === "grid") {
    return (
      <>
        {selectionControls}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrdens.map((ordem, index) => (
            <OrdemCard 
              key={ordem.id} 
              ordem={ordem}
              index={index}
              onReorder={onReorder}
              onClick={() => onVerOrdem(ordem.id)}
              isSelectable={true}
              isSelected={selectedOrdens.has(ordem.id)}
              onSelect={(isSelected) => handleSelectOrdem(ordem.id, isSelected)}
            />
          ))}
        </div>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmação de exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir {selectedOrdens.size} {selectedOrdens.size === 1 ? 'ordem' : 'ordens'}? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteSelected} disabled={isDeleting}>
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
  
  return (
    <>
      {selectionControls}
      <div className="space-y-4">
        {filteredOrdens.map((ordem, index) => (
          <OrdemListRow
            key={ordem.id}
            ordem={ordem}
            index={index}
            onReorder={onReorder}
            onClick={() => onVerOrdem(ordem.id)}
            isSelectable={true}
            isSelected={selectedOrdens.has(ordem.id)}
            onSelect={(isSelected) => handleSelectOrdem(ordem.id, isSelected)}
          />
        ))}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedOrdens.size} {selectedOrdens.size === 1 ? 'ordem' : 'ordens'}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
