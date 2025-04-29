
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Funcionario } from "@/types/funcionarios";

interface AtribuirFuncionarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogAction: 'start' | 'finish';
  funcionarioOptions: Funcionario[];
  currentFuncionarioId?: string;
  currentFuncionarioNome?: string;
  selectedFuncionarioId: string;
  onFuncionarioChange: (value: string) => void;
  onConfirm: () => void;
}

export default function AtribuirFuncionarioDialog({
  open,
  onOpenChange,
  dialogAction,
  funcionarioOptions,
  currentFuncionarioId,
  currentFuncionarioNome,
  selectedFuncionarioId,
  onFuncionarioChange,
  onConfirm
}: AtribuirFuncionarioDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atribuir Funcionário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="funcionario-select-etapa" className="block text-sm font-medium">
              Selecione o funcionário que {dialogAction === 'start' ? 'executará' : 'executou'} esta etapa
            </label>
            
            <Select onValueChange={onFuncionarioChange} value={selectedFuncionarioId}>
              <SelectTrigger id="funcionario-select-etapa" className="w-full">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentFuncionarioId || ""}>
                  {currentFuncionarioNome || "Eu mesmo"} (você)
                </SelectItem>
                {funcionarioOptions
                  .filter(f => f.id !== currentFuncionarioId)
                  .map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-blue-500 hover:bg-blue-600">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
