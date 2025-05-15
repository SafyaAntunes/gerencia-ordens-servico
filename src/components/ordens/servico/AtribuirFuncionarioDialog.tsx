
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
import { FuncionarioStatus } from "@/hooks/useFuncionariosDisponibilidade";
import { Badge } from "@/components/ui/badge";
import { CircleCheck, Clock } from "lucide-react";

interface AtribuirFuncionarioDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  funcionariosOptions: FuncionarioStatus[];
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
  // Filtramos a lista para mostrar apenas funcionários disponíveis ou o funcionário atual
  const filteredFuncionarios = funcionariosOptions.filter(f => 
    f.status === 'disponivel' || (funcionarioAtual && f.id === funcionarioAtual.id)
  );
  
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
                {funcionarioAtual && (
                  <SelectItem value={funcionarioAtual.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {funcionarioAtual.nome} (você)
                      
                      {/* Status badge para o funcionário atual */}
                      {funcionariosOptions.find(f => f.id === funcionarioAtual.id)?.status === 'ocupado' ? (
                        <Badge variant="warning" className="ml-2 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Ocupado
                        </Badge>
                      ) : (
                        <Badge variant="success" className="ml-2 text-xs">
                          <CircleCheck className="h-3 w-3 mr-1" />
                          Disponível
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                )}
                {filteredFuncionarios
                  .filter(f => !funcionarioAtual || f.id !== funcionarioAtual.id)
                  .map(f => (
                    <SelectItem key={f.id} value={f.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {f.nome}
                        
                        {/* Status badge */}
                        {f.status === 'ocupado' ? (
                          <Badge variant="warning" className="ml-2 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Ocupado
                          </Badge>
                        ) : (
                          <Badge variant="success" className="ml-2 text-xs">
                            <CircleCheck className="h-3 w-3 mr-1" />
                            Disponível
                          </Badge>
                        )}
                      </div>
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
