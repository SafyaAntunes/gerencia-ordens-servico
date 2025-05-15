
import { useState } from "react";
import { ServicoHeader } from "./ServicoHeader";
import { ServicoControls } from "./ServicoControls";
import { ServicoDetails } from "./ServicoDetails";
import { useServicoTracker } from "./hooks";
import { Servico, TipoServico, EtapaOS } from "@/types/ordens";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import AtribuirFuncionarioDialog from "./AtribuirFuncionarioDialog";
import { useFuncionariosDisponibilidade, FuncionarioStatus } from "@/hooks/useFuncionariosDisponibilidade";

export interface ServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  etapa?: EtapaOS;
  funcionarioId?: string;
  funcionarioNome?: string;
  onServicoStatusChange?: (concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (subatividadeId: string, concluida: boolean) => void;
  isDisabled?: boolean;
}

export function ServicoTracker({
  servico,
  ordemId,
  etapa = "retifica",
  funcionarioId,
  funcionarioNome,
  onServicoStatusChange,
  onSubatividadeToggle,
  isDisabled = false
}: ServicoTrackerProps) {
  const tracker = useServicoTracker({
    servico,
    ordemId,
    funcionarioId,
    funcionarioNome,
    etapa,
    onServicoStatusChange,
    onSubatividadeToggle
  });
  
  const { funcionariosStatus } = useFuncionariosDisponibilidade();
  const [showFuncionarioDialog, setShowFuncionarioDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<'start' | 'finish'>('start');
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState(
    tracker.responsavelSelecionadoId || ""
  );

  const handleAssignFuncionario = (action: 'start' | 'finish') => {
    tracker.handleLoadFuncionarios();
    setDialogAction(action);
    setSelectedFuncionarioId(tracker.responsavelSelecionadoId);
    setShowFuncionarioDialog(true);
  };

  const handleFuncionarioChange = (id: string) => {
    setSelectedFuncionarioId(id);
  };

  const handleConfirmFuncionarioDialog = async () => {
    if (!selectedFuncionarioId) {
      toast.error("Selecione um funcionário para continuar");
      return;
    }

    tracker.setResponsavelSelecionadoId(selectedFuncionarioId);
    
    // Verificar se o funcionário selecionado está disponível (exceto se for o atual)
    if (selectedFuncionarioId !== tracker.lastSavedResponsavelId) {
      const funcionarioSelecionado = funcionariosStatus.find(f => f.id === selectedFuncionarioId);
      
      if (funcionarioSelecionado && funcionarioSelecionado.status === 'ocupado') {
        let mensagem = `O funcionário ${funcionarioSelecionado.nome} já está ocupado`;
        
        if (funcionarioSelecionado.atividadeAtual?.ordemNome) {
          mensagem += ` na ordem ${funcionarioSelecionado.atividadeAtual.ordemNome}`;
        }
        
        toast.error(mensagem);
        setShowFuncionarioDialog(false);
        return;
      }
    }
    
    // Se for para iniciar, mudar o status para em_andamento
    if (dialogAction === 'start') {
      await tracker.operations.start();
    } else if (dialogAction === 'finish') {
      await tracker.operations.complete();
    }
    
    setShowFuncionarioDialog(false);
  };

  const statusBadgeText = tracker.state.concluido
    ? "Concluído"
    : tracker.state.isRunning
    ? "Em andamento"
    : tracker.state.isPaused
    ? "Pausado"
    : "Não iniciado";

  const statusVariant = tracker.state.concluido
    ? "success"
    : tracker.state.isRunning
    ? "default"
    : tracker.state.isPaused
    ? "warning"
    : "outline";

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <ServicoHeader
          tipo={servico.tipo as TipoServico}
          status={
            <Badge variant={statusVariant} className="ml-2">
              {statusBadgeText}
            </Badge>
          }
        />
        <div className="p-4 space-y-4">
          {tracker.totalSubatividades > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progresso das atividades</span>
                <span className="text-muted-foreground">
                  {tracker.completedSubatividades}/{tracker.totalSubatividades} ({tracker.progressPercentage}%)
                </span>
              </div>
              <Progress value={tracker.progressPercentage} className="h-2" />
            </div>
          )}
          
          <ServicoDetails
            responsavel={{
              id: tracker.lastSavedResponsavelId,
              nome: tracker.lastSavedResponsavelNome
            }}
            onAssign={handleAssignFuncionario}
            isDisabled={isDisabled || !tracker.temPermissao}
            servicoStatus={tracker.state.status}
          />
          
          {tracker.totalSubatividades > 0 && tracker.state.isRunning && (
            <div className="space-y-2 border-t pt-2">
              <h4 className="text-sm font-medium">Atividades</h4>
              <div className="space-y-1">
                {tracker.subatividadesFiltradas.map(subatividade => (
                  <div key={subatividade.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`subatividade-${subatividade.id}`}
                      checked={subatividade.concluida}
                      onChange={e => tracker.handleSubatividadeToggle(subatividade.id, e.target.checked)}
                      className="mr-2 h-4 w-4 rounded"
                      disabled={isDisabled || !tracker.temPermissao || tracker.state.concluido}
                    />
                    <label
                      htmlFor={`subatividade-${subatividade.id}`}
                      className={`text-sm ${subatividade.concluida ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {subatividade.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <ServicoControls
            isRunning={tracker.state.isRunning}
            isPaused={tracker.state.isPaused}
            isConcluido={tracker.state.concluido}
            onStart={() => handleAssignFuncionario('start')}
            onPause={tracker.operations.pause}
            onResume={tracker.operations.resume}
            onComplete={tracker.operations.complete}
            isDisabled={isDisabled || !tracker.temPermissao}
          />
        </div>
      </div>
      
      <AtribuirFuncionarioDialog
        isOpen={showFuncionarioDialog}
        onOpenChange={setShowFuncionarioDialog}
        funcionariosOptions={funcionariosStatus}
        funcionarioAtual={
          tracker.lastSavedResponsavelId
            ? {
                id: tracker.lastSavedResponsavelId,
                nome: tracker.lastSavedResponsavelNome
              }
            : undefined
        }
        onFuncionarioChange={handleFuncionarioChange}
        onConfirm={handleConfirmFuncionarioDialog}
        dialogAction={dialogAction}
      />
    </>
  );
}
