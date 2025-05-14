
import { useState, useEffect } from "react";
import { TipoServico } from "@/types/ordens";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface SelectSubatividadesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicoTipo: TipoServico;
  onSelect: (selecionadas: string[]) => void;
}

export function SelectSubatividadesDialog({
  open,
  onOpenChange,
  servicoTipo,
  onSelect,
}: SelectSubatividadesDialogProps) {
  const { defaultSubatividades } = useServicoSubatividades();
  const [subatividadesDisponiveis, setSubatividadesDisponiveis] = useState<string[]>([]);
  const [selecionadas, setSelecionadas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open && servicoTipo) {
      // Obter subatividades para este tipo de serviço
      const disponiveis = defaultSubatividades[servicoTipo] || [];
      setSubatividadesDisponiveis(disponiveis);
      
      // Inicializar todas como selecionadas
      const inicial: Record<string, boolean> = {};
      disponiveis.forEach(sub => {
        inicial[sub] = true;
      });
      setSelecionadas(inicial);
    }
  }, [open, servicoTipo, defaultSubatividades]);

  const handleToggleSubatividade = (nome: string, checked: boolean) => {
    setSelecionadas(prev => ({
      ...prev,
      [nome]: checked
    }));
  };

  const handleSelectAll = () => {
    const todas: Record<string, boolean> = {};
    subatividadesDisponiveis.forEach(sub => {
      todas[sub] = true;
    });
    setSelecionadas(todas);
  };

  const handleDeselectAll = () => {
    const nenhuma: Record<string, boolean> = {};
    subatividadesDisponiveis.forEach(sub => {
      nenhuma[sub] = false;
    });
    setSelecionadas(nenhuma);
  };

  const handleConfirm = () => {
    // Filtrar apenas as subatividades selecionadas
    const subatividadesSelecionadas = Object.entries(selecionadas)
      .filter(([_, selecionada]) => selecionada)
      .map(([nome]) => nome);
    
    onSelect(subatividadesSelecionadas);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Subatividades</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex justify-between mb-4">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Selecionar Todas
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Desmarcar Todas
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
            {subatividadesDisponiveis.map((subatividade) => (
              <div key={subatividade} className="flex items-center space-x-2">
                <Checkbox 
                  id={`sub-${subatividade}`} 
                  checked={selecionadas[subatividade]} 
                  onCheckedChange={(checked) => handleToggleSubatividade(subatividade, !!checked)}
                />
                <Label htmlFor={`sub-${subatividade}`} className="text-sm">
                  {subatividade}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirm}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
