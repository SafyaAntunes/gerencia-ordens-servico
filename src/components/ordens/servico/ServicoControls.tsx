
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Funcionario } from "@/types/funcionarios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface ServicoControlsProps {
  temPermissao: boolean;
  concluido: boolean;
  todasSubatividadesConcluidas: boolean;
  onMarcarConcluido: () => void;
  funcionariosOptions: Funcionario[];
  responsavelSelecionadoId: string;
  setResponsavelSelecionadoId: (id: string) => void;
  handleSaveResponsavel: () => Promise<void>;
  isSavingResponsavel: boolean;
  lastSavedResponsavelId: string;
  lastSavedResponsavelNome: string;
}

export default function ServicoControls({
  temPermissao,
  concluido,
  todasSubatividadesConcluidas,
  onMarcarConcluido,
  funcionariosOptions,
  responsavelSelecionadoId,
  setResponsavelSelecionadoId,
  handleSaveResponsavel,
  isSavingResponsavel,
  lastSavedResponsavelId,
}: ServicoControlsProps) {
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Check if the currently selected funcionário is different from the last saved one
    setHasChanges(responsavelSelecionadoId !== lastSavedResponsavelId);
  }, [responsavelSelecionadoId, lastSavedResponsavelId]);

  if (!temPermissao) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!concluido && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecionar Responsável</label>
            <Select 
              value={responsavelSelecionadoId} 
              onValueChange={setResponsavelSelecionadoId}
              disabled={concluido}
            >
              <SelectTrigger className="w-full">
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

          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleSaveResponsavel}
              disabled={isSavingResponsavel || !responsavelSelecionadoId}
              className="w-full"
            >
              {isSavingResponsavel ? "Salvando..." : "Salvar Responsável"}
            </Button>
          )}
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={onMarcarConcluido}
            disabled={!todasSubatividadesConcluidas || !responsavelSelecionadoId}
            className={`w-full ${todasSubatividadesConcluidas && responsavelSelecionadoId ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400'} text-white`}
            title={!todasSubatividadesConcluidas ? "Complete todas as subatividades primeiro" : !responsavelSelecionadoId ? "Selecione um responsável" : "Marcar como concluído"}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Marcar Concluído
          </Button>
        </>
      )}

      {concluido && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-md text-green-700 text-sm text-center">
          Serviço concluído
        </div>
      )}
    </div>
  );
}
