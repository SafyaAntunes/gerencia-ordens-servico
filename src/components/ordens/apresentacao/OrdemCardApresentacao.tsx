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

  return (
    <Card
      role="article"
      onClick={onClick}
      className="relative p-4 cursor-grab select-none hover:shadow-lg transition-shadow"
    >
      {/* Número da prioridade */}
      <div className="absolute top-2 right-2">
        <Badge className="text-base px-3 py-1" variant="secondary">#{prioridadeNumero}</Badge>
      </div>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <h3 className="text-xl font-bold truncate">{ordem.nome}</h3>
          <p className="text-sm text-muted-foreground truncate">OS #{ordem.id}</p>
        </div>
        <StatusBadge status={ordem.status} />
      </div>

      {/* Cliente e prioridade */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-base font-medium truncate">{ordem.cliente?.nome}</p>
        <Badge variant={prioridadeVariant}>{ordem.prioridade}</Badge>
      </div>

      {/* Progresso */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Progresso</span>
          <span>{progresso}%</span>
        </div>
        <Progress value={progresso} className="h-3" />
      </div>

      {/* Previsão */}
      <div className="mt-3 text-sm text-muted-foreground">Previsão de entrega: {previsao}</div>
    </Card>
  );
}
