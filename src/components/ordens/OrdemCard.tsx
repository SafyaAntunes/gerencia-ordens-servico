import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Calendar, ArrowRight, Settings, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdemServico, EtapaOS } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

interface OrdemCardProps {
  ordem: OrdemServico;
  index: number;
  onReorder: (dragIndex: number, dropIndex: number) => void;
  onClick: () => void;
}

export default function OrdemCard({ ordem, index, onReorder, onClick }: OrdemCardProps) {
  const navigate = useNavigate();
  
  if (!ordem) {
    return null;
  }
  
  const clienteNome = ordem.cliente?.nome || "Cliente não especificado";
  
  let motorInfo = null;
  if (ordem.motorId && ordem.cliente?.motores) {
    const motor = ordem.cliente.motores.find(m => m.id === ordem.motorId);
    if (motor) {
      motorInfo = `${motor.marca} ${motor.modelo}${motor.numeroSerie ? ` - ${motor.numeroSerie}` : ''}${motor.ano ? ` (${motor.ano})` : ''}`;
    } else {
      motorInfo = "Motor não encontrado";
    }
  }
  
  let progresso = 0;
  
  if (ordem.progressoEtapas !== undefined) {
    progresso = Math.round(ordem.progressoEtapas * 100);
  } else {
    const etapasPossiveis: EtapaOS[] = ["lavagem", "inspecao_inicial", "retifica", "montagem", "dinamometro", "inspecao_final"];
    
    const etapasRelevantes = etapasPossiveis.filter(etapa => {
      if (etapa === "retifica") {
        return ordem.servicos?.some(s => 
          ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(s.tipo));
      } else if (etapa === "montagem") {
        return ordem.servicos?.some(s => s.tipo === "montagem");
      } else if (etapa === "dinamometro") {
        return ordem.servicos?.some(s => s.tipo === "dinamometro");
      } else if (etapa === "lavagem") {
        return ordem.servicos?.some(s => s.tipo === "lavagem");
      }
      return true;
    });
    
    const totalEtapas = etapasRelevantes.length;
    const etapasConcluidas = etapasRelevantes.filter(etapa => 
      ordem.etapasAndamento?.[etapa]?.concluido
    ).length;
    
    const servicosAtivos = ordem.servicos?.filter(s => {
      return s.subatividades?.some(sub => sub.selecionada) || true;
    }) || [];
    
    const totalServicos = servicosAtivos.length;
    const servicosConcluidos = servicosAtivos.filter(s => s.concluido).length;
    
    const pesoEtapas = 2;
    const pesoServicos = 1;
    
    const totalItens = (totalEtapas * pesoEtapas) + (totalServicos * pesoServicos);
    const itensConcluidos = (etapasConcluidas * pesoEtapas) + (servicosConcluidos * pesoServicos);
    
    progresso = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;
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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    onReorder(dragIndex, index);
  };

  return (
    <Card 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="card-hover cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold">
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
        
        {ordem.valorTotal && (
          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">Valor Total:</span>
            </div>
            <span className="text-sm font-semibold">{formatCurrency(ordem.valorTotal)}</span>
          </div>
        )}
        
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
              {servico.tipo === 'lavagem' && 'Lavagem'}
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
