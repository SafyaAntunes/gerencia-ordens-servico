
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FuncionarioStatus } from '@/hooks/useFuncionariosDisponibilidade';
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, CheckCircle, CircleX, Clock3, RefreshCw } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { forcarLiberacaoFuncionario } from "@/services/funcionarioEmServicoService";
import { toast } from "sonner";
import { FuncionariosDisponibilidadeTable } from "./FuncionariosDisponibilidadeTable";

interface FuncionarioStatusTabProps {
  funcionariosStatus: FuncionarioStatus[];
  loading: boolean;
}

export default function FuncionarioStatusTab({ funcionariosStatus, loading }: FuncionarioStatusTabProps) {
  const [statusFilter, setStatusFilter] = useState<"todos" | "disponivel" | "ocupado" | "inativo">("todos");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [funcionarioParaLiberar, setFuncionarioParaLiberar] = useState<string | null>(null);
  const [isLiberando, setIsLiberando] = useState(false);
  
  const handleLiberarFuncionario = async () => {
    if (!funcionarioParaLiberar) return;
    
    setIsLiberando(true);
    try {
      const success = await forcarLiberacaoFuncionario(funcionarioParaLiberar);
      if (success) {
        setFuncionarioParaLiberar(null);
      }
    } finally {
      setIsLiberando(false);
    }
  };
  
  const filteredFuncionarios = funcionariosStatus.filter(f => {
    if (statusFilter === "todos") return true;
    return f.status === statusFilter;
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-xl font-bold">Status em Tempo Real</h2>
        
        <div className="flex gap-3 items-center">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "todos" | "disponivel" | "ocupado" | "inativo")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="disponivel">Disponíveis</SelectItem>
              <SelectItem value="ocupado">Em serviço</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex rounded-md border overflow-hidden">
            <Button 
              variant={viewMode === "cards" ? "default" : "ghost"} 
              className={`rounded-none ${viewMode === "cards" ? "" : "text-muted-foreground"}`}
              onClick={() => setViewMode("cards")}
              size="sm"
            >
              Cards
            </Button>
            <Button 
              variant={viewMode === "table" ? "default" : "ghost"} 
              className={`rounded-none ${viewMode === "table" ? "" : "text-muted-foreground"}`}
              onClick={() => setViewMode("table")}
              size="sm"
            >
              Tabela
            </Button>
          </div>
        </div>
      </div>
      
      {viewMode === "table" ? (
        <FuncionariosDisponibilidadeTable />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {filteredFuncionarios.map(funcionario => (
            <Card key={funcionario.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10">
                        {funcionario.nome.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-base">{funcionario.nome}</CardTitle>
                  </div>
                  
                  {funcionario.status === 'disponivel' ? (
                    <Badge variant="success" className="flex gap-1 items-center">
                      <CheckCircle className="h-3.5 w-3.5" /> 
                      Disponível
                    </Badge>
                  ) : funcionario.status === 'ocupado' ? (
                    <Badge variant="warning" className="flex gap-1 items-center">
                      <Clock className="h-3.5 w-3.5" /> 
                      Ocupado
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex gap-1 items-center">
                      <CircleX className="h-3.5 w-3.5" /> 
                      Inativo
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {funcionario.status === 'ocupado' && funcionario.atividadeAtual ? (
                  <div className="text-sm space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Ordem:</span>
                      <span className="font-medium text-foreground">{funcionario.atividadeAtual.ordemNome}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Etapa:</span>
                      <span className="font-medium text-foreground">
                        {formatEtapa(funcionario.atividadeAtual.etapa)}
                        {funcionario.atividadeAtual.servicoTipo ? 
                          ` - ${formatServicoTipo(funcionario.atividadeAtual.servicoTipo)}` : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Tempo:</span>
                      <span className="flex items-center">
                        <Clock3 className="h-3.5 w-3.5 mr-1 text-amber-500" /> 
                        {formatTempoAtividade(funcionario.atividadeAtual.inicio)}
                      </span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => setFuncionarioParaLiberar(funcionario.id)}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                      Forçar liberação
                    </Button>
                  </div>
                ) : funcionario.status === 'inativo' ? (
                  <div className="text-sm text-center text-muted-foreground py-3">
                    Funcionário está marcado como inativo no sistema
                  </div>
                ) : (
                  <div className="text-sm text-center text-muted-foreground py-3">
                    Funcionário disponível para atribuição
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {filteredFuncionarios.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-10 text-center">
              <div className="text-muted-foreground">
                <CircleX className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Nenhum funcionário encontrado com o filtro selecionado</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Dialog para confirmar liberação de funcionário */}
      <AlertDialog 
        open={!!funcionarioParaLiberar} 
        onOpenChange={(open) => !open && setFuncionarioParaLiberar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Liberar funcionário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja forçar a liberação deste funcionário?
              Esta ação vai encerrar qualquer atividade em andamento atribuída a ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLiberando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLiberarFuncionario}
              disabled={isLiberando}
              className={isLiberando ? "opacity-50" : ""}
            >
              {isLiberando ? "Liberando..." : "Sim, liberar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helpers para formatação
function formatEtapa(etapa: string): string {
  const etapasMap: Record<string, string> = {
    'lavagem': 'Lavagem',
    'inspecao_inicial': 'Inspeção Inicial',
    'retifica': 'Retífica',
    'montagem': 'Montagem',
    'dinamometro': 'Dinamômetro',
    'inspecao_final': 'Inspeção Final'
  };
  
  return etapasMap[etapa] || etapa;
}

function formatServicoTipo(tipo: string): string {
  const tiposMap: Record<string, string> = {
    'bloco': 'Bloco',
    'biela': 'Biela',
    'cabecote': 'Cabeçote',
    'virabrequim': 'Virabrequim',
    'eixo_comando': 'Eixo de Comando',
    'montagem': 'Montagem',
    'dinamometro': 'Dinamômetro',
    'lavagem': 'Lavagem'
  };
  
  return tiposMap[tipo] || tipo;
}

function formatTempoAtividade(data: Date | undefined | null): string {
  if (!data) return 'Sem registro de início';
  
  try {
    const dataInicio = new Date(data);
    return formatDistance(
      dataInicio,
      new Date(),
      { addSuffix: false, locale: ptBR }
    );
  } catch (error) {
    console.error("Erro ao formatar data de início:", error);
    return 'Erro na data';
  }
}
