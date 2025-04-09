
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdemServico, EtapaOS, PausaRegistro } from "@/types/ordens";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PausaRelatorioProps {
  ordem: OrdemServico;
}

export default function PausaRelatorio({ ordem }: PausaRelatorioProps) {
  const [activeTab, setActiveTab] = useState<string>("etapas");
  const [pausasPorEtapa, setPausasPorEtapa] = useState<{etapa: EtapaOS, pausas: PausaRegistro[]}[]>([]);
  const [servicosComPausas, setServicosComPausas] = useState<{servico: string, pausas: PausaRegistro[]}[]>([]);
  const [totalPausas, setTotalPausas] = useState(0);
  const [pausasEmAndamento, setPausasEmAndamento] = useState(0);
  const [tempoTotalEmPausa, setTempoTotalEmPausa] = useState(0);
  const [pausasPorMotivo, setPausasPorMotivo] = useState<Record<string, { count: number, tempo: number }>>({});
  
  // Labels para as etapas
  const etapasLabels: Record<EtapaOS, string> = {
    lavagem: "Lavagem",
    inspecao_inicial: "Inspeção Inicial",
    retifica: "Retífica",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    inspecao_final: "Inspeção Final"
  };
  
  useEffect(() => {
    // Carregar e processar as pausas quando a ordem mudar
    carregarPausas();
  }, [ordem]);
  
  const carregarPausas = () => {
    // Filtrar pausas por etapas
    const etapasPausas = Object.entries(ordem.etapasAndamento || {})
      .filter(([_, info]) => info?.pausas && info.pausas.length > 0)
      .map(([etapaKey, info]) => ({
        etapa: etapaKey as EtapaOS,
        pausas: info.pausas || []
      }));
    
    setPausasPorEtapa(etapasPausas);
    
    // Filtrar pausas por serviços (obtidas do localStorage)
    const servicosPausas = ordem.servicos
      .filter(servico => {
        // Verifique se há pausas registradas no localStorage para este serviço
        const storageKey = `timer_${ordem.id}_retifica_${servico.tipo}`;
        const data = localStorage.getItem(storageKey);
        if (!data) return false;
        
        try {
          const parsed = JSON.parse(data);
          return parsed.pausas && parsed.pausas.length > 0;
        } catch {
          return false;
        }
      })
      .map(servico => {
        // Obtenha as pausas do localStorage
        const storageKey = `timer_${ordem.id}_retifica_${servico.tipo}`;
        const data = localStorage.getItem(storageKey);
        let pausas: PausaRegistro[] = [];
        
        if (data) {
          try {
            const parsed = JSON.parse(data);
            pausas = parsed.pausas || [];
          } catch {
            // Ignorar erro de parsing
          }
        }
        
        return {
          servico: servico.tipo,
          pausas
        };
      });
    
    setServicosComPausas(servicosPausas);
    
    // Contadores para o resumo
    const totalPausasCount = etapasPausas.reduce((acc, item) => acc + item.pausas.length, 0) + 
                           servicosPausas.reduce((acc, item) => acc + item.pausas.length, 0);
    
    setTotalPausas(totalPausasCount);
    
    const emAndamento = etapasPausas.reduce((acc, item) => 
      acc + item.pausas.filter(p => !p.fim).length, 0) + 
      servicosPausas.reduce((acc, item) => 
      acc + item.pausas.filter(p => !p.fim).length, 0);
    
    setPausasEmAndamento(emAndamento);
    
    // Calcular tempo total em pausa (apenas pausas finalizadas)
    const todasAsPausas = [
      ...etapasPausas.flatMap(item => item.pausas),
      ...servicosPausas.flatMap(item => item.pausas)
    ];
    
    const tempoTotal = todasAsPausas
      .filter(pausa => pausa.fim)
      .reduce((acc, pausa) => acc + ((pausa.fim || 0) - pausa.inicio), 0);
    
    setTempoTotalEmPausa(tempoTotal);
    
    // Agrupar pausas por motivo para estatísticas
    const porMotivo = todasAsPausas.reduce((acc, pausa) => {
      const motivo = pausa.motivo || "Sem motivo";
      if (!acc[motivo]) {
        acc[motivo] = { count: 0, tempo: 0 };
      }
      acc[motivo].count += 1;
      if (pausa.fim) {
        acc[motivo].tempo += (pausa.fim - pausa.inicio);
      }
      return acc;
    }, {} as Record<string, { count: number, tempo: number }>);
    
    setPausasPorMotivo(porMotivo);
  };
  
  // Funções para formatar tempo
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="etapas" className="flex-1">Por Etapas</TabsTrigger>
          <TabsTrigger value="servicos" className="flex-1">Por Serviços</TabsTrigger>
        </TabsList>
        
        <TabsContent value="etapas">
          {pausasPorEtapa.length > 0 ? (
            <div className="space-y-6">
              {pausasPorEtapa.map(({ etapa, pausas }) => (
                <Card key={etapa}>
                  <CardHeader>
                    <CardTitle>{etapasLabels[etapa]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pausas.map((pausa, idx) => (
                        <div key={idx} className="bg-muted/30 p-4 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <div>
                              <p className="font-medium">
                                {formatarData(pausa.inicio)} - {formatarHora(pausa.inicio)}
                                {pausa.fim ? ` até ${formatarHora(pausa.fim)}` : " (em andamento)"}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">
                                Duração: {calcularDuracao(pausa.inicio, pausa.fim)}
                              </p>
                            </div>
                          </div>
                          {pausa.motivo && (
                            <p className="text-muted-foreground">Motivo: {pausa.motivo}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Não há registros de pausas em etapas.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="servicos">
          {servicosComPausas.length > 0 ? (
            <div className="space-y-6">
              {servicosComPausas.map(({ servico, pausas }) => (
                <Card key={servico}>
                  <CardHeader>
                    <CardTitle>{servico.charAt(0).toUpperCase() + servico.slice(1).replace('_', ' ')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pausas.map((pausa, idx) => (
                        <div key={idx} className="bg-muted/30 p-4 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <div>
                              <p className="font-medium">
                                {formatarData(pausa.inicio)} - {formatarHora(pausa.inicio)}
                                {pausa.fim ? ` até ${formatarHora(pausa.fim)}` : " (em andamento)"}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">
                                Duração: {calcularDuracao(pausa.inicio, pausa.fim)}
                              </p>
                            </div>
                          </div>
                          {pausa.motivo && (
                            <p className="text-muted-foreground">Motivo: {pausa.motivo}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Não há registros de pausas em serviços.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
