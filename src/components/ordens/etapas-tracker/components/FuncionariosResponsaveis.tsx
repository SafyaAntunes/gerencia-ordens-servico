
import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, X } from "lucide-react";
import { AtribuirMultiplosFuncionariosDialog } from "@/components/funcionarios/AtribuirMultiplosFuncionariosDialog";
import { useState } from "react";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { toast } from "sonner";

interface FuncionariosResponsaveisProps {
  funcionarioId?: string;
  funcionarioNome?: string;
  funcionariosIds?: string[];
  funcionariosNomes?: string[];
  ordemId: string;
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  isEtapaConcluida: boolean;
  onFuncionariosChange: (ids: string[], nomes: string[]) => void;
}

export default function FuncionariosResponsaveis({
  funcionarioId,
  funcionarioNome,
  funcionariosIds = [],
  funcionariosNomes = [],
  ordemId,
  etapa,
  servicoTipo,
  isEtapaConcluida,
  onFuncionariosChange,
}: FuncionariosResponsaveisProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Converter funcionarioId/Nome único para arrays, se existirem
  const todosIds = funcionariosIds.length > 0 
    ? funcionariosIds 
    : (funcionarioId ? [funcionarioId] : []);
    
  const todosNomes = funcionariosNomes.length > 0 
    ? funcionariosNomes 
    : (funcionarioNome ? [funcionarioNome] : []);
  
  const handleFuncionariosConfirm = (ids: string[], nomes: string[]) => {
    console.log("FuncionariosResponsaveis - Funcionários confirmados:", { ids, nomes });
    onFuncionariosChange(ids, nomes);
    toast.success("Funcionários atribuídos com sucesso");
  };
  
  const handleRemoveFuncionario = (index: number) => {
    console.log("Removendo funcionário no índice:", index);
    const newIds = [...todosIds];
    const newNomes = [...todosNomes];
    
    newIds.splice(index, 1);
    newNomes.splice(index, 1);
    
    console.log("Novos arrays após remoção:", { newIds, newNomes });
    onFuncionariosChange(newIds, newNomes);
    toast.success("Funcionário removido com sucesso");
  };
  
  const temFuncionarios = todosIds.length > 0 && todosIds.some(id => id !== "");

  return (
    <div className="mt-4 mb-6 border rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-medium">Funcionários Responsáveis:</h3>
        
        {!isEtapaConcluida && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <UserPlus className="h-4 w-4" />
            <span>Atribuir Funcionários</span>
          </Button>
        )}
      </div>
      
      {!temFuncionarios ? (
        <div className="text-center py-8 flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
            <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
            </svg>
          </div>
          <p>Nenhum funcionário atribuído</p>
          <p className="text-sm">Clique em "Atribuir Funcionários" para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todosIds.map((id, index) => (
            <div key={`${id}-${index}`} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                  </svg>
                </div>
                <span>{todosNomes[index] || "Funcionário"}</span>
              </div>
              
              {!isEtapaConcluida && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveFuncionario(index)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remover</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <AtribuirMultiplosFuncionariosDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleFuncionariosConfirm}
        funcionariosSelecionadosIds={todosIds}
        especialidadeRequerida={servicoTipo}
        apenasDisponiveis={false} // Modificação aqui para mostrar todos os funcionários
        title="Atribuir Funcionários"
        description={`Selecione os funcionários responsáveis pela etapa de ${etapa.replace('_', ' ')}`}
      />
    </div>
  );
}
