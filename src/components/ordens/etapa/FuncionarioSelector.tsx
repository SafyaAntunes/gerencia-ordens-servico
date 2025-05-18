
import React, { useState, useEffect } from "react";
import { User, Save, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Funcionario } from "@/types/funcionarios";
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { marcarFuncionarioEmServico } from "@/services/funcionarioEmServicoService";

interface FuncionarioSelectorProps {
  ordemId: string;
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  funcionarioSelecionadoId?: string;
  funcionariosOptions: any[];
  isEtapaConcluida: boolean;
  onFuncionarioChange: (id: string) => void;
  onSaveResponsavel: () => Promise<void>;
  isSaving?: boolean;
}

export default function FuncionarioSelector({
  ordemId,
  etapa,
  servicoTipo,
  funcionarioSelecionadoId,
  funcionariosOptions,
  isEtapaConcluida,
  onFuncionarioChange,
  onSaveResponsavel,
  isSaving = false
}: FuncionarioSelectorProps) {
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [isMarkingAsBusy, setIsMarkingAsBusy] = useState(false);
  
  // Sync with parent component value
  useEffect(() => {
    console.log("FuncionarioSelector - funcionarioSelecionadoId mudou:", funcionarioSelecionadoId);
    setSelectedValue(funcionarioSelecionadoId || "");
  }, [funcionarioSelecionadoId]);
  
  const handleChange = (value: string) => {
    console.log("Select value changed to:", value);
    setSelectedValue(value);
    
    // Validate funcionario exists
    const funcionarioExists = funcionariosOptions.some(f => f.id === value);
    if (funcionarioExists) {
      console.log("Funcionário existe, chamando onFuncionarioChange");
      onFuncionarioChange(value);
    } else {
      console.warn("ID de funcionário inválido:", value);
      toast.error("Funcionário inválido selecionado");
    }
  };
  
  const handleSave = async () => {
    console.log("Salvando responsável com ID:", selectedValue);
    if (!selectedValue) {
      toast.error("Selecione um funcionário primeiro");
      return;
    }
    
    try {
      setIsMarkingAsBusy(true);
      
      // Primeiro, marcar o funcionário como ocupado
      const marcadoComoOcupado = await marcarFuncionarioEmServico(
        selectedValue,
        ordemId,
        etapa,
        servicoTipo
      );
      
      if (!marcadoComoOcupado) {
        toast.error("Erro ao marcar funcionário como ocupado");
        setIsMarkingAsBusy(false);
        return;
      }
      
      // Depois, salvar o responsável
      await onSaveResponsavel();
      
      toast.success("Funcionário atribuído com sucesso");
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast.error("Erro ao salvar responsável");
    } finally {
      setIsMarkingAsBusy(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <label htmlFor="funcionario-select" className="block text-sm font-medium">
          Responsável pela etapa
        </label>
        <Select
          value={selectedValue}
          onValueChange={handleChange}
          disabled={isEtapaConcluida || isSaving || isMarkingAsBusy}
        >
          <SelectTrigger id="funcionario-select" className="w-full">
            <SelectValue placeholder="Selecione um funcionário" />
          </SelectTrigger>
          <SelectContent>
            {funcionariosOptions.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Nenhum funcionário disponível
              </div>
            ) : (
              funcionariosOptions.map((funcionario) => (
                <SelectItem key={funcionario.id} value={funcionario.id}>
                  {funcionario.nome}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSave}
        disabled={!selectedValue || isEtapaConcluida || isSaving || isMarkingAsBusy}
        className="w-full"
      >
        {isSaving || isMarkingAsBusy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Salvar Responsável
          </>
        )}
      </Button>
    </div>
  );
}
