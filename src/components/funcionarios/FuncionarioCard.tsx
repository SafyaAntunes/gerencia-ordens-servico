
import { Phone, Mail, Wrench, Shield, Trash, Edit, Eye, User, Circle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Funcionario, permissoesLabels, tipoServicoLabels } from "@/types/funcionarios";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FuncionarioStatus } from "@/hooks/useFuncionariosDisponibilidade";
import { useState, useEffect } from "react";

interface FuncionarioCardProps {
  funcionario: Funcionario | FuncionarioStatus;
  onView: (funcionario: Funcionario) => void;
  onEdit: (funcionario: Funcionario) => void;
  onDelete: (id: string) => void;
  hideDeleteButton?: boolean;
}

export default function FuncionarioCard({ 
  funcionario, 
  onView, 
  onEdit, 
  onDelete,
  hideDeleteButton = false
}: FuncionarioCardProps) {
  // Verificar se é um FuncionarioStatus (tem propriedades extras)
  const isFuncionarioStatus = 'status' in funcionario && 'statusOrigem' in funcionario;
  const funcionarioStatus = isFuncionarioStatus ? funcionario as FuncionarioStatus : null;
  
  const [status, setStatus] = useState<'idle' | 'working' | 'paused' | 'inactive'>('idle');
  
  useEffect(() => {
    const checkStatus = () => {
      // Se temos dados do FuncionarioStatus, usar eles primeiro
      if (funcionarioStatus) {
        if (funcionarioStatus.status === 'ocupado') {
          setStatus('working');
        } else if (funcionarioStatus.status === 'inativo') {
          setStatus('inactive');
        } else {
          setStatus('idle');
        }
        return;
      }
      
      // Fallback para lógica original baseada em localStorage
      if (funcionario.ativo === false) {
        setStatus('inactive');
        return;
      }
      
      const keys = Object.keys(localStorage);
      const timerKeys = keys.filter(key => key.startsWith('timer_'));
      
      let isWorking = false;
      let isPaused = false;
      
      for (const key of timerKeys) {
        try {
          const timerData = JSON.parse(localStorage.getItem(key) || '{}');
          if (timerData.funcionarioId === funcionario.id) {
            if (timerData.isRunning && !timerData.isPaused) {
              isWorking = true;
              break;
            } else if (timerData.isPaused) {
              isPaused = true;
            }
          }
        } catch {
          // Ignore parsing errors
        }
      }
      
      if (isWorking) setStatus('working');
      else if (isPaused) setStatus('paused');
      else setStatus('idle');
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    
    return () => clearInterval(interval);
  }, [funcionario.id, funcionario.ativo, funcionarioStatus]);
  
  const getStatusColor = () => {
    switch (status) {
      case 'working':
        return 'text-[#ea384c]';
      case 'paused':
        return 'text-amber-400';
      case 'inactive':
        return 'text-gray-400';
      default:
        return 'text-green-500';
    }
  };

  const getStatusText = () => {
    if (funcionarioStatus) {
      switch (funcionarioStatus.status) {
        case 'ocupado':
          return `Ocupado (${funcionarioStatus.statusOrigem === 'statusAtividade' ? 'Sistema' : 'Timer'})`;
        case 'inativo':
          return 'Inativo';
        default:
          return 'Disponível';
      }
    }
    
    switch (status) {
      case 'working':
        return 'Trabalhando';
      case 'paused':
        return 'Em Pausa';
      case 'inactive':
        return 'Inativo';
      default:
        return 'Disponível';
    }
  };

  // Extract initials for the avatar
  const iniciais = funcionario.nome
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
    
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md border-border h-full flex flex-col ${funcionario.ativo === false ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium">
              {iniciais}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Circle className={`absolute -bottom-1 -right-1 h-4 w-4 ${getStatusColor()} fill-current cursor-help`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getStatusText()}</p>
                  {funcionarioStatus?.atividadeAtual && (
                    <div className="text-xs mt-1">
                      <div>OS: {funcionarioStatus.atividadeAtual.ordemNome}</div>
                      <div>Etapa: {funcionarioStatus.atividadeAtual.etapa}</div>
                      {funcionarioStatus.atividadeAtual.servicoTipo && (
                        <div>Serviço: {funcionarioStatus.atividadeAtual.servicoTipo}</div>
                      )}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {funcionarioStatus?.statusOrigem === 'statusAtividade' && funcionarioStatus?.status === 'ocupado' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="absolute -top-1 -left-1 h-3 w-3 text-blue-500 fill-current" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Status definido pelo sistema de atribuição</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">{funcionario.nome}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              {permissoesLabels[funcionario.nivelPermissao || 'visualizacao']}
            </div>
            {funcionario.nomeUsuario && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <User className="h-3.5 w-3.5" />
                {funcionario.nomeUsuario}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 flex-1">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{funcionario.telefone || "Não informado"}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{funcionario.email || "Não informado"}</span>
          </div>
        
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Especialidades</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {funcionario.especialidades && funcionario.especialidades.length > 0 ? (
                funcionario.especialidades.map((especialidade) => (
                  <Badge 
                    key={especialidade}
                    variant="secondary"
                    className="text-xs"
                  >
                    {tipoServicoLabels[especialidade as keyof typeof tipoServicoLabels] || especialidade}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Nenhuma especialidade</span>
              )}
            </div>
          </div>
          
          {funcionarioStatus?.atividadeAtual && (
            <div className="bg-blue-50 p-2 rounded-md border">
              <div className="text-xs font-medium text-blue-800 mb-1">Atividade Atual:</div>
              <div className="text-xs text-blue-700">
                <div>OS: {funcionarioStatus.atividadeAtual.ordemNome}</div>
                <div>Etapa: {funcionarioStatus.atividadeAtual.etapa}</div>
                {funcionarioStatus.atividadeAtual.servicoTipo && (
                  <div>Serviço: {funcionarioStatus.atividadeAtual.servicoTipo}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-3 flex justify-between">
        <Badge
          className={funcionario.ativo 
            ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800" 
            : "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800"}
        >
          {funcionario.ativo ? "Ativo" : "Inativo"}
        </Badge>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(funcionario)}>
            <Edit className="h-4 w-4" />
          </Button>
          
          {!hideDeleteButton && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(funcionario.id)}>
              <Trash className="h-4 w-4 text-destructive" />
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={() => onView(funcionario)}>
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
