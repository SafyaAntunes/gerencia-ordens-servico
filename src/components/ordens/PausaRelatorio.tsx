
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdemServico, EtapaOS, PausaRegistro } from "@/types/ordens";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PausaRelatorioProps {
  ordem: OrdemServico;
}

export default function PausaRelatorio({ ordem }: PausaRelatorioProps) {
  const [todasPausas, setTodasPausas] = useState<{pausa: PausaRegistro, origem: string}[]>([]);
  const [totalPausas, setTotalPausas] = useState(0);
  const [pausasEmAndamento, setPausasEmAndamento] = useState(0);
  const [tempoTotalEmPausa, setTempoTotalEmPausa] = useState(0);
  const [pausasPorMotivo, setPausasPorMotivo] = useState<Record<string, { count: number, tempo: number }>>({});
  
  useEffect(() => {
    // Carregar e processar as pausas quando a ordem mudar
    carregarPausas();
  }, [ordem]);
  
  const carregarPausas = () => {
    // Array para armazenar todas as pausas com origem
    let pausasAgregadas: {pausa: PausaRegistro, origem: string}[] = [];
    
    // Obter pausas das etapas
    Object.entries(ordem.etapasAndamento || {}).forEach(([etapaKey, info]) => {
      if (info?.pausas && info.pausas.length > 0) {
        const etapa = etapaKey as EtapaOS;
        info.pausas.forEach(pausa => {
          pausasAgregadas.push({
            pausa,
            origem: `Etapa: ${formatarEtapa(etapa)}`
          });
        });
      }
    });
    
    // Obter pausas dos serviços (do localStorage)
    ordem.servicos.forEach(servico => {
      const storageKey = `timer_${ordem.id}_retifica_${servico.tipo}`;
      const data = localStorage.getItem(storageKey);
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.pausas && parsed.pausas.length > 0) {
            parsed.pausas.forEach((pausa: PausaRegistro) => {
              pausasAgregadas.push({
                pausa,
                origem: `Serviço: ${formatarTipoServico(servico.tipo)}`
              });
            });
          }
        } catch {
          // Ignorar erro de parsing
        }
      }
    });
    
    // Ordenar pausas por data (mais recentes primeiro)
    pausasAgregadas.sort((a, b) => b.pausa.inicio - a.pausa.inicio);
    
    setTodasPausas(pausasAgregadas);
    setTotalPausas(pausasAgregadas.length);
    
    // Contar pausas em andamento
    const emAndamento = pausasAgregadas.filter(item => !item.pausa.fim).length;
    setPausasEmAndamento(emAndamento);
    
    // Calcular tempo total em pausa (apenas pausas finalizadas)
    const tempoTotal = pausasAgregadas
      .filter(item => item.pausa.fim)
      .reduce((acc, item) => acc + ((item.pausa.fim || 0) - item.pausa.inicio), 0);
    
    setTempoTotalEmPausa(tempoTotal);
    
    // Agrupar pausas por motivo para estatísticas
    const porMotivo = pausasAgregadas.reduce((acc, item) => {
      const motivo = item.pausa.motivo || "Sem motivo";
      if (!acc[motivo]) {
        acc[motivo] = { count: 0, tempo: 0 };
      }
      acc[motivo].count += 1;
      if (item.pausa.fim) {
        acc[motivo].tempo += (item.pausa.fim - item.pausa.inicio);
      }
      return acc;
    }, {} as Record<string, { count: number, tempo: number }>);
    
    setPausasPorMotivo(porMotivo);
  };
  
  // Funções para formatar tempo e dados
  const formatarHora = (timestamp: number) => {
    return format(new Date(timestamp), "HH:mm:ss", { locale: ptBR });
  };
  
  const formatarData = (timestamp: number) => {
    return format(new Date(timestamp), "dd/MM/yyyy", { locale: ptBR });
  };
  
  const calcularDuracao = (inicio: number, fim?: number) => {
    if (!fim) return "Em andamento";
    
    const duracaoMs = fim - inicio;
    const segundos = Math.floor((duracaoMs / 1000) % 60);
    const minutos = Math.floor((duracaoMs / (1000 * 60)) % 60);
    const horas = Math.floor(duracaoMs / (1000 * 60 * 60));
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };
  
  const formatarTempoTotal = (ms: number) => {
    const segundos = Math.floor((ms / 1000) % 60);
    const minutos = Math.floor((ms / (1000 * 60)) % 60);
    const horas = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    return dias > 0 
      ? `${dias}d ${horas}h ${minutos}m ${segundos}s`
      : `${horas}h ${minutos}m ${segundos}s`;
  };
  
  const formatarEtapa = (etapa: EtapaOS): string => {
    const labels: Record<EtapaOS, string> = {
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      retifica: "Retífica",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_final: "Inspeção Final"
    };
    return labels[etapa] || etapa;
  };
  
  const formatarTipoServico = (tipo: string): string => {
    return tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ');
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Pausas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-muted-foreground">Total de Pausas</p>
            <p className="text-3xl font-bold">{totalPausas}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-muted-foreground">Pausas em Andamento</p>
            <p className="text-3xl font-bold">{pausasEmAndamento}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-muted-foreground">Tempo Total em Pausa</p>
            <p className="text-3xl font-bold">{formatarTempoTotal(tempoTotalEmPausa)}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Motivos de Pausa</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(pausasPorMotivo).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(pausasPorMotivo).map(([motivo, stats]) => (
                <div key={motivo} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{motivo}</p>
                    <p className="text-sm text-muted-foreground">{stats.count} pausa(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatarTempoTotal(stats.tempo)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhum motivo de pausa registrado.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pausas</CardTitle>
        </CardHeader>
        <CardContent>
          {todasPausas.length > 0 ? (
            <div className="space-y-4">
              {todasPausas.map((item, idx) => (
                <div key={idx} className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        {formatarData(item.pausa.inicio)} - {formatarHora(item.pausa.inicio)}
                        {item.pausa.fim ? ` até ${formatarHora(item.pausa.fim)}` : " (em andamento)"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">
                        Duração: {calcularDuracao(item.pausa.inicio, item.pausa.fim)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">{item.origem}</p>
                    {item.pausa.motivo && (
                      <p className="text-sm font-medium">Motivo: {item.pausa.motivo}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Não há registros de pausas.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
