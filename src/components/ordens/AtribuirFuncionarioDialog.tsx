
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
import { useAuth } from "@/hooks/useAuth";

interface AtribuirFuncionarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionariosOptions: Funcionario[];
  funcionarioSelecionadoId: string;
  setFuncionarioSelecionadoId: (value: string) => void;
  funcionarioSelecionadoNome: string;
  setFuncionarioSelecionadoNome: (nome: string) => void;
  onConfirmarAtribuicao: () => void;
}

export default function AtribuirFuncionarioDialog({
  open,
  onOpenChange,
  funcionariosOptions,
  funcionarioSelecionadoId,
  setFuncionarioSelecionadoId,
  funcionarioSelecionadoNome,
  setFuncionarioSelecionadoNome,
  onConfirmarAtribuicao,
}: AtribuirFuncionarioDialogProps) {
  const { funcionario } = useAuth();

  const handleFuncionarioChange = (value: string) => {
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    setFuncionarioSelecionadoNome(funcionarioSelecionado?.nome || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atribuir Funcionário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="funcionario-select-etapa" className="block text-sm font-medium">
              Selecione o funcionário que executou esta etapa
            </label>
            <Select onValueChange={handleFuncionarioChange} value={funcionarioSelecionadoId}>
              <SelectTrigger id="funcionario-select-etapa" className="w-full">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={funcionario?.id || ""}>
                  {funcionario?.nome || "Eu mesmo"} (você)
                </SelectItem>
                {funcionariosOptions
                  .filter(f => f.id !== funcionario?.id)
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
          <Button onClick={onConfirmarAtribuicao} className="bg-blue-500 hover:bg-blue-600">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

