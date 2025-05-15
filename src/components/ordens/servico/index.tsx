
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Play, Pause, Clock3 } from "lucide-react";
import { Servico } from "@/types/ordens";
import { Badge } from "@/components/ui/badge";
import { useServicoTracker } from "./hooks";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import AtribuirFuncionarioDialog from "./AtribuirFuncionarioDialog";
import { useFuncionariosDisponibilidade } from "@/hooks/useFuncionariosDisponibilidade";

interface ServicoTrackerProps {
  servico: Servico;
  ordemId: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  onStatusChange?: (status: 'em_andamento' | 'pausado' | 'concluido', funcionarioId?: string, funcionarioNome?: string) => void;
  onSubatividadeToggle?: (subatividadeId: string, checked: boolean) => void;
  isDisabled?: boolean;
}

export function ServicoTracker({
  servico,
  ordemId,
  funcionarioId,
  funcionarioNome,
  onStatusChange,
  onSubatividadeToggle,
  isDisabled = false
}: ServicoTrackerProps) {
  const [isAtribuirDialogOpen, setIsAtribuirDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'start' | 'finish'>('start');
  const { funcionariosStatus } = useFuncionariosDisponibilidade();
  
  const {
    temPermissao,
    servicoStatus,
    progressPercentage,
    responsavelSelecionadoId,
    setResponsavelSelecionadoId,
    lastSavedResponsavelId,
    lastSavedResponsavelNome,
    handleLoadFuncionarios,
    handleStatusChange,
  } = useServicoTracker({
    servico,
    ordemId,
    funcionarioId,
    funcionarioNome,
    onServicoStatusChange: onStatusChange,
    onSubatividadeToggle
  });

  // Carregar funcionários quando o componente montar
  useEffect(() => {
    handleLoadFuncionarios();
  }, [handleLoadFuncionarios]);

  // Filtrar para mostrar apenas funcionários disponíveis e o funcionário atual deste serviço
  const funcionariosElegiveis = funcionariosStatus.filter(funcionario => {
    // Incluir o funcionário atual do serviço, mesmo que ocupado
    if (funcionario.id === servico.funcionarioId) {
      return true;
    }
    
    // Para outros funcionários, incluir somente os disponíveis e ativos
    return funcionario.status === 'disponivel' && funcionario.ativo !== false;
  });

  const handleIniciarClick = useCallback(() => {
    if (isDisabled) return;
    
    // Se já tem um funcionário salvo, inicia diretamente
    if (lastSavedResponsavelId) {
      handleStatusChange('em_andamento');
    } else {
      // Se não tem funcionário salvo, abre o diálogo para selecionar
      setDialogAction('start');
      setIsAtribuirDialogOpen(true);
    }
  }, [isDisabled, lastSavedResponsavelId, handleStatusChange]);

  const handleFuncionarioChange = useCallback((id: string) => {
    setResponsavelSelecionadoId(id);
  }, [setResponsavelSelecionadoId]);

  const handleConfirmFuncionario = useCallback(() => {
    if (dialogAction === 'start') {
      // Se estamos iniciando, muda o status para em_andamento
      handleStatusChange('em_andamento');
    } else {
      // Se estamos concluindo, muda o status para concluido
      handleStatusChange('concluido');
    }
  }, [dialogAction, handleStatusChange]);

  const handleConcluirClick = useCallback(() => {
    if (isDisabled) return;
    
    // Permitir marcar como concluído usando o último funcionário salvo ou abrir diálogo
    if (lastSavedResponsavelId) {
      handleStatusChange('concluido');
    } else {
      setDialogAction('finish');
      setIsAtribuirDialogOpen(true);
    }
  }, [isDisabled, lastSavedResponsavelId, handleStatusChange]);

  const formatServiceType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusBadge = () => {
    switch(servicoStatus) {
      case 'em_andamento':
        return <Badge variant="secondary" className="flex items-center gap-1"><Play className="h-3 w-3" /> Em andamento</Badge>;
      case 'pausado':
        return <Badge variant="warning" className="flex items-center gap-1"><Pause className="h-3 w-3" /> Pausado</Badge>;
      case 'concluido':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Concluído</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> Não iniciado</Badge>;
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{formatServiceType(servico.tipo)}</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {/* Progresso */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <span className="text-sm font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          {/* Responsável */}
          <div className="mb-4">
            <span className="text-sm text-muted-foreground block mb-1">Responsável</span>
            <span className="text-sm font-medium block">
              {lastSavedResponsavelNome || (lastSavedResponsavelId ? "ID: " + lastSavedResponsavelId : "Não atribuído")}
            </span>
          </div>
          
          {/* Botões de ação */}
          <div className="flex gap-2 mt-4">
            {servicoStatus !== 'em_andamento' && servicoStatus !== 'concluido' && (
              <Button 
                size="sm" 
                onClick={handleIniciarClick} 
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                disabled={isDisabled || !temPermissao}
              >
                <Play className="mr-1 h-4 w-4" />
                Iniciar
              </Button>
            )}
            
            {servicoStatus === 'em_andamento' && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleStatusChange('pausado')}
                className="flex-1"
                disabled={isDisabled || !temPermissao}
              >
                <Pause className="mr-1 h-4 w-4" />
                Pausar
              </Button>
            )}
            
            {servicoStatus === 'pausado' && (
              <Button 
                size="sm" 
                onClick={() => handleStatusChange('em_andamento')}
                className="flex-1"
                disabled={isDisabled || !temPermissao}
              >
                <Play className="mr-1 h-4 w-4" />
                Retomar
              </Button>
            )}
            
            {servicoStatus !== 'concluido' && (
              <Button 
                size="sm" 
                variant={servicoStatus === 'pausado' || servicoStatus === 'em_andamento' ? "default" : "outline"}
                onClick={handleConcluirClick}
                className="flex-1"
                disabled={isDisabled || !temPermissao}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Concluir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para atribuir funcionário */}
      <AtribuirFuncionarioDialog 
        isOpen={isAtribuirDialogOpen}
        onOpenChange={setIsAtribuirDialogOpen}
        funcionariosOptions={funcionariosElegiveis}
        funcionarioAtual={lastSavedResponsavelId ? { id: lastSavedResponsavelId, nome: lastSavedResponsavelNome || "" } : undefined}
        onFuncionarioChange={handleFuncionarioChange}
        onConfirm={handleConfirmFuncionario}
        dialogAction={dialogAction}
      />
    </>
  );
}
