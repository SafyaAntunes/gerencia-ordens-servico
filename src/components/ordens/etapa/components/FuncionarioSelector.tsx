
import { User, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Funcionario } from "@/types/funcionarios";
import { useEffect, useState } from "react";

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
  const [selectorKey, setSelectorKey] = useState(Date.now());
  
  // Reset selector quando o ID do funcionário mudar para garantir que o componente atualize
  useEffect(() => {
    setSelectorKey(Date.now());
    console.log("FuncionarioSelector - ID atualizado:", funcionarioSelecionadoId);
  }, [funcionarioSelecionadoId]);
  
  // Encontrar o nome do funcionário para exibição de depuração
  const funcionarioNome = funcionariosOptions.find(f => f.id === funcionarioSelecionadoId)?.nome || "Não encontrado";
  console.log("FuncionarioSelector - Renderizando com:", { id: funcionarioSelecionadoId, nome: funcionarioNome });
  
  // Desabilitar o botão de salvar apenas se não houver funcionário selecionado ou se etapa está concluída
  const botaoSalvarDesabilitado = isEtapaConcluida || !funcionarioSelecionadoId;
  
  return (
    <div className="mb-4">
      <div className="flex items-center text-sm font-medium mb-1">
        <User className="h-4 w-4 mr-1" />
        Responsável
      </div>
      
      <div className="flex space-x-2">
        <div className="flex-1">
          <Select 
            key={selectorKey}
            value={funcionarioSelecionadoId || ""} 
            onValueChange={onFuncionarioChange}
            disabled={isEtapaConcluida}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-60 overflow-y-auto">
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
          className={`${botaoSalvarDesabilitado ? 'bg-gray-100 text-gray-400' : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'}`}
          onClick={onSaveResponsavel}
          disabled={botaoSalvarDesabilitado}
        >
          <Save className="h-4 w-4 mr-1" />
          Salvar
        </Button>
      </div>
    </div>
  );
}
