import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico, StatusOS, EtapaOS } from "@/types/ordens";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClienteMotorInfo } from "./ClienteMotorInfo";
import { useEffect, useState } from "react";
import { Check, Activity } from "lucide-react"; // Import icon for "Autorizado" status

interface OrderDetailsTabProps {
  ordem: OrdemServico;
  onStatusChange: (status: StatusOS) => void;
}

export function OrderDetailsTab({ ordem, onStatusChange }: OrderDetailsTabProps) {
  const [temposPorEtapa, setTemposPorEtapa] = useState<Record<string, number>>({});
  const [tempoTotal, setTempoTotal] = useState<number>(0);

  useEffect(() => {
    if (ordem) {
      calcularTemposPorEtapa(ordem);
    }
  }, [ordem]);

  const calcularTemposPorEtapa = (ordem: OrdemServico) => {
    const tempos: Record<string, number> = {};
    let total = 0;
    
    // Todos os serviços agora têm subatividades com tempos estimados
    ordem.servicos.forEach(servico => {
      if (servico.subatividades) {
        servico.subatividades
          .filter(sub => sub.selecionada)
          .forEach(sub => {
            if (sub.tempoEstimado && typeof sub.tempoEstimado === 'number') {
              const tempoEstimadoMs = sub.tempoEstimado * 60 * 60 * 1000; // horas para ms
              
              // Atribuir ao tipo de serviço correto
              tempos[servico.tipo] = (tempos[servico.tipo] || 0) + tempoEstimadoMs;
              
              total += tempoEstimadoMs;
            }
          });
      }
    });
    
    // Usar o tempo total estimado armazenado se disponível
    if (ordem.tempoTotalEstimado && typeof ordem.tempoTotalEstimado === 'number' && ordem.tempoTotalEstimado > 0) {
      total = ordem.tempoTotalEstimado;
    }
    
    setTemposPorEtapa(tempos);
    setTempoTotal(total);
  };

  const statusLabels: Record<StatusOS, string> = {
    desmontagem: "Desmontagem",
    inspecao_inicial: "Inspeção Inicial",
    orcamento: "Orçamento",
    aguardando_aprovacao: "Aguardando Aprovação",
    autorizado: "Autorizado",
    executando_servico: "Executando Serviço",
    aguardando_peca_cliente: "Aguardando Peça (Cliente)",
    aguardando_peca_interno: "Aguardando Peça (Interno)",
    finalizado: "Finalizado",
    entregue: "Entregue",
    fabricacao: "Executando Serviço" // Added the missing fabricacao status with same label as executando_servico
  };

  const etapasNomes: Record<string, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    inspecao_final: "Inspeção Final",
    bloco: "Bloco", 
    biela: "Biela",
    cabecote: "Cabeçote",
    virabrequim: "Virabrequim",
    eixo_comando: "Eixo de Comando"
  };

  const formatarTempo = (ms: number) => {
    if (typeof ms !== 'number' || isNaN(ms)) {
      return "0h";
    }
    const horas = Math.floor(ms / (1000 * 60 * 60));
    const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h${minutos > 0 ? ` ${minutos}m` : ''}`;
  };
  
  // Helper function to safely format dates
  const formatDateSafely = (date: any): string => {
    if (!date) return "Data não definida";
    
    try {
      // Handle string dates
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Validate the date is valid before formatting
      if (!isValid(dateObj)) return "Data inválida";
      
      return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error, date);
      return "Data inválida";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Ordem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Status atual:</span>
            <Badge variant="outline" className="text-base">
              {statusLabels[ordem.status as StatusOS] || "Não definido"}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Alterar status:</span>
            <Select
              value={ordem.status}
              onValueChange={(value) => onStatusChange(value as StatusOS)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data de Abertura</p>
              <p className="font-medium">
                {formatDateSafely(ordem.dataAbertura)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
              <p className="font-medium">
                {formatDateSafely(ordem.dataPrevistaEntrega)}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Prioridade</p>
            <Badge className={
              ordem.prioridade === 'baixa' ? 'bg-green-500' :
              ordem.prioridade === 'media' ? 'bg-blue-500' :
              ordem.prioridade === 'alta' ? 'bg-orange-500' :
              ordem.prioridade === 'urgente' ? 'bg-red-500' : 'bg-gray-500'
            }>
              {ordem.prioridade === 'baixa' && 'Baixa'}
              {ordem.prioridade === 'media' && 'Média'}
              {ordem.prioridade === 'alta' && 'Alta'}
              {ordem.prioridade === 'urgente' && 'Urgente'}
            </Badge>
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Tempo Total Estimado</p>
            <p className="font-medium text-lg">{formatarTempo(tempoTotal)}</p>
            
            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">Detalhamento por serviço:</p>
              <div className="ml-2 space-y-1">
                {Object.entries(temposPorEtapa).map(([tipo, tempo]) => (
                  tempo > 0 && (
                    <div key={tipo} className="flex justify-between items-center">
                      <span className="text-sm">{etapasNomes[tipo] || tipo}</span>
                      <span className="text-sm font-medium">{formatarTempo(tempo)}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Cliente e Motor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClienteMotorInfo ordem={ordem} />
        </CardContent>
      </Card>
    </div>
  );
}
