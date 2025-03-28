
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Calendar, ArrowRight, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdemServico } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";

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
  
  // Contador das etapas concluídas
  const totalEtapas = 6; // Número total de etapas
  const etapasConcluidas = Object.values(ordem.etapasAndamento || {}).filter(
    (etapa) => etapa?.concluido
  ).length;
  
  // Cálculo do progresso
  const progresso = Math.round((etapasConcluidas / totalEtapas) * 100);
  
  const handleNavigateToDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/ordens/${ordem.id}`);
  };
  
  return (
    <Card 
      className="card-hover cursor-pointer overflow-hidden"
      onClick={onClick || (() => navigate(`/ordens/${ordem.id}`))}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{ordem.nome || "Sem título"}</CardTitle>
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
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
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
