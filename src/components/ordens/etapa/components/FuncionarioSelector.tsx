
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
  // Este componente foi configurado para não renderizar nada, já que
  // a funcionalidade de selecionar um funcionário responsável foi removida.
  return null;
}
