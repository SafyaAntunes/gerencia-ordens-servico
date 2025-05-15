
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, Pause } from "lucide-react";
import { Funcionario } from "@/types/funcionarios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { ServicoStatus } from "./hooks/types/servicoTrackerTypes";
import { Badge } from "@/components/ui/badge";

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
  servicoStatus: ServicoStatus;
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
  lastSavedResponsavelNome,
  servicoStatus
}: ServicoControlsProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [status, setStatus] = useState<ServicoStatus>(servicoStatus);

  useEffect(() => {
    // Check if the currently selected funcionário is different from the last saved one
    setHasChanges(responsavelSelecionadoId !== lastSavedResponsavelId);
  }, [responsavelSelecionadoId, lastSavedResponsavelId]);

  useEffect(() => {
    setStatus(servicoStatus);
  }, [servicoStatus]);

  const handleStatusChange = (newStatus: ServicoStatus) => {
    setStatus(newStatus);
    // Aqui você pode adicionar uma lógica para persistir a mudança de status
    // Por exemplo, chamando uma função do hook useServicoTracker
  };

  if (!temPermissao) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-slate-50 rounded-md">
        {lastSavedResponsavelNome ? (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Responsável:</span>
            <span className="text-sm">{lastSavedResponsavelNome}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Nenhum responsável atribuído</p>
        )}
      </div>

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
          
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium">Status do Serviço</p>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant={status === "em_andamento" ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleStatusChange("em_andamento")}
                className={status === "em_andamento" ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                <Play className="h-4 w-4 mr-1" />
                Em Andamento
              </Button>
              <Button 
                variant={status === "pausado" ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleStatusChange("pausado")}
                className={status === "pausado" ? "bg-orange-400 hover:bg-orange-500" : ""}
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausado
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={onMarcarConcluido}
                disabled={!todasSubatividadesConcluidas || !responsavelSelecionadoId}
                className={`${todasSubatividadesConcluidas && responsavelSelecionadoId ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'} text-white`}
                title={!todasSubatividadesConcluidas ? "Complete todas as subatividades primeiro" : !responsavelSelecionadoId ? "Selecione um responsável" : "Marcar como concluído"}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Concluído
              </Button>
            </div>
          </div>
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
