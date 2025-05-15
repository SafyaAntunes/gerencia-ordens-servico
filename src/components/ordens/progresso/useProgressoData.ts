import { useState, useEffect } from "react";
import { OrdemServico, EtapaOS } from "@/types/ordens";
import { isValid } from "date-fns";

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
    // Consideramos apenas as etapas: retifica, montagem, dinamometro
    const etapas: EtapaOS[] = ["retifica", "montagem", "dinamometro"];
    
    const progressos = etapas.map(etapa => {
      if (etapa === 'retifica') {
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
        // Validate both dates before calculation
        const inicioDate = new Date(registro.inicio);
        const fimDate = new Date(registro.fim);
        
        if (isValid(inicioDate) && isValid(fimDate)) {
          const duracao = fimDate.getTime() - inicioDate.getTime();
          if (duracao > 0) { // Ensure duration is positive
            total += duracao;
            
            const etapaKey = registro.etapa;
            temposPorEtapa[etapaKey] = (temposPorEtapa[etapaKey] || 0) + duracao;
          }
        }
      }
    });
    
    // Considerar todos os serviços, incluindo lavagem e inspeção como serviços normais
    ordem.servicos.forEach(servico => {
      const servicoTipo = servico.tipo;
      const storageKey = `timer_${ordem.id}_${servicoTipo}`;
      const data = localStorage.getItem(storageKey);
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.totalTime && typeof parsed.totalTime === 'number') {
            total += parsed.totalTime;
            temposPorEtapa[servicoTipo] = (temposPorEtapa[servicoTipo] || 0) + parsed.totalTime;
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
    
    // Agora consideramos o tempo estimado de todos os serviços
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
    
    setTempoEstimado(total);
  };
  
  const calcularDiasEmAndamento = () => {
    try {
      // Validate the date before calculation
      const dataAbertura = ordem.dataAbertura ? new Date(ordem.dataAbertura) : null;
      
      if (!dataAbertura || !isValid(dataAbertura)) {
        console.error("Data de abertura inválida:", ordem.dataAbertura);
        setDiasEmAndamento(0);
        return;
      }
      
      const hoje = new Date();
      const dataAberturaMs = dataAbertura.getTime();
      const hojeMs = hoje.getTime();
      
      // Ensure we have valid timestamps
      if (isNaN(dataAberturaMs) || isNaN(hojeMs)) {
        console.error("Timestamp inválido calculado de datas:", { dataAbertura, hoje });
        setDiasEmAndamento(0);
        return;
      }
      
      const diasTotais = Math.max(0, Math.ceil((hojeMs - dataAberturaMs) / (1000 * 60 * 60 * 24)));
      setDiasEmAndamento(diasTotais);
    } catch (error) {
      console.error("Erro ao calcular dias em andamento:", error);
      setDiasEmAndamento(0);
    }
  };
  
  const calcularProgressoTotal = () => {
    // Apenas as etapas de retífica, montagem e dinamômetro são consideradas como etapas
    const etapasRelevantes = progressoEtapas.filter(etapa => {
      if (etapa.etapa === "montagem") {
        return ordem.servicos.some(s => s.tipo === "montagem");
      } else if (etapa.etapa === "dinamometro") {
        return ordem.servicos.some(s => s.tipo === "dinamometro");
      } else if (etapa.etapa === "retifica") {
        return ordem.servicos.some(s => 
          ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo)
        );
      }
      return false;
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
    const tiposServico: Record<string, string> = {
      bloco: "Bloco", 
      biela: "Biela",
      cabecote: "Cabeçote", 
      virabrequim: "Virabrequim", 
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      inspecao_final: "Inspeção Final"
    };
    
    return tiposServico[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ');
  };
  
  const formatarTempo = (ms: number) => {
    if (typeof ms !== 'number' || isNaN(ms)) {
      console.error("Valor inválido para formatarTempo:", ms);
      return "0h 0m 0s";
    }
    
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
