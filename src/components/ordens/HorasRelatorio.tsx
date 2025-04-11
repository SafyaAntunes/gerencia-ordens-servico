
import { useState, useEffect } from "react";
import { OrdemServico, EtapaOS, PausaRegistro } from "@/types/ordens";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, FileTextIcon, Clock } from "lucide-react";
import { formatTime } from "@/utils/timerUtils";

interface HorasRelatorioProps {
  ordem: OrdemServico;
}

interface EtapaTempo {
  etapa: string;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome: string;
  tempoTotal: number;
  iniciado?: Date;
  finalizado?: Date;
  pausas: PausaRegistro[];
  servicoTipo?: string;
}

export default function HorasRelatorio({ ordem }: HorasRelatorioProps) {
  const [etapasTempo, setEtapasTempo] = useState<EtapaTempo[]>([]);
  const [tempoTotalOS, setTempoTotalOS] = useState(0);
  const [tempoEfetivo, setTempoEfetivo] = useState(0);
  const [tempoPausas, setTempoPausas] = useState(0);

  useEffect(() => {
    if (!ordem) return;
    
    // Processar todas as etapas registradas na ordem
    const dadosEtapas: EtapaTempo[] = [];
    let totalTempo = 0;
    let totalPausas = 0;
    
    // Percorrer todas as etapas armazenadas na ordem
    Object.entries(ordem.etapasAndamento).forEach(([etapaKey, etapaInfo]) => {
      if (etapaInfo.iniciado) {
        // Verificar se é uma etapa composta (com tipo de serviço)
        let etapaNome = formatarEtapa(etapaKey.split('_')[0] as EtapaOS);
        let servicoTipo: string | undefined = undefined;
        
        if (etapaKey.includes('_')) {
          const partes = etapaKey.split('_');
          const etapaBase = partes[0] as EtapaOS;
          servicoTipo = partes.slice(1).join('_');
          etapaNome = `${formatarEtapa(etapaBase)} - ${formatarTipoServico(servicoTipo)}`;
        }
        
        // Calcular tempo total da etapa
        let tempoEtapa = 0;
        let tempoPausasEtapa = 0;
        
        if (etapaInfo.iniciado && etapaInfo.finalizado) {
          // Etapa completa
          tempoEtapa = etapaInfo.finalizado.getTime() - etapaInfo.iniciado.getTime();
        } else if (etapaInfo.iniciado) {
          // Etapa em andamento
          tempoEtapa = Date.now() - etapaInfo.iniciado.getTime();
        }
        
        // Subtrair tempo de pausas
        if (etapaInfo.pausas && etapaInfo.pausas.length > 0) {
          etapaInfo.pausas.forEach(pausa => {
            const inicioPausa = pausa.inicio;
            const fimPausa = pausa.fim || Date.now();
            const tempoPausa = fimPausa - inicioPausa;
            tempoPausasEtapa += tempoPausa;
          });
        }
        
        // Tempo efetivo é o tempo total menos o tempo de pausas
        const tempoEfetivoEtapa = Math.max(0, tempoEtapa - tempoPausasEtapa);
        
        // Adicionar aos totais
        totalTempo += tempoEfetivoEtapa;
        totalPausas += tempoPausasEtapa;
        
        // Adicionar etapa processada
        dadosEtapas.push({
          etapa: etapaKey,
          etapaNome,
          funcionarioId: etapaInfo.funcionarioId || "",
          funcionarioNome: etapaInfo.funcionarioNome || "Não atribuído",
          tempoTotal: tempoEfetivoEtapa,
          iniciado: etapaInfo.iniciado,
          finalizado: etapaInfo.finalizado,
          pausas: etapaInfo.pausas || [],
          servicoTipo
        });
      }
    });
    
    // Ordenar por etapa e depois por tipo de serviço
    dadosEtapas.sort((a, b) => {
      if (a.etapa.split('_')[0] !== b.etapa.split('_')[0]) {
        return a.etapa.localeCompare(b.etapa);
      }
      return (a.servicoTipo || "").localeCompare(b.servicoTipo || "");
    });
    
    setEtapasTempo(dadosEtapas);
    setTempoTotalOS(totalTempo + totalPausas);
    setTempoEfetivo(totalTempo);
    setTempoPausas(totalPausas);
  }, [ordem]);

  // Função para formatação dos nomes das etapas
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
  
  // Função para formatação dos nomes dos serviços
  const formatarTipoServico = (tipo: string): string => {
    const labels: Record<string, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro"
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileTextIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Relatório de Horas da OS</CardTitle>
          </div>
          <CardDescription>
            Detalhamento do tempo gasto em cada etapa da ordem de serviço.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-md">
              <p className="text-sm text-muted-foreground">Tempo Total</p>
              <div className="flex items-center mt-1">
                <Clock className="h-5 w-5 mr-1 text-primary" />
                <span className="text-xl font-semibold">{formatTime(tempoTotalOS)}</span>
              </div>
            </div>
            <div className="p-4 border rounded-md">
              <p className="text-sm text-muted-foreground">Tempo Efetivo</p>
              <div className="flex items-center mt-1">
                <Clock className="h-5 w-5 mr-1 text-green-500" />
                <span className="text-xl font-semibold">{formatTime(tempoEfetivo)}</span>
              </div>
            </div>
            <div className="p-4 border rounded-md">
              <p className="text-sm text-muted-foreground">Tempo em Pausas</p>
              <div className="flex items-center mt-1">
                <Clock className="h-5 w-5 mr-1 text-orange-500" />
                <span className="text-xl font-semibold">{formatTime(tempoPausas)}</span>
              </div>
            </div>
          </div>

          {etapasTempo.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Tempo Efetivo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {etapasTempo.map((etapa, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{etapa.etapaNome}</TableCell>
                    <TableCell>{etapa.funcionarioNome}</TableCell>
                    <TableCell>{formatTime(etapa.tempoTotal)}</TableCell>
                    <TableCell>
                      {etapa.finalizado ? (
                        <Badge variant="success">Concluída</Badge>
                      ) : (
                        <Badge variant="outline">Em andamento</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Não há registro de tempo para esta ordem de serviço.
            </div>
          )}
          
          {/* Detalhamento das pausas */}
          {etapasTempo.some(e => e.pausas?.length > 0) && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Detalhamento das Pausas</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Duração da Pausa</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {etapasTempo.flatMap((etapa, etapaIndex) => 
                    etapa.pausas.map((pausa, pausaIndex) => {
                      const duracao = (pausa.fim || Date.now()) - pausa.inicio;
                      return (
                        <TableRow key={`${etapaIndex}-${pausaIndex}`}>
                          <TableCell className="font-medium">{etapa.etapaNome}</TableCell>
                          <TableCell>{etapa.funcionarioNome}</TableCell>
                          <TableCell>{formatTime(duracao)}</TableCell>
                          <TableCell>{pausa.motivo || "Não informado"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
