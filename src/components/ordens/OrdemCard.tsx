
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdemServico } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";

interface OrdemCardProps {
  ordem: OrdemServico;
  onClick?: () => void;
}

export default function OrdemCard({ ordem, onClick }: OrdemCardProps) {
  const navigate = useNavigate();
  
  // Contador das etapas concluídas
  const totalEtapas = 6; // Número total de etapas
  const etapasConcluidas = Object.values(ordem.etapasAndamento || {}).filter(
    (etapa) => etapa?.concluido
  ).length;
  
  // Cálculo do progresso
  const progresso = Math.round((etapasConcluidas / totalEtapas) * 100);
  
  const handleClick = () => {
    console.log("Clicou na ordem:", ordem.id);
    if (onClick) {
      onClick();
    } else {
      navigate(`/ordens/${ordem.id}`);
    }
  };
  
  return (
    <Card 
      className="card-hover cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{ordem.nome}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Cliente: {ordem.cliente.nome}
            </p>
          </div>
          <StatusBadge status={ordem.prioridade} />
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(ordem.dataAbertura, "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Previsão: {format(ordem.dataPrevistaEntrega, "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-xs text-muted-foreground">{progresso}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
        
        <div className="mt-3">
          <StatusBadge status={ordem.status} size="md" />
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="flex justify-between pt-3">
        <div className="flex flex-wrap gap-1">
          {ordem.servicos.map((servico, index) => (
            <span 
              key={index}
              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
            >
              {servico.tipo === 'bloco' && 'Bloco'}
              {servico.tipo === 'biela' && 'Biela'}
              {servico.tipo === 'cabecote' && 'Cabeçote'}
              {servico.tipo === 'virabrequim' && 'Virabrequim'}
              {servico.tipo === 'eixo_comando' && 'Eixo de Comando'}
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
