
import { User, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Funcionario } from "@/types/funcionarios";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface FuncionarioSelectorProps {
  funcionarioSelecionadoId: string;
  funcionariosOptions: Funcionario[];
  isEtapaConcluida: boolean;
  onFuncionarioChange: (value: string) => void;
  onSaveResponsavel: () => void;
  lastSavedFuncionarioId?: string;
  lastSavedFuncionarioNome?: string;
  isSaving?: boolean;
}

export default function FuncionarioSelector({
  funcionarioSelecionadoId,
  funcionariosOptions,
  isEtapaConcluida,
  onFuncionarioChange,
  onSaveResponsavel,
  lastSavedFuncionarioId,
  lastSavedFuncionarioNome,
  isSaving = false
}: FuncionarioSelectorProps) {
  // Estado local para rastrear mudanças no funcionário selecionado
  const [isChanged, setIsChanged] = useState(false);
  
  // Efeito para detectar mudanças na seleção
  useEffect(() => {
    if (funcionarioSelecionadoId !== lastSavedFuncionarioId) {
      setIsChanged(true);
    } else {
      setIsChanged(false);
    }
  }, [funcionarioSelecionadoId, lastSavedFuncionarioId]);
  
  // Desabilitar o botão de salvar apenas se não houver funcionário selecionado ou se etapa está concluída ou não houve mudança
  const botaoSalvarDesabilitado = isEtapaConcluida || !funcionarioSelecionadoId || (!isChanged && funcionarioSelecionadoId === lastSavedFuncionarioId) || isSaving;
  
  // Função para lidar com o clique no botão salvar
  const handleSaveClick = () => {
    if (!funcionarioSelecionadoId) {
      toast.error("É necessário selecionar um responsável para salvar");
      return;
    }
    onSaveResponsavel();
    setIsChanged(false); // Resetar o estado após salvar
  };
  
  // Destaque visual se o funcionário foi alterado mas não salvo
  const selectBorderClass = isChanged ? "border-amber-400" : "";
  
  // Como estamos removendo o responsável, retornamos null
  return null;
}
