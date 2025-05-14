
import React, { useState, useEffect } from 'react';
import { useServicoTracker } from './hooks/useServicoTracker';
import ServicoHeader from './ServicoHeader';
import ServicoDetails from './ServicoDetails';
import ServicoControls from './ServicoControls';
import { ServicoTrackerProps } from './hooks/types/servicoTrackerTypes';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { useTrackerSubatividades } from '@/hooks/ordens/useTrackerSubatividades';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectSubatividadesDialog } from '../subatividades/SelectSubatividadesDialog';

function ServicoTracker({ 
  servico, 
  ordem, 
  onUpdate,
  // Legacy props support
  ordemId, 
  funcionarioId,
  funcionarioNome,
  etapa,
  onServicoStatusChange,
  onSubatividadeToggle,
  onSubatividadeSelecionadaToggle,
  canAddSubatividades = true
}: ServicoTrackerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [novaSubatividade, setNovaSubatividade] = useState('');
  const [tempoEstimado, setTempoEstimado] = useState(1);
  
  // Log initial props for debugging
  useEffect(() => {
    console.log("ServicoTracker mounted/updated with props:", {
      servicoTipo: servico.tipo,
      temOnUpdate: !!onUpdate,
      temOrdem: !!ordem,
      ordemId: ordemId || ordem?.id,
      subatividades: servico.subatividades?.length || 0
    });
  }, [servico, ordem, ordemId, onUpdate]);
  
  // Hook para adicionar subatividades
  const { 
    isAddingSubatividades,
    addSelectedSubatividades,
    addCustomSubatividade
  } = useTrackerSubatividades({ 
    ordem, 
    onOrdemUpdate: onUpdate 
  });
  
  const {
    isRunning,
    isPaused,
    displayTime,
    servicoStatus,
    progressPercentage,
    completedSubatividades,
    totalSubatividades,
    tempoTotalEstimado,
    subatividadesFiltradas,
    temPermissao,
    handleStartClick,
    handlePause,
    handleResume,
    handleFinish,
    handleMarcarConcluido,
    handleSubatividadeToggle
  } = useServicoTracker({ 
    servico, 
    ordem, 
    onUpdate,
    ordemId, 
    funcionarioId,
    funcionarioNome,
    etapa,
    onServicoStatusChange,
    onSubatividadeToggle,
    onSubatividadeSelecionadaToggle
  });
  
  const handleAddSelectedSubatividades = (selecionadas: string[]) => {
    console.log("ServicoTracker - handleAddSelectedSubatividades:", {
      servicoTipo: servico.tipo,
      selecionadas,
      temOrdem: !!ordem,
      ordemId: ordem?.id || ordemId
    });
    
    // Garantir que temos uma ordem ou ordemId
    if (!ordem && !ordemId) {
      console.error("Ordem não encontrada para adicionar subatividades");
      return;
    }
    
    addSelectedSubatividades(servico.tipo, selecionadas)
      .then(() => {
        console.log("ServicoTracker - Subatividades adicionadas com sucesso, fechando diálogo");
        setIsSelectDialogOpen(false);
      })
      .catch((error) => {
        console.error("ServicoTracker - Erro ao adicionar subatividades:", error);
        setIsSelectDialogOpen(false);
      });
  };
  
  const handleAddCustomSubatividade = async () => {
    if (novaSubatividade.trim()) {
      try {
        await addCustomSubatividade(
          servico.tipo, 
          novaSubatividade, 
          tempoEstimado
        );
        setNovaSubatividade('');
        setTempoEstimado(1);
        setIsAddDialogOpen(false);
      } catch (error) {
        console.error("Erro ao adicionar subatividade personalizada:", error);
        setIsAddDialogOpen(false);
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      <ServicoHeader
        tipo={servico.tipo}
        displayTime={displayTime}
        servicoStatus={servicoStatus}
        progressPercentage={progressPercentage}
        completedSubatividades={completedSubatividades}
        totalSubatividades={totalSubatividades}
        tempoTotalEstimado={tempoTotalEstimado}
        funcionarioNome={servico.funcionarioNome}
        concluido={servico.concluido}
        temPermissao={temPermissao}
        isOpen={isOpen}
        onToggleOpen={() => setIsOpen(!isOpen)}
      />
      
      {isOpen && (
        <>
          <div className="mt-4">
            <ServicoDetails
              descricao={servico.descricao}
              subatividades={subatividadesFiltradas}
              temPermissao={temPermissao}
              onSubatividadeToggle={handleSubatividadeToggle}
            />
            
            {/* Botões para adicionar subatividades */}
            {canAddSubatividades && temPermissao && !servico.concluido && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSelectDialogOpen(true)}
                  disabled={isAddingSubatividades}
                  className="flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" /> 
                  Adicionar Subatividades Padrão
                </Button>
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> 
                      Nova Subatividade
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Subatividade</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome-subatividade">Nome da Subatividade</Label>
                        <Input
                          id="nome-subatividade"
                          value={novaSubatividade}
                          onChange={(e) => setNovaSubatividade(e.target.value)}
                          placeholder="Digite o nome da subatividade"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tempo-estimado">Tempo Estimado (horas)</Label>
                        <Input
                          id="tempo-estimado"
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={tempoEstimado}
                          onChange={(e) => setTempoEstimado(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleAddCustomSubatividade}
                        disabled={!novaSubatividade.trim()}
                      >
                        Adicionar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {/* Diálogo de seleção de subatividades com melhor controle de estado */}
                <SelectSubatividadesDialog
                  open={isSelectDialogOpen}
                  onOpenChange={(open) => {
                    console.log("ServicoTracker - SelectSubatividadesDialog onOpenChange:", open);
                    setIsSelectDialogOpen(open);
                  }}
                  servicoTipo={servico.tipo}
                  onSelect={handleAddSelectedSubatividades}
                />
              </div>
            )}
          </div>
          
          <ServicoControls
            isRunning={isRunning}
            isPaused={isPaused}
            temPermissao={temPermissao}
            concluido={servico.concluido}
            todasSubatividadesConcluidas={progressPercentage === 100}
            onStartClick={handleStartClick}
            onPauseClick={handlePause}
            onResumeClick={handleResume}
            onFinishClick={handleFinish}
            onMarcarConcluido={handleMarcarConcluido}
          />
        </>
      )}
    </div>
  );
}

export default ServicoTracker;
