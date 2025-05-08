
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFuncionariosMetricas, FuncionarioMetrica } from "@/hooks/useFuncionariosMetricas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { tipoServicoLabels } from "@/types/funcionarios";
import { TipoServico } from "@/types/ordens";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Users } from "lucide-react";

export default function FuncionarioProdutividadeTab() {
  const [periodoInicio, setPeriodoInicio] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30)) // Últimos 30 dias
  );
  const [periodoFim, setPeriodoFim] = useState<Date | undefined>(new Date());
  
  const { metricas, orderedByProductivity, orderedBySpeed, loading, error } = useFuncionariosMetricas({ 
    periodoInicio, 
    periodoFim 
  });
  
  const handleResetPeriodo = () => {
    setPeriodoInicio(new Date(new Date().setDate(new Date().getDate() - 30)));
    setPeriodoFim(new Date());
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <h2 className="text-xl font-bold">Produtividade Individual</h2>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex gap-2 items-center">
                <CalendarIcon className="h-4 w-4" />
                {periodoInicio && periodoFim ? (
                  <>
                    {format(periodoInicio, "dd/MM/yyyy", { locale: ptBR })} - {format(periodoFim, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  <>Selecionar período</>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="grid gap-2 p-4">
                <div className="grid">
                  <div className="mb-2 font-medium">Data Inicial</div>
                  <Calendar
                    mode="single"
                    selected={periodoInicio}
                    onSelect={setPeriodoInicio}
                    initialFocus
                  />
                </div>
                <div className="grid">
                  <div className="mb-2 font-medium">Data Final</div>
                  <Calendar
                    mode="single"
                    selected={periodoFim}
                    onSelect={setPeriodoFim}
                    disabled={(date) => 
                      periodoInicio ? date < periodoInicio : false
                    }
                    initialFocus
                  />
                </div>
                <Button onClick={handleResetPeriodo} variant="outline" size="sm">
                  Últimos 30 dias
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs defaultValue="produtividade" className="space-y-4">
        <TabsList>
          <TabsTrigger value="produtividade" className="gap-2">
            <Users className="h-4 w-4" /> Produtividade
          </TabsTrigger>
          <TabsTrigger value="tempo" className="gap-2">
            <Clock className="h-4 w-4" /> Tempo Médio
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="produtividade" className="space-y-4">
          {orderedByProductivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Não há dados de produtividade disponíveis para o período selecionado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orderedByProductivity.map((funcionario) => (
                <FuncionarioMetricaCard 
                  key={funcionario.funcionarioId}
                  funcionario={funcionario}
                  metricaTipo="produtividade"
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="tempo" className="space-y-4">
          {orderedBySpeed.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Não há dados de tempo médio disponíveis para o período selecionado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orderedBySpeed.map((funcionario) => (
                <FuncionarioMetricaCard 
                  key={funcionario.funcionarioId}
                  funcionario={funcionario}
                  metricaTipo="tempo"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface FuncionarioMetricaCardProps {
  funcionario: FuncionarioMetrica;
  metricaTipo: 'produtividade' | 'tempo';
}

function FuncionarioMetricaCard({ funcionario, metricaTipo }: FuncionarioMetricaCardProps) {
  return (
    <Card className={funcionario.ordensConcluidas === 0 ? 'opacity-60' : ''}>
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
              <CardDescription className="text-xs">
                {funcionario.especialidades.length > 0 
                  ? funcionario.especialidades.map((esp) => tipoServicoLabels[esp as TipoServico] || esp).join(", ")
                  : "Sem especialidades"}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 border-blue-200">
            {funcionario.ordensConcluidas} OS{funcionario.ordensConcluidas !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {metricaTipo === 'produtividade' ? (
            <div>
              <div className="text-sm font-medium">OS's Concluídas</div>
              <div className="text-2xl font-bold">
                {funcionario.ordensConcluidas}
              </div>
              {funcionario.ordensConcluidas > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Tempo médio por OS: {funcionario.tempoMedio}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium">Tempo médio por OS</div>
              {funcionario.ordensConcluidas > 0 ? (
                <>
                  <div className="text-lg font-bold">
                    {funcionario.tempoMedio}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Total de OS's concluídas: {funcionario.ordensConcluidas}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Sem dados de tempo</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
