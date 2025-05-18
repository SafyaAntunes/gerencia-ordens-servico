import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Servico } from "@/types/ordens";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFuncionariosDisponibilidade } from "@/hooks/useFuncionariosDisponibilidade";
import { liberarFuncionarioDeServico, marcarFuncionarioEmServico } from "@/services/funcionarioEmServicoService";
import { formatDateSafely } from "@/utils/dateUtils";

interface ServicoControlProps {
  servico: Servico;
  ordemId: string;
  isDisabled?: boolean;
  funcionarioId?: string;
  funcionarioNome?: string;
  onStatusChange: (status: 'em_andamento' | 'pausado' | 'concluido', funcionarioId?: string, funcionarioNome?: string) => void;
}

export function ServicoControl({
  servico,
  ordemId,
  isDisabled = false,
  funcionarioId = '',
  funcionarioNome = '',
  onStatusChange
}: ServicoControlProps) {
  const { canEditOrder } = useAuth();
  const { funcionariosStatus, funcionariosDisponiveis } = useFuncionariosDisponibilidade();
  const [responsavelId, setResponsavelId] = useState(servico.funcionarioId || funcionarioId);
  const [isLoading, setIsLoading] = useState(false);
  
  const temPermissao = canEditOrder(ordemId);
  
  // Usar o status do serviço ou "nao_iniciado" se não estiver definido
  const servicoStatus = servico.concluido 
    ? 'concluido' 
    : servico.status || 'nao_iniciado';

  // Filtrar apenas os funcionários disponíveis + o funcionário já atribuído a este serviço específico
  const funcionariosOptions = funcionariosStatus.filter(funcionario => {
    // Sempre incluir o funcionário atual do serviço, mesmo que ocupado
    if (funcionario.id === servico.funcionarioId) {
      return true;
    }
    
    // Para outros funcionários, incluir somente os disponíveis e ativos
    return funcionario.status === 'disponivel' && funcionario.ativo !== false;
  });

  // Update responsavelId when servico.funcionarioId changes
  useEffect(() => {
    if (servico.funcionarioId) {
      setResponsavelId(servico.funcionarioId);
    }
  }, [servico.funcionarioId]);

  const handleStatusChange = async (status: 'em_andamento' | 'pausado' | 'concluido') => {
    if (!temPermissao || isDisabled || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Find responsável nome
      const funcionarioSelecionado = funcionariosStatus.find(f => f.id === responsavelId);
      const respNome = funcionarioSelecionado?.nome || funcionarioNome;
      
      // Se o status atual é "em_andamento" e mudou para outro status
      // OU se qualquer status mudou para "concluido", liberar o funcionário
      if (
        (servicoStatus === 'em_andamento' && status !== 'em_andamento') || 
        status === 'concluido'
      ) {
        // Liberar funcionário atual se houver um
        if (servico.funcionarioId) {
          console.log(`Liberando funcionário ${servico.funcionarioId} do serviço`);
          await liberarFuncionarioDeServico(servico.funcionarioId);
        }
      }
      
      // IMPORTANTE: Quando mudamos para "em_andamento", marcar o funcionário como ocupado
      if (status === 'em_andamento' && servicoStatus !== 'em_andamento') {
        // Validar se o funcionário está disponível (a menos que seja o mesmo já atribuído)
        if (responsavelId !== servico.funcionarioId) {
          const funcionario = funcionariosStatus.find(f => f.id === responsavelId);
          if (funcionario && funcionario.status !== 'disponivel') {
            toast.error("Este funcionário já está ocupado em outro serviço");
            setIsLoading(false);
            return;
          }
        }
        
        // Marcar funcionário como ocupado no serviço
        console.log(`Marcando funcionário ${responsavelId} como ocupado na ordem ${ordemId} para o serviço ${servico.tipo}`);
        const marcado = await marcarFuncionarioEmServico(
          responsavelId,
          ordemId,
          'retifica', // Assumindo etapa padrão, modificar se necessário
          servico.tipo
        );
        
        if (!marcado) {
          toast.error("Erro ao marcar funcionário como ocupado");
          setIsLoading(false);
          return;
        }
        
        console.log(`Funcionário ${responsavelId} marcado como ocupado com sucesso`);
      }
      
      onStatusChange(status, responsavelId, respNome);
    } catch (error) {
      console.error("Erro ao mudar status:", error);
      toast.error("Erro ao atualizar status do serviço");
    } finally {
      setIsLoading(false);
    }
  };

  const getServicoStatusBadge = () => {
    if (servico.concluido) {
      return <Badge variant="success">Concluído</Badge>;
    } else if (servicoStatus === 'pausado') {
      return <Badge variant="warning">Pausado</Badge>;
    } else if (servicoStatus === 'em_andamento') {
      return <Badge variant="secondary">Em andamento</Badge>;
    } else {
      return <Badge variant="outline">Não iniciado</Badge>;
    }
  };

  const formatServiceType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Etapa column */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Serviço</h4>
            <div className="p-3 bg-slate-50 rounded-md flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{formatServiceType(servico.tipo)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{servico.descricao || 'Sem descrição'}</p>
              </div>
              <div>{getServicoStatusBadge()}</div>
            </div>
          </div>
          
          {/* Funcionário column */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Funcionário</h4>
            <div className="p-3 bg-slate-50 rounded-md">
              {servico.concluido ? (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Responsável:</span>
                  <span className="text-sm">{servico.funcionarioNome || 'Não atribuído'}</span>
                  {servico.dataConclusao && (
                    <span className="text-xs text-gray-500 mt-1">
                      Concluído em: {formatDateSafely(servico.dataConclusao)}
                    </span>
                  )}
                </div>
              ) : (
                <Select 
                  value={responsavelId} 
                  onValueChange={setResponsavelId}
                  disabled={!temPermissao || isDisabled || isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionariosOptions.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Nenhum funcionário disponível
                      </div>
                    ) : (
                      funcionariosOptions.map((func) => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.nome} {func.status === 'ocupado' && func.id !== servico.funcionarioId ? " (Ocupado)" : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          
          {/* Status column */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Status</h4>
            <div className={cn(
              "grid grid-cols-3 gap-2",
              (!temPermissao || isDisabled) && "opacity-70 pointer-events-none"
            )}>
              <Button 
                variant={servicoStatus === "em_andamento" ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleStatusChange("em_andamento")}
                className={servicoStatus === "em_andamento" ? "bg-blue-500 hover:bg-blue-600" : ""}
                disabled={!temPermissao || isDisabled || isLoading || servico.concluido || !responsavelId}
                title={!responsavelId ? "Selecione um responsável" : ""}
              >
                <Play className="h-4 w-4 mr-1" />
                Em Andamento
              </Button>
              <Button 
                variant={servicoStatus === "pausado" ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleStatusChange("pausado")}
                className={servicoStatus === "pausado" ? "bg-orange-400 hover:bg-orange-500" : ""}
                disabled={!temPermissao || isDisabled || isLoading || servico.concluido || servicoStatus === "nao_iniciado"}
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausado
              </Button>
              <Button 
                variant={servico.concluido ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleStatusChange("concluido")}
                className={servico.concluido ? "bg-green-600 hover:bg-green-700" : ""}
                disabled={!temPermissao || isDisabled || isLoading || servico.concluido || !responsavelId}
                title={!responsavelId ? "Selecione um responsável" : servico.concluido ? "Serviço já concluído" : "Marcar como concluído"}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Concluído
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
