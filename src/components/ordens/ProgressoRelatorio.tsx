
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrdemServico, EtapaOS, Servico, SubAtividade } from "@/types/ordens";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";

interface ProgressoRelatorioProps {
  ordem: OrdemServico;
}

export default function ProgressoRelatorio({ ordem }: ProgressoRelatorioProps) {
  const [progressoEtapas, setProgressoEtapas] = useState<{etapa: EtapaOS, nome: string, progresso: number, concluida: boolean}[]>([]);
  const [progressoServicos, setProgressoServicos] = useState<{tipo: string, nome: string, progresso: number, concluido: boolean}[]>([]);
  const [tempoTotal, setTempoTotal] = useState(0);
  const [tempoEstimado, setTempoEstimado] = useState(0);
  const [diasEmAndamento, setDiasEmAndamento] = useState(0);
  
  // Etapas e seus nomes formatados
  const etapasNomes: Record<EtapaOS, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    inspecao_final: "Inspeção Final"
  };
  
  useEffect(() => {
    if (!ordem) return;
    
    calcularProgressoEtapas();
    calcularProgressoServicos();
    calcularTempoTotal();
    calcularTempoEstimado();
    calcularDiasEmAndamento();
  }, [ordem]);
  
  // Calcular progresso das etapas
  const calcularProgressoEtapas = () => {
    const etapas: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    
    const progressos = etapas.map(etapa => {
      const etapaInfo = ordem.etapasAndamento[etapa];
      const concluida = etapaInfo?.concluido || false;
      let progresso = 0;
      
      if (concluida) {
        progresso = 100;
      } else if (etapaInfo && etapaInfo.iniciado) {
        // Se está iniciada mas não concluída, consideramos 50% de progresso
        progresso = 50;
      }
      
      return {
        etapa,
        nome: etapasNomes[etapa],
        progresso,
        concluida
      };
    });
    
    setProgressoEtapas(progressos);
  };
  
  // Calcular progresso dos serviços
  const calcularProgressoServicos = () => {
    const progressos = ordem.servicos.map(servico => {
      let progresso = 0;
      
      if (servico.concluido) {
        progresso = 100;
      } else if (servico.subatividades && servico.subatividades.length > 0) {
        const subatividades = servico.subatividades.filter(sub => sub.selecionada);
        if (subatividades.length > 0) {
          const subConcluidas = subatividades.filter(sub => sub.concluida).length;
          progresso = Math.round((subConcluidas / subatividades.length) * 100);
        }
      }
      
      return {
        tipo: servico.tipo,
        nome: formatarTipoServico(servico.tipo),
        progresso,
        concluido: servico.concluido
      };
    });
    
    setProgressoServicos(progressos);
  };
  
  // Calcular tempo total registrado
  const calcularTempoTotal = () => {
    // Vamos somar o tempo de todas as etapas e serviços
    let total = 0;
    
    // Verificar registros no localStorage para cada serviço
    ordem.servicos.forEach(servico => {
      const storageKey = `timer_${ordem.id}_retifica_${servico.tipo}`;
      const data = localStorage.getItem(storageKey);
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.totalTime) {
            total += parsed.totalTime;
          }
        } catch {
          // Ignorar erro de parsing
        }
      }
    });
    
    // Verificar também os tempos registrados nas etapas
    ordem.tempoRegistros?.forEach(registro => {
      if (registro.inicio && registro.fim) {
        const duracao = new Date(registro.fim).getTime() - new Date(registro.inicio).getTime();
        total += duracao;
      }
    });
    
    setTempoTotal(total);
  };
  
  // Calcular tempo estimado
  const calcularTempoEstimado = () => {
    let total = 0;
    
    // Somar tempos estimados de todas as subatividades selecionadas
    ordem.servicos.forEach(servico => {
      if (servico.subatividades) {
        servico.subatividades
          .filter(sub => sub.selecionada)
          .forEach(sub => {
            if (sub.tempoEstimado) {
              // Converter horas para milissegundos
              total += sub.tempoEstimado * 60 * 60 * 1000;
            }
          });
      }
    });
    
    setTempoEstimado(total);
  };
  
  // Calcular dias em andamento
  const calcularDiasEmAndamento = () => {
    const dataAbertura = new Date(ordem.dataAbertura).getTime();
    const hoje = new Date().getTime();
    const diasTotais = Math.ceil((hoje - dataAbertura) / (1000 * 60 * 60 * 24));
    
    setDiasEmAndamento(diasTotais);
  };
  
  // Função para formatar tipos de serviço
  const formatarTipoServico = (tipo: string): string => {
    return tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ');
  };
  
  // Função para formatar tempo
  const formatarTempo = (ms: number) => {
    const horas = Math.floor(ms / (1000 * 60 * 60));
    const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h${minutos > 0 ? ` ${minutos}m` : ''}`;
  };
  
  // Obter o status da comparação entre tempo estimado e real
  const getStatusTempo = () => {
    if (tempoEstimado === 0) return "neutro";
    
    const diferenca = tempoEstimado - tempoTotal;
    if (Math.abs(diferenca) < tempoEstimado * 0.1) {
      return "neutro"; // Dentro de 10% do estimado
    } else if (diferenca > 0) {
      return "positivo"; // Abaixo do tempo estimado (ganho)
    } else {
      return "negativo"; // Acima do tempo estimado (perda)
    }
  };
  
  // Obter texto e cor baseados no status
  const getStatusInfo = () => {
    const status = getStatusTempo();
    
    if (status === "positivo") {
      return {
        texto: "Abaixo do tempo estimado (ganho de produtividade)",
        cor: "text-green-600",
        icone: <CheckCircle2 className="h-5 w-5 mr-1" />
      };
    } else if (status === "negativo") {
      return {
        texto: "Acima do tempo estimado (perda de produtividade)",
        cor: "text-red-600",
        icone: <XCircle className="h-5 w-5 mr-1" />
      };
    } else {
      return {
        texto: "Dentro do tempo estimado",
        cor: "text-amber-600",
        icone: <Clock className="h-5 w-5 mr-1" />
      };
    }
  };
  
  // Calcular progresso total da ordem
  const calcularProgressoTotal = () => {
    const progressoEtapasMedia = progressoEtapas.reduce((total, etapa) => total + etapa.progresso, 0) / progressoEtapas.length;
    const progressoServicosMedia = progressoServicos.reduce((total, servico) => total + servico.progresso, 0) / progressoServicos.length;
    
    // Média ponderada: etapas têm peso 2, serviços têm peso 1
    return Math.round((progressoEtapasMedia * 2 + progressoServicosMedia * 1) / 3);
  };
  
  const statusInfo = getStatusInfo();
  const progressoTotal = calcularProgressoTotal();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Progresso Geral da OS #{ordem.id.slice(-5)}</CardTitle>
          <CardDescription>
            Ordem aberta há {diasEmAndamento} dias - {format(new Date(ordem.dataAbertura), "dd/MM/yyyy", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso Total</span>
              <span className="text-sm font-medium">{progressoTotal}%</span>
            </div>
            <Progress value={progressoTotal} className="h-3" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-muted-foreground">Tempo Total Registrado</p>
              <p className="text-2xl font-bold">{formatarTempo(tempoTotal)}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-muted-foreground">Tempo Estimado</p>
              <p className="text-2xl font-bold">{formatarTempo(tempoEstimado)}</p>
            </div>
            <div className={`bg-muted/50 p-4 rounded-lg ${statusInfo.cor}`}>
              <p className="text-muted-foreground">Status de Tempo</p>
              <div className="flex items-center text-xl font-bold">
                {statusInfo.icone}
                {tempoEstimado === 0 ? "Sem estimativa" : (
                  Math.abs(tempoEstimado - tempoTotal) < 1000 * 60 * 30 ? "No tempo" : formatarTempo(Math.abs(tempoEstimado - tempoTotal))
                )}
              </div>
              <p className="text-xs">{statusInfo.texto}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progresso por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressoEtapas.map((etapa) => (
                <div key={etapa.etapa}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <span className="font-medium">{etapa.nome}</span>
                      {etapa.concluida && (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                          Concluída
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium">{etapa.progresso}%</span>
                  </div>
                  <Progress value={etapa.progresso} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Progresso por Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressoServicos.map((servico) => (
                <div key={servico.tipo}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <span className="font-medium">{servico.nome}</span>
                      {servico.concluido && (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                          Concluído
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium">{servico.progresso}%</span>
                  </div>
                  <Progress value={servico.progresso} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
