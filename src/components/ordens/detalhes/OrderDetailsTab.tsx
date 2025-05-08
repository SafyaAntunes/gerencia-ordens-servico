import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico, StatusOS, EtapaOS } from "@/types/ordens";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClienteMotorInfo } from "./ClienteMotorInfo";
import { useEffect, useState } from "react";

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
    
    // 1. Verificar tempos nas etapas gerais e específicas
    Object.entries(ordem.etapasAndamento || {}).forEach(([etapa, dadosEtapa]) => {
      if (dadosEtapa.tempoEstimado) {
        // Extrair a etapa base (lavagem, inspecao_inicial, etc.) de chaves como "inspecao_inicial_bloco"
        const etapaKey = etapa.split('_')[0] === 'inspecao' ? 
          `inspecao_${etapa.split('_')[1]}` : // Para casos como inspecao_inicial ou inspecao_final
          etapa.split('_')[0]; // Para outros casos
        
        const tempoEstimadoMs = dadosEtapa.tempoEstimado * 60 * 60 * 1000; // horas para ms
        
        tempos[etapaKey] = (tempos[etapaKey] || 0) + tempoEstimadoMs;
        total += tempoEstimadoMs;
      }
    });
    
    // 2. Verificar subatividades nos serviços
    ordem.servicos.forEach(servico => {
      if (servico.subatividades) {
        servico.subatividades
          .filter(sub => sub.selecionada)
          .forEach(sub => {
            if (sub.tempoEstimado) {
              const tempoEstimadoMs = sub.tempoEstimado * 60 * 60 * 1000; // horas para ms
              tempos['retifica'] = (tempos['retifica'] || 0) + tempoEstimadoMs;
              total += tempoEstimadoMs;
            }
          });
      }
    });
    
    // 3. Usar o tempo total estimado armazenado se disponível
    if (ordem.tempoTotalEstimado && ordem.tempoTotalEstimado > 0) {
      total = ordem.tempoTotalEstimado;
    }
    
    setTemposPorEtapa(tempos);
    setTempoTotal(total);
  };

  const statusLabels: Record<StatusOS, string> = {
    orcamento: "Orçamento",
    aguardando_aprovacao: "Aguardando Aprovação",
    fabricacao: "Fabricação",
    aguardando_peca_cliente: "Aguardando Peça (Cliente)",
    aguardando_peca_interno: "Aguardando Peça (Interno)",
    finalizado: "Finalizado",
    entregue: "Entregue"
  };

  const etapasNomes: Record<string, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    inspecao_final: "Inspeção Final"
  };

  const formatarTempo = (ms: number) => {
    if (!ms) return "0h";
    const horas = Math.floor(ms / (1000 * 60 * 60));
    const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h${minutos > 0 ? ` ${minutos}m` : ''}`;
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
                {format(new Date(ordem.dataAbertura), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
              <p className="font-medium">
                {format(new Date(ordem.dataPrevistaEntrega), "dd/MM/yyyy", { locale: ptBR })}
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
              <p className="text-sm text-muted-foreground">Detalhamento por etapa:</p>
              <div className="ml-2 space-y-1">
                {Object.entries(temposPorEtapa).map(([etapa, tempo]) => (
                  tempo > 0 && (
                    <div key={etapa} className="flex justify-between items-center">
                      <span className="text-sm">{etapasNomes[etapa] || etapa}</span>
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
