
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useEtapaDialogs() {
  const [atribuirFuncionarioDialogOpen, setAtribuirFuncionarioDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'start' | 'finish'>('start');
  const { funcionario } = useAuth();
  
  return {
    atribuirFuncionarioDialogOpen,
    setAtribuirFuncionarioDialogOpen,
    dialogAction,
    setDialogAction,
    funcionario
  };
}
