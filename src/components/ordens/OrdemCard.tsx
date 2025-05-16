import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OrdemServico } from "@/types/ordens";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { OrderProgress } from "./OrderProgress";

type OrdemCardProps = {
  ordem: OrdemServico;
  onClick?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
};

export function OrdemCard({ 
  ordem, 
  onClick, 
  isSelectable = false, 
  isSelected = false 
}: OrdemCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  
  if (!ordem) return <OrdemCardSkeleton />;
  
  const isAtrasada = new Date() > ordem.dataPrevistaEntrega && 
    !['finalizado', 'entregue'].includes(ordem.status);
    
  // Calculate service types for display
  const servicosAtivos = ordem.servicos
    .filter(servico => !servico.concluido)
    .map(servico => servico.tipo);

  const servicosConcluidos = ordem.servicos
    .filter(servico => servico.concluido)
    .map(servico => servico.tipo);
    
  const isRetifica = ordem.servicos.some(servico => 
    ["bloco", "biela", "cabecote", "virabrequim", "eixo_comando"].includes(servico.tipo)
  );
  
  const isMontagem = ordem.servicos.some(servico => servico.tipo === "montagem");
  
  const isDinamometro = ordem.servicos.some(servico => servico.tipo === "dinamometro");
  
  // Estimate stage progress
  const getProgressValue = () => {
    // If ordem has progressoEtapas property, use it
    if (typeof ordem.progressoEtapas === 'number') {
      return ordem.progressoEtapas;
    }
    
    // Otherwise calculate based on status
    if (ordem.status === "orcamento") return 0.05;
    if (ordem.status === "aguardando_aprovacao") return 0.1;
    if (ordem.status === "autorizado") return 0.15;
    if (ordem.status === "executando_servico") return 0.5; // Updated from "fabricacao"
    if (ordem.status === "aguardando_peca_cliente" || ordem.status === "aguardando_peca_interno") return 0.7;
    if (ordem.status === "finalizado") return 0.9;
    if (ordem.status === "entregue") return 1;
    
    return 0;
  };
  
  const progressBarValue = getProgressValue();
  
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 h-full flex flex-col",
        isHovering && "shadow-md transform -translate-y-1",
        isSelectable && "border-2",
        isSelected && "border-primary",
        isAtrasada && "border-red-300"
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium truncate max-w-[260px]">
            {ordem.nome}
          </h3>
          <StatusBadge status={ordem.status} size="sm" />
        </div>
        
        <div className="flex items-center mb-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-1" />
          <span className="truncate">{
            ordem.dataPrevistaEntrega 
              ? format(ordem.dataPrevistaEntrega, "dd/MM/yy", { locale: ptBR })
              : "Sem data"
          }</span>
          
          {isAtrasada && (
            <Badge variant="outline" className="ml-2 bg-red-100 text-red-700 border-red-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Atrasada
            </Badge>
          )}
        </div>
        
        <p className="text-sm mb-2 truncate">
          {ordem.cliente?.nome || "Cliente não definido"}
        </p>
        
        <div className="mt-auto">
          <div className="mb-2">
            <OrderProgress value={progressBarValue} />
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {isRetifica && (
              <Badge variant="outline" className="bg-gray-100">
                Retífica
              </Badge>
            )}
            
            {isMontagem && (
              <Badge variant="outline" className="bg-blue-100">
                Montagem
              </Badge>
            )}
            
            {isDinamometro && (
              <Badge variant="outline" className="bg-amber-100">
                Dinamômetro
              </Badge>
            )}
            
            <Badge variant={ordem.prioridade === "alta" || ordem.prioridade === "urgente" ? "outline" : "outline"} 
              className={cn("ml-auto",
                ordem.prioridade === "baixa" && "bg-green-100 text-green-700", 
                ordem.prioridade === "media" && "bg-blue-100 text-blue-700",
                ordem.prioridade === "alta" && "bg-orange-100 text-orange-700",
                ordem.prioridade === "urgente" && "bg-red-100 text-red-700"
              )}
            >
              {ordem.prioridade === "baixa" && "Baixa"}
              {ordem.prioridade === "media" && "Média"}
              {ordem.prioridade === "alta" && "Alta"}
              {ordem.prioridade === "urgente" && "Urgente"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrdemCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-36 mb-2" />
        <Skeleton className="h-4 w-40 mb-2" />
        <div className="mt-auto">
          <Skeleton className="h-2 w-full mb-2" />
          <div className="flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
