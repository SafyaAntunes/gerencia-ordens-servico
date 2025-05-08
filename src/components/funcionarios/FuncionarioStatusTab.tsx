
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
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FuncionarioStatus } from "@/hooks/useFuncionariosDisponibilidade";
import { format, formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, CheckCircle } from "lucide-react";

interface FuncionarioStatusTabProps {
  funcionariosStatus: FuncionarioStatus[];
  loading: boolean;
}

export default function FuncionarioStatusTab({ funcionariosStatus, loading }: FuncionarioStatusTabProps) {
  const [statusFilter, setStatusFilter] = useState<"todos" | "disponivel" | "ocupado">("todos");
  const { toast } = useToast();
  
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Status em Tempo Real</h2>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "todos" | "disponivel" | "ocupado")}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="disponivel">Disponíveis</SelectItem>
            <SelectItem value="ocupado">Ocupados</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredFuncionarios.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum funcionário encontrado com esse filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFuncionarios.map((funcionario) => (
            <Card 
              key={funcionario.id}
              className={
                funcionario.status === "disponivel" 
                  ? "border-green-200 dark:border-green-900" 
                  : "border-amber-200 dark:border-amber-900"
              }
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      {funcionario.foto ? (
                        <AvatarImage src={funcionario.foto} alt={funcionario.nome} />
                      ) : (
                        <AvatarFallback>
                          {funcionario.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{funcionario.nome}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {funcionario.especialidades.length > 0 
                          ? funcionario.especialidades.join(", ") 
                          : "Sem especialidades"}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={funcionario.status === "disponivel" ? "outline" : "secondary"}
                    className={
                      funcionario.status === "disponivel" 
                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200" 
                        : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200"
                    }
                  >
                    {funcionario.status === "disponivel" ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Disponível</>
                    ) : (
                      <><Clock className="h-3 w-3 mr-1" /> Ocupado</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {funcionario.status === "ocupado" && funcionario.atividadeAtual && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md text-sm">
                    <p><strong>OS:</strong> {funcionario.atividadeAtual.ordemNome}</p>
                    <p><strong>Etapa:</strong> {formatEtapa(funcionario.atividadeAtual.etapa)}
                      {funcionario.atividadeAtual.servicoTipo && (
                        <> - {formatServicoTipo(funcionario.atividadeAtual.servicoTipo)}</>
                      )}
                    </p>
                    <p><strong>Início:</strong> {formatTempoAtividade(funcionario.atividadeAtual.inicio)}</p>
                  </div>
                )}
                
                {funcionario.status === "disponivel" && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-md text-sm">
                    <p>Disponível para novos serviços</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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

function formatTempoAtividade(data: Date): string {
  if (!data) return 'Sem registro de início';
  
  try {
    return formatDistance(new Date(data), new Date(), { 
      addSuffix: true,
      locale: ptBR 
    });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return 'Data inválida';
  }
}
