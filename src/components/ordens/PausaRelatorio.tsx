import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdemServico, EtapaOS, PausaRegistro } from "@/types/ordens";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "lucide-react";
import { generateTimerStorageKey } from "@/utils/timerUtils";

interface PausaRelatorioProps {
  ordem: OrdemServico;
}

export default function PausaRelatorio({ ordem }: PausaRelatorioProps) {
  const [todasPausas, setTodasPausas] = useState<(PausaRegistro & { 
    etapa?: string; 
    servico?: string;
    funcionarioNome?: string;
  })[]>([]);
  const [totalPausas, setTotalPausas] = useState(0);
  const [pausasEmAndamento, setPausasEmAndamento] = useState(0);
  const [tempoTotalEmPausa, setTempoTotalEmPausa] = useState(0);
  const [pausasPorMotivo, setPausasPorMotivo] = useState<Record<string, { count: number, tempo: number }>>({});
  
  useEffect(() => {
    // Carregar e processar as pausas quando a ordem mudar
    carregarPausas();
  }, [ordem]);
  
  const carregarPausas = () => {
    // Array para armazenar todas as pausas
    let pausasAgregadas: (PausaRegistro & { 
      etapa?: string; 
      servico?: string;
      funcionarioNome?: string;
    })[] = [];
    
    // Obter pausas das etapas do objeto ordem.etapasAndamento
    Object.entries(ordem.etapasAndamento || {}).forEach(([etapaKey, info]) => {
      if (info?.pausas && info.pausas.length > 0) {
        info.pausas.forEach(pausa => {
          pausasAgregadas.push({
            ...pausa,
            etapa: etapaKey,
            funcionarioNome: info.funcionarioNome
          });
        });
      }
    });
    
    // Lista de etapas para verificar no localStorage
    const etapasParaVerificar: EtapaOS[] = [
      'lavagem',
      'inspecao_inicial',
      'inspecao_final',
      'retifica',
      'montagem',
      'dinamometro'
    ];
    
    // Verificar etapas no localStorage para pausas
    etapasParaVerificar.forEach(etapa => {
      // Para etapas gerais sem tipo de serviço específico
      const etapaStorageKey = generateTimerStorageKey(ordem.id, etapa);
      const etapaData = localStorage.getItem(etapaStorageKey);
      
      if (etapaData) {
        try {
          const parsed = JSON.parse(etapaData);
          if (parsed.pausas && parsed.pausas.length > 0) {
            const funcionario = ordem.etapasAndamento?.[etapa]?.funcionarioNome || '';
            
            parsed.pausas.forEach((pausa: PausaRegistro) => {
              pausasAgregadas.push({
                ...pausa,
                etapa,
                funcionarioNome: funcionario
              });
            });
          }
        } catch {
          // Ignorar erro de parsing
        }
      }
      
      // Para inspeção inicial e final, lavagem com tipos de serviço específicos
      const etapasComServico = ['lavagem', 'inspecao_inicial', 'inspecao_final'];
      if (etapasComServico.includes(etapa)) {
        const tiposServico = ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'];
        
        tiposServico.forEach(tipo => {
          const tipoStorageKey = generateTimerStorageKey(ordem.id, etapa, tipo);
          const tipoData = localStorage.getItem(tipoStorageKey);
          
          if (tipoData) {
            try {
              const parsed = JSON.parse(tipoData);
              if (parsed.pausas && parsed.pausas.length > 0) {
                const etapaKey = `${etapa}_${tipo}`;
                const etapaInfo = ordem.etapasAndamento?.[etapaKey as any] || ordem.etapasAndamento?.[etapa];
                const funcionario = etapaInfo?.funcionarioNome || '';
                
                parsed.pausas.forEach((pausa: PausaRegistro) => {
                  pausasAgregadas.push({
                    ...pausa,
                    etapa: etapaKey,
                    funcionarioNome: funcionario
                  });
                });
              }
            } catch {
              // Ignorar erro de parsing
            }
          }
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
                ...pausa,
                servico: servico.tipo,
                funcionarioNome: servico.funcionarioNome
              });
            });
          }
        } catch {
          // Ignorar erro de parsing
        }
      }
    });
    
    // Ordenar pausas por data (mais recentes primeiro)
    pausasAgregadas.sort((a, b) => b.inicio - a.inicio);
    
    setTodasPausas(pausasAgregadas);
    setTotalPausas(pausasAgregadas.length);
    
    // Contar pausas em andamento
    const emAndamento = pausasAgregadas.filter(item => !item.fim).length;
    setPausasEmAndamento(emAndamento);
    
    // Calcular tempo total em pausa (apenas pausas finalizadas)
    const tempoTotal = pausasAgregadas
      .filter(item => item.fim)
      .reduce((acc, item) => acc + ((item.fim || 0) - item.inicio), 0);
    
    setTempoTotalEmPausa(tempoTotal);
    
    // Agrupar pausas por motivo para estatísticas
    const porMotivo = pausasAgregadas.reduce((acc, item) => {
      const motivo = item.motivo || "Sem motivo";
      if (!acc[motivo]) {
        acc[motivo] = { count: 0, tempo: 0 };
      }
      acc[motivo].count += 1;
      if (item.fim) {
        acc[motivo].tempo += (item.fim - item.inicio);
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

  const formatarEtapa = (etapaKey: string): string => {
    const labels: Record<string, string> = {
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
    return labels[etapaKey] || etapaKey;
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
              {todasPausas.map((pausa, idx) => (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {pausa.motivo && (
                      <p className="text-sm font-medium">Motivo: {pausa.motivo}</p>
                    )}
                    {(pausa.etapa || pausa.servico) && (
                      <p className="text-sm text-muted-foreground">
                        {pausa.etapa ? `Etapa: ${formatarEtapa(pausa.etapa)}` : 
                         pausa.servico ? `Serviço: ${formatarEtapa(pausa.servico)}` : ''}
                      </p>
                    )}
                    {pausa.funcionarioNome && (
                      <p className="text-sm flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        Funcionário: {pausa.funcionarioNome}
                      </p>
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
