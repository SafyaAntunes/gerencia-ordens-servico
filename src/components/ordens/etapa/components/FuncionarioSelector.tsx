
import { User, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Funcionario } from "@/types/funcionarios";

interface FuncionarioSelectorProps {
  funcionarioSelecionadoId: string;
  funcionariosOptions: Funcionario[];
  isEtapaConcluida: boolean;
  onFuncionarioChange: (value: string) => void;
  onSaveResponsavel: () => void;
}

export default function FuncionarioSelector({
  funcionarioSelecionadoId,
  funcionariosOptions,
  isEtapaConcluida,
  onFuncionarioChange,
  onSaveResponsavel
}: FuncionarioSelectorProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center text-sm font-medium mb-1">
        <User className="h-4 w-4 mr-1" />
        Responsável
      </div>
      
      <div className="flex space-x-2">
        <div className="flex-1">
          <Select 
            value={funcionarioSelecionadoId} 
            onValueChange={onFuncionarioChange}
            disabled={isEtapaConcluida}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {funcionariosOptions.map((func) => (
                <SelectItem key={func.id} value={func.id}>
                  {func.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
          onClick={onSaveResponsavel}
          disabled={isEtapaConcluida}
        >
          <Save className="h-4 w-4 mr-1" />
          Salvar
        </Button>
      </div>
    </div>
  );
}
