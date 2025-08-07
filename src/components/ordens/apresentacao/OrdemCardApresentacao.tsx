import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrdemServico } from "@/types/ordens";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemCardApresentacaoProps {
  ordem: OrdemServico;
  prioridadeNumero: number; // 1,2,3...
  onClick?: () => void;
}

export default function OrdemCardApresentacao({ ordem, prioridadeNumero, onClick }: OrdemCardApresentacaoProps) {
  const progresso = Math.round(ordem.progressoEtapas || 0);
  const previsao = ordem.dataPrevistaEntrega
    ? formatDistanceToNow(new Date(ordem.dataPrevistaEntrega), { addSuffix: true, locale: ptBR })
    : "-";

  const prioridadeVariant =
    ordem.prioridade === "urgente"
      ? "destructive"
      : ordem.prioridade === "alta"
      ? "warning"
      : ordem.prioridade === "media"
      ? "secondary"
      : "outline";

  // Tipos de serviço para exibir
  const tiposServico = ordem.servicos?.map(s => s.tipo) || [];

  return (
    <Card
      role="article"
      onClick={onClick}
      className="relative p-3 cursor-grab select-none bg-card border-2 hover:border-primary/50 transition-colors h-fit"
    >
      {/* Número da prioridade - canto superior direito */}
      <div className="absolute -top-2 -right-2 z-10">
        <Badge className="text-lg font-bold px-3 py-1 shadow-md" variant="default">#{prioridadeNumero}</Badge>
      </div>

      {/* OS # - Primeira linha, grande e negrito */}
      <div className="mb-2">
        <h3 className="text-2xl font-bold text-foreground truncate">OS #{ordem.id}</h3>
      </div>

      {/* Cliente - Segunda linha, negrito */}
      <div className="mb-3">
        <p className="text-lg font-bold text-foreground truncate">{ordem.cliente?.nome || 'Cliente não informado'}</p>
      </div>

      {/* Status, Prioridade, Progresso - Terceira linha */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <StatusBadge status={ordem.status} />
          <Badge variant={prioridadeVariant} className="text-sm">{ordem.prioridade}</Badge>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-base font-medium">
            <span>Progresso</span>
            <span className="font-bold">{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>
      </div>

      {/* Tipos de serviço - Quarta linha */}
      <div className="mb-2">
        <div className="flex flex-wrap gap-1">
          {tiposServico.slice(0, 3).map((tipo, index) => (
            <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
              {tipo.replace('_', ' ').toUpperCase()}
            </Badge>
          ))}
          {tiposServico.length > 3 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              +{tiposServico.length - 3}
            </Badge>
          )}
        </div>
      </div>

      {/* Previsão - Última linha */}
      <div className="text-sm text-muted-foreground font-medium">
        Entrega: {previsao}
      </div>
    </Card>
  );
}
