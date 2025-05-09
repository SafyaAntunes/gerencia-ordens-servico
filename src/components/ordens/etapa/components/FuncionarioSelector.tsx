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
  const handleFuncionarioChange = useCallback((value: string) => {
    onFuncionarioChange(value);
  }, [onFuncionarioChange]);

  const handleSaveResponsavel = useCallback(async () => {
    await onSaveResponsavel();
  }, [onSaveResponsavel]);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <label htmlFor="funcionario-select" className="block text-sm font-medium">
          Responsável pela etapa
        </label>
        <Select
          value={funcionarioSelecionadoId}
          onValueChange={handleFuncionarioChange}
          disabled={isEtapaConcluida || isSaving}
        >
          <SelectTrigger id="funcionario-select" className="w-full">
            <SelectValue placeholder="Selecione um funcionário" />
          </SelectTrigger>
          <SelectContent>
            {funcionariosOptions.map((funcionario) => (
              <SelectItem key={funcionario.id} value={funcionario.id}>
                {funcionario.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSaveResponsavel}
        disabled={!funcionarioSelecionadoId || isEtapaConcluida || isSaving}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar Responsável"
        )}
      </Button>
    </div>
  );
}
