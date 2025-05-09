
import React, { useCallback } from "react";
import { User, Save, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Funcionario } from "@/types/funcionarios";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";

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
  // Force a controlled value for the Select component
  const [selectedValue, setSelectedValue] = useState<string>("");
  
  // Sync with parent component value
  useEffect(() => {
    if (funcionarioSelecionadoId) {
      setSelectedValue(funcionarioSelecionadoId);
      console.log("FuncionarioSelector - Received ID:", funcionarioSelecionadoId);
    } else {
      setSelectedValue("");
      console.log("FuncionarioSelector - Clearing selected value");
    }
  }, [funcionarioSelecionadoId]);
  
  const handleChange = useCallback((value: string) => {
    console.log("Select value changed to:", value);
    setSelectedValue(value);
    
    // Validate funcionario exists
    const funcionarioExists = funcionariosOptions.some(f => f.id === value);
    if (funcionarioExists) {
      onFuncionarioChange(value);
    } else {
      console.warn("ID de funcionário inválido:", value);
      toast.error("Funcionário inválido selecionado");
    }
  }, [funcionariosOptions, onFuncionarioChange]);
  
  const handleSave = useCallback(async () => {
    console.log("Salvando responsável com ID:", selectedValue);
    if (!selectedValue) {
      toast.error("Selecione um funcionário primeiro");
      return;
    }
    
    try {
      await onSaveResponsavel();
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast.error("Erro ao salvar responsável");
    }
  }, [selectedValue, onSaveResponsavel]);
  
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <label htmlFor="funcionario-select" className="block text-sm font-medium">
          Responsável pela etapa
        </label>
        <Select
          value={selectedValue}
          onValueChange={handleChange}
          disabled={isEtapaConcluida || isSaving}
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
        disabled={!selectedValue || isEtapaConcluida || isSaving}
        className="w-full"
      >
        {isSaving ? (
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
