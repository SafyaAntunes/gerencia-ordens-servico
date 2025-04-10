
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Calendar, ArrowRight, Settings, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdemServico, EtapaOS } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

// Lista de motores conhecidos para exibição
const MOTORES_DISPLAY: Record<string, string> = {
  "101": "Ford Zetec Rocam 1.0",
  "102": "Ford Zetec Rocam 1.6",
  "201": "VW EA111 1.0",
  "202": "VW EA211 1.6",
  "301": "Fiat Fire 1.0",
  "302": "Fiat E.torQ 1.6",
  "401": "GM Econo.Flex 1.0",
  "402": "GM Family 1.4",
  "501": "Mercedes OM 366",
  "502": "Scania DC13",
};

interface OrdemCardProps {
  ordem: OrdemServico;
  onClick?: () => void;
}

export default function OrdemCard({ ordem, onClick }: OrdemCardProps) {
  const navigate = useNavigate();
  
  // Guard clause: if ordem is undefined, render a placeholder or nothing
  if (!ordem) {
    return null;
  }
  
  // Safely access cliente
  const clienteNome = ordem.cliente?.nome || "Cliente não especificado";
  
  // Identificar o motor selecionado se houver
  const motorInfo = ordem.motorId ? MOTORES_DISPLAY[ordem.motorId] || "Motor #" + ordem.motorId : null;
  
  // Contador das etapas concluídas e cálculo do progresso
  let progresso = 0;
  
  // Se tiver progresso já calculado, usa o valor armazenado
  if (ordem.progressoEtapas !== undefined) {
    progresso = Math.round(ordem.progressoEtapas * 100);
  } else {
    // Calcula o progresso com base nas etapas concluídas
    let etapas: EtapaOS[] = ["lavagem", "inspecao_inicial"];
    
    // Adiciona retífica se tiver serviços relacionados
    if (ordem.servicos?.some(s => 
      ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo))) {
      etapas.push("retifica");
    }
    
    // Adiciona montagem se selecionada
    if (ordem.servicos?.some(s => s.tipo === "montagem")) {
      etapas.push("montagem");
    }
    
    // Adiciona dinamômetro se selecionado
    if (ordem.servicos?.some(s => s.tipo === "dinamometro")) {
      etapas.push("dinamometro");
    }
    
    // Adiciona inspeção final
    etapas.push("inspecao_final");
    
    // Contar o total de itens a serem considerados no progresso
    const totalEtapas = etapas.length;
    const totalServicos = ordem.servicos?.length || 0;
    const totalItens = totalEtapas + totalServicos;
    
    if (totalItens === 0) {
      progresso = 0;
    } else {
      // Contar etapas concluídas
      const etapasConcluidas = etapas.filter(etapa => 
        ordem.etapasAndamento?.[etapa]?.concluido
      ).length;
      
      // Contar serviços concluídos
      const servicosConcluidos = ordem.servicos?.filter(servico => servico.concluido).length || 0;
      
      // Calcular percentual
      const itensConcluidos = etapasConcluidas + servicosConcluidos;
      progresso = Math.round((itensConcluidos / totalItens) * 100);
    }
  }
  
  const handleNavigateToDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/ordens/${ordem.id}`);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/ordens/${ordem.id}`);
    }
  };
  
  return (
    <Card 
      className="card-hover cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            {/* OS number displayed prominently first */}
            <p className="text-sm font-bold flex items-center gap-1">
              <Hash className="h-4 w-4" />
              OS: {ordem.id}
            </p>
            
            <CardTitle className="text-lg mt-1">{ordem.nome || "Sem título"}</CardTitle>
            
            <p className="text-sm text-muted-foreground mt-1">
              Cliente: {clienteNome}
            </p>
            {motorInfo && (
              <p className="text-xs flex items-center gap-1 mt-1">
                <Settings className="h-3 w-3" />
                {motorInfo}
              </p>
            )}
          </div>
          <StatusBadge status={ordem.prioridade || "media"} />
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {ordem.dataAbertura ? 
                format(new Date(ordem.dataAbertura), "dd MMM yyyy", { locale: ptBR }) :
                "Data não definida"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Previsão: {ordem.dataPrevistaEntrega ? 
                format(new Date(ordem.dataPrevistaEntrega), "dd MMM yyyy", { locale: ptBR }) :
                "Não definida"}
            </span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-xs text-muted-foreground">{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>
        
        <div className="mt-3">
          <StatusBadge status={ordem.status || "orcamento"} size="md" />
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="flex justify-between pt-3">
        <div className="flex flex-wrap gap-1">
          {(ordem.servicos || []).map((servico, index) => (
            <span 
              key={index}
              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
            >
              {servico.tipo === 'bloco' && 'Bloco'}
              {servico.tipo === 'biela' && 'Biela'}
              {servico.tipo === 'cabecote' && 'Cabeçote'}
              {servico.tipo === 'virabrequim' && 'Virabrequim'}
              {servico.tipo === 'eixo_comando' && 'Eixo de Comando'}
              {servico.tipo === 'montagem' && 'Montagem'}
              {servico.tipo === 'dinamometro' && 'Dinamômetro'}
            </span>
          ))}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={handleNavigateToDetail}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
