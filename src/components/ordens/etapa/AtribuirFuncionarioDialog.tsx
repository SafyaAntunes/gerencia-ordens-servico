
import { Button } from "@/components/ui/button";
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
import { Funcionario } from "@/types/funcionarios";

interface AtribuirFuncionarioDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  funcionarioAtual: { id: string; nome: string };
  funcionariosOptions: Funcionario[];
  onFuncionarioChange: (value: string) => void;
  dialogAction: 'start' | 'finish';
}

export default function AtribuirFuncionarioDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  funcionarioAtual,
  funcionariosOptions,
  onFuncionarioChange,
  dialogAction
}: AtribuirFuncionarioDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atribuir Funcionário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="funcionario-select-etapa" className="block text-sm font-medium">
              Selecione o funcionário que {dialogAction === 'start' ? 'executará' : 'executou'} esta etapa
            </label>
            
            <Select onValueChange={onFuncionarioChange} defaultValue={funcionarioAtual.id}>
              <SelectTrigger id="funcionario-select-etapa" className="w-full">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={funcionarioAtual.id}>
                  {funcionarioAtual.nome || "Eu mesmo"} (você)
                </SelectItem>
                {funcionariosOptions
                  .filter(f => f.id !== funcionarioAtual.id)
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
