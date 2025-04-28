
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
  onOpenChange: (open: boolean) => void;
  funcionariosOptions: Funcionario[];
  funcionarioAtual?: { id: string; nome: string };
  onFuncionarioChange: (id: string) => void;
  onConfirm: () => void;
  dialogAction: 'start' | 'finish';
}

export default function AtribuirFuncionarioDialog({
  isOpen,
  onOpenChange,
  funcionariosOptions,
  funcionarioAtual,
  onFuncionarioChange,
  onConfirm,
  dialogAction,
}: AtribuirFuncionarioDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atribuir Funcionário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="funcionario-select" className="block text-sm font-medium">
              Selecione o funcionário que {dialogAction === 'start' ? 'executará' : 'executou'} o serviço
            </label>
            
            <Select onValueChange={onFuncionarioChange} value={funcionarioAtual?.id || ""}>
              <SelectTrigger id="funcionario-select" className="w-full">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={funcionarioAtual?.id || ""}>
                  {funcionarioAtual?.nome || "Eu mesmo"} (você)
                </SelectItem>
                {funcionariosOptions
                  .filter(f => f.id !== funcionarioAtual?.id)
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
