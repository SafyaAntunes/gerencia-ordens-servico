
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { AddSubatividadeDialog } from '../dialogs/AddSubatividadeDialog';
import { SelectSubatividadesDialog } from '../../subatividades/SelectSubatividadesDialog';
import { TipoServico } from '@/types/ordens';

interface SubatividadesButtonsProps {
  canAddSubatividades: boolean;
  temPermissao: boolean;
  servicoConcluido: boolean;
  servicoTipo: TipoServico; // Tipado corretamente como TipoServico
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSelectDialogOpen: boolean;
  setIsSelectDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  novaSubatividade: string;
  setNovaSubatividade: React.Dispatch<React.SetStateAction<string>>;
  tempoEstimado: number;
  setTempoEstimado: React.Dispatch<React.SetStateAction<number>>;
  isAddingSubatividades: boolean;
  handleAddCustomSubatividade: () => Promise<void>;
  handleAddSelectedSubatividades: (selecionadas: string[]) => void;
}

export const SubatividadesButtons: React.FC<SubatividadesButtonsProps> = ({
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
}) => {
  if (!canAddSubatividades || !temPermissao || servicoConcluido) {
    return null;
  }

  // Manipulador para tratar a seleção de subatividades
  const handleSelected = (selecionadas: string[]) => {
    console.log("SubatividadesButtons - Subatividades selecionadas:", selecionadas);
    
    if (selecionadas && selecionadas.length > 0) {
      handleAddSelectedSubatividades(selecionadas);
      // Não fechamos o diálogo aqui - deixamos que a operação completa dispare o fechamento
    } else {
      // Se não houver seleção, fechamos o diálogo manualmente
      setIsSelectDialogOpen(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsAddDialogOpen(true)}
        disabled={isAddingSubatividades}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" /> 
        Adicionar Subatividade
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsSelectDialogOpen(true)}
        disabled={isAddingSubatividades}
        className="flex items-center gap-1"
      >
        <Settings className="h-4 w-4" /> 
        Adicionar Subatividades Padrão
      </Button>
      
      <AddSubatividadeDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        novaSubatividade={novaSubatividade}
        tempoEstimado={tempoEstimado}
        onNovaSubatividadeChange={setNovaSubatividade}
        onTempoEstimadoChange={setTempoEstimado}
        onAddSubatividade={handleAddCustomSubatividade}
      />
      
      <SelectSubatividadesDialog
        open={isSelectDialogOpen}
        onOpenChange={(open) => {
          console.log("SubatividadesButtons - SelectSubatividadesDialog onOpenChange:", open);
          setIsSelectDialogOpen(open);
        }}
        servicoTipo={servicoTipo}
        onSelect={handleSelected}
      />
    </div>
  );
};
