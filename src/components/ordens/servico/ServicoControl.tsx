
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Servico } from "@/types/ordens";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, CheckCircle2 } from "lucide-react";
import { getFuncionarios } from "@/services/funcionarioService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [funcionarios, setFuncionarios] = useState<Array<{id: string, nome: string}>>([]);
  const [responsavelId, setResponsavelId] = useState(servico.funcionarioId || funcionarioId);
  const [isLoading, setIsLoading] = useState(false);
  
  const temPermissao = canEditOrder(ordemId);
  const servicoStatus = servico.concluido ? 'concluido' : servico.status || 'em_andamento';

  // Load funcionarios when the component mounts
  useEffect(() => {
    const loadFuncionarios = async () => {
      try {
        const funcionariosData = await getFuncionarios();
        if (funcionariosData) {
          setFuncionarios(funcionariosData);
        }
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
        toast.error("Não foi possível carregar a lista de funcionários");
      }
    };
    
    loadFuncionarios();
  }, []);

  // Update responsavelId when servico.funcionarioId changes
  useEffect(() => {
    if (servico.funcionarioId) {
      setResponsavelId(servico.funcionarioId);
    }
  }, [servico.funcionarioId]);

  const handleStatusChange = (status: 'em_andamento' | 'pausado' | 'concluido') => {
    if (!temPermissao || isDisabled || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Find responsável nome
      const funcionarioSelecionado = funcionarios.find(f => f.id === responsavelId);
      const respNome = funcionarioSelecionado?.nome || funcionarioNome;
      
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
    } else {
      return <Badge variant="secondary">Em andamento</Badge>;
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
                      Concluído em: {new Date(servico.dataConclusao).toLocaleDateString()}
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
                    {funcionarios.map((func) => (
                      <SelectItem key={func.id} value={func.id}>
                        {func.nome}
                      </SelectItem>
                    ))}
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
                variant={servicoStatus === "em_andamento" && !servico.concluido ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleStatusChange("em_andamento")}
                className={servicoStatus === "em_andamento" && !servico.concluido ? "bg-blue-500 hover:bg-blue-600" : ""}
                disabled={!temPermissao || isDisabled || isLoading || servico.concluido}
              >
                <Play className="h-4 w-4 mr-1" />
                Em Andamento
              </Button>
              <Button 
                variant={servicoStatus === "pausado" && !servico.concluido ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleStatusChange("pausado")}
                className={servicoStatus === "pausado" && !servico.concluido ? "bg-orange-400 hover:bg-orange-500" : ""}
                disabled={!temPermissao || isDisabled || isLoading || servico.concluido}
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
