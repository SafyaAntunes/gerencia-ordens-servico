import { useState, useEffect } from "react";
import { OrdemServico, EtapaOS } from "@/types/ordens";

export function useProgressoData(ordem: OrdemServico) {
  const [progressoEtapas, setProgressoEtapas] = useState<{etapa: EtapaOS, nome: string, progresso: number, concluida: boolean}[]>([]);
  const [progressoServicos, setProgressoServicos] = useState<{tipo: string, nome: string, progresso: number, concluido: boolean}[]>([]);
  const [tempoTotalRegistrado, setTempoTotalRegistrado] = useState(0);
  const [tempoEstimado, setTempoEstimado] = useState(0);
  const [diasEmAndamento, setDiasEmAndamento] = useState(0);
  const [temposPorEtapa, setTemposPorEtapa] = useState<Record<string, number>>({});
  
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
    const { total, temposPorEtapa: temposEtapas } = calcularTempoTotal();
    setTempoTotalRegistrado(total);
    setTemposPorEtapa(temposEtapas);
    calcularTempoEstimado();
    calcularDiasEmAndamento();
    
    verificarEtapaRetifica();
  }, [ordem]);
  
  const verificarEtapaRetifica = () => {
    if (ordem.etapasAndamento?.retifica?.concluido) return;
    
    const servicosPrincipais = ordem.servicos.filter(servico => 
      ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
    );
    
    if (servicosPrincipais.length === 0) return;
    
    const todosServicosConcluidos = servicosPrincipais.every(servico => servico.concluido);
    
    if (todosServicosConcluidos) {
      console.log("Todos os serviços de retífica estão concluídos, mas a etapa não está marcada como concluída");
    }
  };
  
  const calcularProgressoEtapas = () => {
    const etapas: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    
    const progressos = etapas.map(etapa => {
      if (etapa === 'lavagem' || etapa === 'inspecao_inicial' || etapa === 'inspecao_final') {
        const tiposServico = ordem.servicos
          .filter(s => ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(s.tipo))
          .map(s => s.tipo);
        
        const totalPecas = tiposServico.length;
        if (totalPecas === 0) return { etapa, nome: etapasNomes[etapa], progresso: 0, concluida: false };
        
        let pecasConcluidas = 0;
        tiposServico.forEach(tipo => {
          const etapaKey = `${etapa}_${tipo}` as any;
          if (ordem.etapasAndamento[etapaKey]?.concluido) {
            pecasConcluidas++;
          }
        });

        const etapaConcluida = pecasConcluidas === totalPecas || !!ordem.etapasAndamento[etapa]?.concluido;
        
        return {
          etapa,
          nome: etapasNomes[etapa],
          progresso: etapaConcluida ? 100 : Math.round((pecasConcluidas / totalPecas) * 100),
          concluida: etapaConcluida
        };
      } else if (etapa === 'retifica') {
        const etapaInfo = ordem.etapasAndamento[etapa];
        const concluida = etapaInfo?.concluido || false;
        
        if (concluida) {
          return {
            etapa,
            nome: etapasNomes[etapa],
            progresso: 100,
            concluida: true
          };
        }
        
        const servicosPrincipais = ordem.servicos.filter(servico => 
          ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
        );
        
        if (servicosPrincipais.length === 0) {
          return { etapa, nome: etapasNomes[etapa], progresso: 0, concluida: false };
        }
        
        const servicosConcluidos = servicosPrincipais.filter(servico => servico.concluido).length;
        const progresso = Math.round((servicosConcluidos / servicosPrincipais.length) * 100);
        
        const etapaConcluida = servicosConcluidos === servicosPrincipais.length;
        
        return {
          etapa,
          nome: etapasNomes[etapa],
          progresso: progresso,
          concluida: etapaConcluida
        };
      } else {
        const etapaInfo = ordem.etapasAndamento[etapa];
        const concluida = etapaInfo?.concluido || false;
        
        return {
          etapa,
          nome: etapasNomes[etapa],
          progresso: concluida ? 100 : (etapaInfo?.iniciado ? 50 : 0),
          concluida
        };
      }
    });
    
    setProgressoEtapas(progressos);
  };
  
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
  
  const calcularTempoTotal = () => {
    let total = 0;
    let temposPorEtapa: Record<string, number> = {};
    
    ordem.tempoRegistros?.forEach(registro => {
      if (registro.inicio && registro.fim) {
        const duracao = new Date(registro.fim).getTime() - new Date(registro.inicio).getTime();
        total += duracao;
        
        const etapaKey = registro.etapa;
        temposPorEtapa[etapaKey] = (temposPorEtapa[etapaKey] || 0) + duracao;
      }
    });
    
    ordem.servicos.forEach(servico => {
      ['lavagem', 'inspecao_inicial', 'inspecao_final'].forEach(etapa => {
        const storageKey = `timer_${ordem.id}_${etapa}_${servico.tipo}`;
        const data = localStorage.getItem(storageKey);
        
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.totalTime) {
              total += parsed.totalTime;
              const etapaKey = etapa as EtapaOS;
              temposPorEtapa[etapaKey] = (temposPorEtapa[etapaKey] || 0) + parsed.totalTime;
            }
          } catch {
            // Ignore parsing errors
          }
        }
      });
    });
    
    ['lavagem', 'inspecao_inicial', 'retifica', 'montagem', 'dinamometro', 'inspecao_final'].forEach(etapa => {
      const storageKey = `timer_${ordem.id}_${etapa}`;
      const data = localStorage.getItem(storageKey);
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.totalTime) {
            total += parsed.totalTime;
            const etapaKey = etapa as EtapaOS;
            temposPorEtapa[etapaKey] = (temposPorEtapa[etapaKey] || 0) + parsed.totalTime;
          }
        } catch {
          // Ignore parsing errors
        }
      }
    });
    
    return { total, temposPorEtapa };
  };
  
  const calcularTempoEstimado = () => {
    if (ordem.tempoTotalEstimado) {
      setTempoEstimado(ordem.tempoTotalEstimado);
      return;
    }
    
    let total = 0;
    
    ordem.servicos.forEach(servico => {
      if (servico.subatividades) {
        servico.subatividades
          .filter(sub => sub.selecionada)
          .forEach(sub => {
            if (sub.tempoEstimado) {
              total += sub.tempoEstimado * 60 * 60 * 1000; // Converter de horas para ms
            }
          });
      }
    });
    
    Object.entries(ordem.etapasAndamento || {}).forEach(([etapaKey, dadosEtapa]) => {
      if (dadosEtapa.tempoEstimado) {
        total += dadosEtapa.tempoEstimado * 60 * 60 * 1000; // Converter horas para ms
      }
    });
    
    setTempoEstimado(total);
  };
  
  const calcularDiasEmAndamento = () => {
    const dataAbertura = new Date(ordem.dataAbertura).getTime();
    const hoje = new Date().getTime();
    const diasTotais = Math.ceil((hoje - dataAbertura) / (1000 * 60 * 60 * 24));
    
    setDiasEmAndamento(diasTotais);
  };
  
  const calcularProgressoTotal = () => {
    const etapasRelevantes = progressoEtapas.filter(etapa => {
      if (etapa.etapa === "montagem") {
        return ordem.servicos.some(s => s.tipo === "montagem");
      } else if (etapa.etapa === "dinamometro") {
        return ordem.servicos.some(s => s.tipo === "dinamometro");
      }
      return true;
    });
    
    const etapasPontosPossiveis = etapasRelevantes.length * 2;
    const etapasPontosObtidos = etapasRelevantes.reduce((total, etapa) => 
      total + (etapa.concluida ? 2 : (etapa.progresso > 0 ? 1 : 0)), 0);
    
    const servicosAtivos = progressoServicos.filter(s => {
      const servico = ordem.servicos.find(serv => serv.tipo === s.tipo);
      return servico && servico.subatividades && 
             servico.subatividades.some(sub => sub.selecionada);
    });
    const servicosPontosPossiveis = servicosAtivos.length;
    const servicosPontosObtidos = servicosAtivos.filter(s => s.concluido).length;
    
    const pontosTotaisPossiveis = etapasPontosPossiveis + servicosPontosPossiveis;
    const pontosTotaisObtidos = etapasPontosObtidos + servicosPontosObtidos;
    
    return pontosTotaisPossiveis > 0 
      ? Math.round((pontosTotaisObtidos / pontosTotaisPossiveis) * 100) 
      : 0;
  };
  
  const formatarTipoServico = (tipo: string): string => {
    return tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ');
  };
  
  const formatarTempo = (ms: number) => {
    const horas = Math.floor(ms / (1000 * 60 * 60));
    const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${horas}h ${minutos}m ${segundos}s`;
  };
  
  return {
    progressoEtapas,
    progressoServicos,
    tempoTotalRegistrado,
    tempoEstimado,
    diasEmAndamento,
    temposPorEtapa,
    etapasNomes,
    progressoTotal: calcularProgressoTotal(),
    formatarTempo
  };
}
